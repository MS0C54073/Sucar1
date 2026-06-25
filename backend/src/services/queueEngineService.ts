import { supabase } from '../config/supabase';
import { DBService } from './db-service';
import { WashingBayService } from './washingBayService';
import {
  assertWashTransition,
  type WashOperationalStatus,
} from '../domain/washOperationalStatus';
import { NotificationService } from './notificationService';
import {
  ensureOperatorSchema,
  isMissingOperatorTableError,
  isOperatorSchemaReady,
} from './operatorSchemaService';

const DEFAULT_DURATION = 30;

export class QueueEngineService {
  /** Ensure bays exist and return full operations dashboard payload */
  static async getOperationsDashboard(carWashId: string) {
    if (!(await isOperatorSchemaReady())) {
      await ensureOperatorSchema();
    }

    try {
      if (await isOperatorSchemaReady()) {
        return await this.getOperationsDashboardFull(carWashId);
      }
      return await this.getOperationsDashboardLegacy(carWashId);
    } catch (err) {
      if (isMissingOperatorTableError(err)) {
        return await this.getOperationsDashboardLegacy(carWashId);
      }
      throw err;
    }
  }

  private static async getOperationsDashboardFull(carWashId: string) {
    const { data: userRow } = await supabase
      .from('users')
      .select('washing_bays')
      .eq('id', carWashId)
      .single();
    const bayCount = Math.max(1, userRow?.washing_bays ?? 3);
    await WashingBayService.ensureBaysForCarWash(carWashId, bayCount);

    const [bays, queueRows, pendingPayments, sessions] = await Promise.all([
      WashingBayService.listBays(carWashId),
      this.fetchQueue(carWashId),
      this.fetchPendingPayments(carWashId),
      this.fetchActiveSessions(carWashId),
    ]);

    const metrics = this.computeMetrics(bays, queueRows, sessions);
    const baysEnriched = await this.enrichBays(bays, sessions);

    return {
      bays: baysEnriched,
      queue: queueRows
        .filter(
          (q) =>
            q.operational_status === 'WAITING' ||
            (!q.operational_status && q.status === 'waiting')
        )
        .map((q) => this.mapQueueRow(q)),
      pendingPayments,
      activity: {
        activeSessions: sessions.filter((s) =>
          ['ASSIGNED_TO_BAY', 'WASH_IN_PROGRESS', 'PAYMENT_PENDING', 'PAYMENT_UPLOADED'].includes(
            s.operational_status
          )
        ),
        completedToday: sessions.filter((s) => s.operational_status === 'COMPLETED').length,
        waitingCount: queueRows.filter((q) => q.operational_status === 'WAITING').length,
        metrics,
      },
      updatedAt: new Date().toISOString(),
      legacyMode: false,
    };
  }

  /** Fallback when washing_bays / wash_sessions tables are not migrated yet */
  private static async getOperationsDashboardLegacy(carWashId: string) {
    const { data: userRow } = await supabase
      .from('users')
      .select('washing_bays')
      .eq('id', carWashId)
      .single();
    const bayCount = Math.max(1, userRow?.washing_bays ?? 3);

    const { data: queueRows, error: queueErr } = await supabase
      .from('car_wash_queue')
      .select(
        `
        *,
        booking:bookings(
          id, status, payment_status, total_amount, booking_type,
          vehicle:vehicles(make, model, plate_no),
          client:users!bookings_client_id_fkey(id, name, phone),
          service:services(name, price)
        )
      `
      )
      .eq('car_wash_id', carWashId)
      .neq('status', 'completed')
      .order('position', { ascending: true });

    if (queueErr) throw queueErr;

    const rows = queueRows || [];
    const inProgress = rows.filter((q) => q.status === 'in_progress');
    const waiting = rows.filter((q) => q.status === 'waiting');

    const bays = Array.from({ length: bayCount }, (_, i) => {
      const entry = inProgress[i];
      const booking = entry?.booking as Record<string, unknown> | undefined;
      const vehicle = booking?.vehicle as Record<string, unknown> | undefined;
      const client = booking?.client as Record<string, unknown> | undefined;
      return {
        id: `legacy-bay-${i + 1}`,
        bayNumber: i + 1,
        name: `Bay ${i + 1}`,
        status: entry ? 'occupied' : 'available',
        sessionId: entry?.id,
        operationalStatus: entry ? 'WASH_IN_PROGRESS' : undefined,
        remainingMinutes: entry?.service_duration_minutes ?? null,
        paymentStatus: booking?.payment_status as string | undefined,
        clientName: client?.name as string | undefined,
        plateNo: (vehicle?.plate_no || vehicle?.plateNo) as string | undefined,
      };
    });

    let pendingPayments: Awaited<ReturnType<typeof QueueEngineService.fetchPendingPayments>> = [];
    try {
      pendingPayments = await this.fetchPendingPayments(carWashId);
    } catch {
      pendingPayments = [];
    }

    const metrics = {
      availableBays: bays.filter((b) => b.status === 'available').length,
      waiting: waiting.length,
      inWash: inProgress.length,
      delayed: 0,
      utilization: bayCount ? inProgress.length / bayCount : 0,
    };

    return {
      bays,
      queue: waiting.map((q) => this.mapQueueRow(q as Record<string, unknown>)),
      pendingPayments,
      activity: {
        activeSessions: inProgress.map((q) => ({
          id: q.id,
          operational_status: 'WASH_IN_PROGRESS',
          booking_id: q.booking_id,
        })),
        completedToday: 0,
        waitingCount: waiting.length,
        metrics,
      },
      updatedAt: new Date().toISOString(),
      legacyMode: true,
      setupHint:
        'Run backend/migrations/operator-queue-bays-sessions.sql in Supabase SQL Editor (or set DATABASE_URL and restart API) for full bay assignment.',
    };
  }

  /** Check-in vehicle → WAITING in queue (FIFO ticket) */
  static async checkIn(
    bookingId: string,
    carWashId: string,
    options?: {
    priority?: number;
    isExpress?: boolean;
    durationMinutes?: number;
  }) {
    const booking = await DBService.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const bookingCarWashId =
      typeof booking.carWashId === 'object'
        ? (booking.carWashId as { id?: string })?.id
        : booking.carWashId;
    if (String(bookingCarWashId) !== String(carWashId)) {
      throw new Error('Booking does not belong to this car wash');
    }

    const duration = options?.durationMinutes ?? DEFAULT_DURATION;
    const priority = options?.priority ?? 0;
    const isExpress = options?.isExpress ?? false;

    let session = await this.getSessionByBooking(bookingId);
    if (!session) {
      const { data, error } = await supabase
        .from('wash_sessions')
        .insert({
          car_wash_id: carWashId,
          booking_id: bookingId,
          operational_status: 'CHECKED_IN',
          service_duration_minutes: duration,
          priority,
          is_express: isExpress,
          checked_in_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      session = data;
      assertWashTransition('CHECKED_IN', 'WAITING');
    }

    const { data: sessionUpdated, error: sessErr } = await supabase
      .from('wash_sessions')
      .update({ operational_status: 'WAITING', updated_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single();
    if (sessErr) throw sessErr;

    const existingQueue = await this.getQueueRowByBooking(bookingId);
    let queueRow = existingQueue;
    if (!existingQueue) {
      queueRow = await this.insertQueueTicket({
        carWashId,
        bookingId,
        sessionId: sessionUpdated.id,
        duration,
        priority,
        isExpress,
      });
    } else {
      await supabase
        .from('car_wash_queue')
        .update({
          wash_session_id: sessionUpdated.id,
          operational_status: 'WAITING',
          priority,
          is_express: isExpress,
        })
        .eq('id', existingQueue.id);
    }

    await DBService.updateBooking(bookingId, {
      status: 'waiting_bay',
      queuePosition: queueRow?.position,
    });

    await this.recalculateQueue(carWashId);
    await this.tryAssignNextBay(carWashId);

    return { session: sessionUpdated, queue: queueRow };
  }

  /** Recalculate positions: express first, then priority desc, then FIFO by checked_in */
  static async recalculateQueue(carWashId: string) {
    const { data: waiting, error } = await supabase
      .from('car_wash_queue')
      .select('id, booking_id, service_duration_minutes, priority, is_express, created_at, wash_session_id, operational_status')
      .eq('car_wash_id', carWashId)
      .in('operational_status', ['WAITING', null])
      .neq('status', 'completed');

    if (error) throw error;

    const rows = (waiting || []).filter(
      (r) => !r.operational_status || r.operational_status === 'WAITING'
    );

    rows.sort((a, b) => {
      if (a.is_express !== b.is_express) return a.is_express ? -1 : 1;
      if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const inProgress = await supabase
      .from('car_wash_queue')
      .select('service_duration_minutes, estimated_completion_time')
      .eq('car_wash_id', carWashId)
      .eq('status', 'in_progress');

    let cursor = new Date();
    if (inProgress.data?.length) {
      const latest = inProgress.data.reduce((max, row) => {
        const t = row.estimated_completion_time
          ? new Date(row.estimated_completion_time).getTime()
          : 0;
        return t > max ? t : max;
      }, 0);
      if (latest > cursor.getTime()) cursor = new Date(latest);
    }

    let position = 1;
    for (const row of rows) {
      const duration = row.service_duration_minutes || DEFAULT_DURATION;
      const estimatedStart = new Date(cursor);
      const estimatedEnd = new Date(cursor.getTime() + duration * 60000);

      await supabase
        .from('car_wash_queue')
        .update({
          position,
          estimated_start_time: estimatedStart.toISOString(),
          estimated_completion_time: estimatedEnd.toISOString(),
        })
        .eq('id', row.id);

      await DBService.updateBooking(row.booking_id, {
        queuePosition: position,
        estimatedWaitTime: Math.max(
          0,
          Math.ceil((estimatedStart.getTime() - Date.now()) / 60000)
        ),
      });

      cursor = estimatedEnd;
      position += 1;
    }

    return { waitingCount: rows.length };
  }

  /** Assign next waiting vehicle to first available bay */
  static async tryAssignNextBay(carWashId: string) {
    const bay = await WashingBayService.getAvailableBay(carWashId);
    if (!bay) return { assigned: false, reason: 'no_available_bay' };

    const { data: nextRow, error } = await supabase
      .from('car_wash_queue')
      .select('*')
      .eq('car_wash_id', carWashId)
      .or('operational_status.eq.WAITING,operational_status.is.null')
      .eq('status', 'waiting')
      .order('is_express', { ascending: false })
      .order('priority', { ascending: false })
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!nextRow) return { assigned: false, reason: 'queue_empty' };

    return this.assignQueueEntryToBay(carWashId, nextRow.id, bay.id);
  }

  static async assignQueueEntryToBay(carWashId: string, queueId: string, bayId: string) {
    const { data: queueRow, error: qErr } = await supabase
      .from('car_wash_queue')
      .select('*')
      .eq('id', queueId)
      .single();
    if (qErr || !queueRow) throw new Error('Queue entry not found');

    const sessionId = queueRow.wash_session_id;
    if (!sessionId) throw new Error('Wash session missing for queue entry');

    const session = await this.getSessionById(sessionId);
    assertWashTransition(session.operational_status, 'ASSIGNED_TO_BAY');

    await WashingBayService.occupyBay(bayId, sessionId);

    const now = new Date();
    const duration = queueRow.service_duration_minutes || DEFAULT_DURATION;
    const washEnds = new Date(now.getTime() + duration * 60000);

    await supabase
      .from('wash_sessions')
      .update({
        operational_status: 'ASSIGNED_TO_BAY',
        bay_id: bayId,
        updated_at: now.toISOString(),
      })
      .eq('id', sessionId);

    await supabase
      .from('car_wash_queue')
      .update({
        bay_id: bayId,
        operational_status: 'ASSIGNED_TO_BAY',
        status: 'in_progress',
      })
      .eq('id', queueId);

    await DBService.updateBooking(queueRow.booking_id, { status: 'at_wash' });

    return {
      assigned: true,
      bayId,
      queueId,
      sessionId,
      operationalStatus: 'ASSIGNED_TO_BAY',
    };
  }

  static async startWashOnBay(carWashId: string, bayId: string) {
    const { data: bay } = await supabase
      .from('washing_bays')
      .select('current_wash_session_id')
      .eq('id', bayId)
      .single();

    if (!bay?.current_wash_session_id) throw new Error('No session on bay');

    const session = await this.getSessionById(bay.current_wash_session_id);
    assertWashTransition(session.operational_status, 'WASH_IN_PROGRESS');

    const now = new Date();
    const duration = session.service_duration_minutes || DEFAULT_DURATION;
    const washEnds = new Date(now.getTime() + duration * 60000);

    const { data: updated, error } = await supabase
      .from('wash_sessions')
      .update({
        operational_status: 'WASH_IN_PROGRESS',
        wash_started_at: now.toISOString(),
        wash_ends_at: washEnds.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', session.id)
      .select()
      .single();
    if (error) throw error;

    await supabase
      .from('car_wash_queue')
      .update({ operational_status: 'WASH_IN_PROGRESS' })
      .eq('wash_session_id', session.id);

    await DBService.updateBooking(session.booking_id, {
      status: 'washing_bay',
      washStartTime: now.toISOString(),
    });

    await this.recalculateQueue(carWashId);

    return { session: updated, washEndsAt: washEnds.toISOString() };
  }

  /** Complete wash → payment pending, release bay, assign next */
  static async completeWashOnBay(carWashId: string, bayId: string) {
    const { data: bay } = await supabase
      .from('washing_bays')
      .select('current_wash_session_id')
      .eq('id', bayId)
      .single();

    if (!bay?.current_wash_session_id) throw new Error('No active session on bay');

    const session = await this.getSessionById(bay.current_wash_session_id);
    const booking = await DBService.getBookingById(session.booking_id);
    const paymentStatus = (booking as { paymentStatus?: string })?.paymentStatus;

    const nextOp: WashOperationalStatus =
      paymentStatus === 'paid' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING';

    assertWashTransition(session.operational_status, nextOp);

    const now = new Date().toISOString();

    await supabase
      .from('wash_sessions')
      .update({
        operational_status: nextOp,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', session.id);

    await supabase
      .from('car_wash_queue')
      .update({
        status: 'completed',
        operational_status: nextOp === 'PAYMENT_CONFIRMED' ? 'COMPLETED' : 'PAYMENT_PENDING',
      })
      .eq('wash_session_id', session.id);

    await DBService.updateBooking(session.booking_id, {
      status: 'wash_completed',
      washCompleteTime: now,
      paymentStatus: paymentStatus === 'paid' ? 'paid' : 'pending',
    });

    await WashingBayService.releaseBay(bayId);

    if (nextOp === 'PAYMENT_CONFIRMED') {
      await this.finalizeSession(session.id, session.booking_id);
    }

    await this.recalculateQueue(carWashId);
    const assignResult = await this.tryAssignNextBay(carWashId);

    return { sessionId: session.id, bayReleased: true, nextAssignment: assignResult };
  }

  static async onPaymentUploaded(bookingId: string) {
    const session = await this.getSessionByBooking(bookingId);
    if (!session) return null;

    if (
      ['PAYMENT_PENDING', 'WASH_IN_PROGRESS', 'PAYMENT_UPLOADED'].includes(
        session.operational_status
      )
    ) {
      assertWashTransition(session.operational_status, 'PAYMENT_UPLOADED');
      await supabase
        .from('wash_sessions')
        .update({
          operational_status: 'PAYMENT_UPLOADED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }
    return session;
  }

  static async approvePayment(bookingId: string, reviewerId: string) {
    const session = await this.getSessionByBooking(bookingId);
    const payment = await DBService.getPaymentByBookingId(bookingId);
    if (!payment) throw new Error('Payment not found');

    await DBService.updatePayment(payment.id, {
      status: 'completed',
      paymentDate: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    });

    await DBService.updateBooking(bookingId, {
      paymentStatus: 'paid',
      status: 'completed',
    });

    if (session) {
      await supabase
        .from('wash_sessions')
        .update({
          operational_status: 'PAYMENT_CONFIRMED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      await this.finalizeSession(session.id, bookingId);

      if (session.bay_id) {
        await WashingBayService.releaseBay(session.bay_id);
      }
    }

    const booking = await DBService.getBookingById(bookingId);
    const carWashId =
      typeof booking?.carWashId === 'object'
        ? (booking.carWashId as { id?: string })?.id
        : booking?.carWashId;

    if (carWashId) {
      await this.recalculateQueue(String(carWashId));
      await this.tryAssignNextBay(String(carWashId));
    }

    const clientId =
      typeof booking?.clientId === 'object'
        ? (booking.clientId as { id?: string })?.id
        : booking?.clientId;
    if (clientId) {
      await NotificationService.createNotification({
        userId: String(clientId),
        type: 'payment',
        title: 'Payment confirmed',
        message: 'Your payment has been confirmed. Thank you!',
        data: { bookingId },
      });
    }

    return { payment, session };
  }

  static async rejectPayment(
    bookingId: string,
    reviewerId: string,
    reason: string
  ) {
    const payment = await DBService.getPaymentByBookingId(bookingId);
    if (!payment) throw new Error('Payment not found');

    await DBService.updatePayment(payment.id, {
      status: 'failed',
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    });

    const session = await this.getSessionByBooking(bookingId);
    if (session) {
      await supabase
        .from('wash_sessions')
        .update({
          operational_status: 'PAYMENT_PENDING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }

    return { payment, session };
  }

  // --- helpers ---

  private static async finalizeSession(sessionId: string, bookingId: string) {
    await supabase
      .from('wash_sessions')
      .update({
        operational_status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    await supabase
      .from('car_wash_queue')
      .update({ operational_status: 'COMPLETED', status: 'completed' })
      .eq('wash_session_id', sessionId);

    await DBService.updateBooking(bookingId, { status: 'completed', paymentStatus: 'paid' });
  }

  private static async insertQueueTicket(params: {
    carWashId: string;
    bookingId: string;
    sessionId: string;
    duration: number;
    priority: number;
    isExpress: boolean;
  }) {
    const { data: maxPos } = await supabase
      .from('car_wash_queue')
      .select('position')
      .eq('car_wash_id', params.carWashId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const position = (maxPos?.position || 0) + 1;
    const now = new Date();

    const { data, error } = await supabase
      .from('car_wash_queue')
      .insert({
        car_wash_id: params.carWashId,
        booking_id: params.bookingId,
        wash_session_id: params.sessionId,
        position,
        service_duration_minutes: params.duration,
        priority: params.priority,
        is_express: params.isExpress,
        status: 'waiting',
        operational_status: 'WAITING',
        estimated_start_time: now.toISOString(),
        estimated_completion_time: new Date(
          now.getTime() + params.duration * 60000
        ).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async fetchQueue(carWashId: string) {
    const { data, error } = await supabase
      .from('car_wash_queue')
      .select(
        `
        *,
        booking:bookings(
          id, status, payment_status, total_amount, booking_type,
          vehicle:vehicles(make, model, plate_no),
          client:users!bookings_client_id_fkey(id, name, phone),
          service:services(name, price)
        )
      `
      )
      .eq('car_wash_id', carWashId)
      .neq('status', 'completed')
      .order('is_express', { ascending: false })
      .order('priority', { ascending: false })
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private static async fetchPendingPayments(carWashId: string) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_wash_id', carWashId);

    const ids = (bookings || []).map((b) => b.id);
    if (!ids.length) return [];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .in('booking_id', ids)
      .in('status', ['pending'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = [];
    for (const p of data || []) {
      const booking = await DBService.getBookingById(p.booking_id);
      enriched.push({
        ...p,
        booking,
        proofUrl: p.proof_url,
        transactionId: p.transaction_id,
        createdAt: p.created_at,
      });
    }
    return enriched;
  }

  private static async fetchActiveSessions(carWashId: string) {
    const { data, error } = await supabase
      .from('wash_sessions')
      .select('*')
      .eq('car_wash_id', carWashId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private static async getSessionByBooking(bookingId: string) {
    const { data } = await supabase
      .from('wash_sessions')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();
    return data;
  }

  private static async getSessionById(id: string) {
    const { data, error } = await supabase
      .from('wash_sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  private static async getQueueRowByBooking(bookingId: string) {
    const { data } = await supabase
      .from('car_wash_queue')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();
    return data;
  }

  private static computeMetrics(
    bays: unknown[],
    queue: { operational_status?: string }[],
    sessions: { operational_status: string; wash_ends_at?: string }[]
  ) {
    const availableBays = (bays as { status: string }[]).filter(
      (b) => b.status === 'available'
    ).length;
    const waiting = queue.filter(
      (q) => q.operational_status === 'WAITING' || !q.operational_status
    ).length;
    const inWash = sessions.filter((s) => s.operational_status === 'WASH_IN_PROGRESS').length;
    const delayed = sessions.filter((s) => {
      if (!s.wash_ends_at) return false;
      return (
        s.operational_status === 'WASH_IN_PROGRESS' &&
        new Date(s.wash_ends_at).getTime() < Date.now()
      );
    }).length;

    return { availableBays, waiting, inWash, delayed, utilization: bays.length ? inWash / (bays as unknown[]).length : 0 };
  }

  private static async enrichBays(
    bays: Record<string, unknown>[],
    sessions: Record<string, unknown>[]
  ) {
    const result = [];
    for (const bay of bays) {
      const session = sessions.find(
        (s) =>
          s.bay_id === bay.id ||
          s.id === bay.current_wash_session_id
      );
      let booking = null;
      let vehicle = null;
      let client = null;
      if (session?.booking_id) {
        booking = await DBService.getBookingById(String(session.booking_id));
      }
      const remainingMinutes =
        session?.wash_ends_at && session.operational_status === 'WASH_IN_PROGRESS'
          ? Math.max(
              0,
              Math.ceil(
                (new Date(String(session.wash_ends_at)).getTime() - Date.now()) / 60000
              )
            )
          : session?.service_duration_minutes ?? null;

      result.push({
        id: bay.id,
        bayNumber: bay.bay_number,
        name: bay.name,
        status: bay.status,
        sessionId: bay.current_wash_session_id || session?.id,
        operationalStatus: session?.operational_status,
        remainingMinutes,
        paymentStatus: (booking as { paymentStatus?: string })?.paymentStatus,
        vehicle: (booking as { vehicleId?: unknown })?.vehicleId,
        clientName:
          typeof (booking as { clientId?: { name?: string } })?.clientId === 'object'
            ? (booking as { clientId: { name?: string } }).clientId?.name
            : undefined,
        plateNo:
          typeof (booking as { vehicleId?: { plateNo?: string } })?.vehicleId === 'object'
            ? (booking as { vehicleId: { plateNo?: string } }).vehicleId?.plateNo
            : undefined,
      });
    }
    return result;
  }

  private static mapQueueRow(row: Record<string, unknown>) {
    const booking = row.booking as Record<string, unknown> | undefined;
    return {
      id: row.id,
      position: row.position,
      operationalStatus: row.operational_status || 'WAITING',
      priority: row.priority || 0,
      isExpress: row.is_express || false,
      estimatedStart: row.estimated_start_time,
      estimatedCompletion: row.estimated_completion_time,
      durationMinutes: row.service_duration_minutes,
      booking,
    };
  }
}
