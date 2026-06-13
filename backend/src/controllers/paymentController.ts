import { Response } from 'express';
import { validationResult } from 'express-validator';
import { DBService } from '../services/db-service';
import { NotificationService } from '../services/notificationService';
import { QueueEngineService } from '../services/queueEngineService';
import { AuthRequest } from '../middleware/auth';

const MAX_PROOF_URL_LENGTH = 2_500_000; // ~2MB data URL

function normalizeBookingPartyId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string }).id);
  }
  return String(value);
}

function canAccessBookingPayment(
  req: AuthRequest,
  booking: Record<string, unknown>
): boolean {
  const userId = req.user!.id;
  const role = req.user!.role;
  if (role === 'admin' || role === 'subadmin') return true;

  const clientId = normalizeBookingPartyId(booking.clientId ?? booking.client_id);
  const driverId = normalizeBookingPartyId(booking.driverId ?? booking.driver_id);
  const carWashId = normalizeBookingPartyId(booking.carWashId ?? booking.car_wash_id);

  if (role === 'client' && clientId === userId) return true;
  if (role === 'driver' && driverId === userId) return true;
  if (role === 'carwash' && carWashId === userId) return true;
  return false;
}

function canConfirmPayment(req: AuthRequest, booking: Record<string, unknown>): boolean {
  const role = req.user!.role;
  if (role === 'admin' || role === 'subadmin') return true;

  const driverId = normalizeBookingPartyId(booking.driverId ?? booking.driver_id);
  const carWashId = normalizeBookingPartyId(booking.carWashId ?? booking.car_wash_id);

  if (role === 'driver' && driverId === req.user!.id) return true;
  if (role === 'carwash' && carWashId === req.user!.id) return true;
  return false;
}

// @desc    Initiate payment (client submits proof/transaction)
// @route   POST /api/payments/initiate
// @access  Private
export const initiatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    let { bookingId, method, transactionId, proofUrl } = req.body;

    if (method === 'airtel_money') method = 'mobile_money';

    if (proofUrl && typeof proofUrl === 'string' && proofUrl.length > MAX_PROOF_URL_LENGTH) {
      res.status(400).json({ success: false, message: 'Payment proof image is too large (max 2MB)' });
      return;
    }

    const booking = await DBService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (req.user!.role !== 'client' && req.user!.role !== 'admin' && req.user!.role !== 'subadmin') {
      res.status(403).json({ success: false, message: 'Only the client can submit payment' });
      return;
    }

    if (!canAccessBookingPayment(req, booking as Record<string, unknown>)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (!['wash_completed', 'delivered_to_client', 'delivered'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: 'Payment is only allowed after service completion or after delivery to client',
      });
      return;
    }

    let payment = await DBService.getPaymentByBookingId(bookingId);
    const paymentPayload: Record<string, unknown> = {
      method,
      transactionId: transactionId || null,
      status: 'pending',
    };
    if (proofUrl) paymentPayload.proofUrl = proofUrl;

    if (!payment) {
      payment = await DBService.createPayment({
        bookingId,
        amount: booking.totalAmount,
        ...paymentPayload,
      });
    } else {
      payment = await DBService.updatePayment(payment.id, paymentPayload);
    }

    await DBService.updateBooking(bookingId, { paymentStatus: 'pending' });

    const session = await QueueEngineService.onPaymentUploaded(bookingId);
    if (session && payment) {
      payment = await DBService.updatePayment(payment.id, {
        washSessionId: session.id,
      });
    }

    if (['cash', 'mobile_money', 'bank_transfer', 'card'].includes(method)) {
      const bookingDriverId = normalizeBookingPartyId(booking.driverId);
      const bookingCarWashId = normalizeBookingPartyId(booking.carWashId);

      const title = 'Payment Confirmation Required';
      const message = proofUrl
        ? 'Client submitted payment with a receipt. Please review and confirm.'
        : `Client initiated payment (${method}). Please review and confirm.`;

      if (bookingDriverId) {
        await NotificationService.createNotification({
          userId: bookingDriverId,
          type: 'payment',
          title,
          message,
          data: { bookingId },
          priority: 'high',
        });
      }
      if (bookingCarWashId) {
        await NotificationService.createNotification({
          userId: bookingCarWashId,
          type: 'payment',
          title,
          message,
          data: { bookingId },
          priority: 'high',
        });
      }
    }

    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get payment by booking ID
// @route   GET /api/payments/booking/:bookingId
// @access  Private
export const getPaymentByBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await DBService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (!canAccessBookingPayment(req, booking as Record<string, unknown>)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const payment = await DBService.getPaymentByBookingId(bookingId);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Verify payment (admin)
// @route   POST /api/payments/verify
// @access  Private (Admin)
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId, status } = req.body;

    const payment = await DBService.getPaymentByBookingId(paymentId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    const updatedPayment = await DBService.updatePayment(payment.id, { status });

    if (status === 'completed') {
      const booking = await DBService.getBookingById(payment.bookingId);
      if (booking) {
        const update: Record<string, unknown> = { paymentStatus: 'paid' };
        if (booking.status === 'delivered_to_client' || booking.status === 'delivered') {
          update.status = 'completed';
        }
        await DBService.updateBooking(booking.id, update);
      }
    }

    res.json({ success: true, data: updatedPayment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Confirm payment (Driver or Car Wash)
// @route   POST /api/payments/confirm
// @access  Private (Driver, Car Wash, Admin)
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required' });
      return;
    }

    const booking = await DBService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (!canConfirmPayment(req, booking as Record<string, unknown>)) {
      res.status(403).json({ success: false, message: 'Not authorized to confirm payment' });
      return;
    }

    let payment = await DBService.getPaymentByBookingId(bookingId);
    if (!payment) {
      payment = await DBService.ensurePaymentForBooking(bookingId);
    }
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    if (req.user!.role === 'carwash') {
      const result = await QueueEngineService.approvePayment(bookingId, req.user!.id);
      res.json({ success: true, data: result.payment });
      return;
    }

    const updatedPayment = await DBService.updatePayment(payment.id, {
      status: 'completed',
      paymentDate: new Date().toISOString(),
    });

    const bookingAfter = await DBService.getBookingById(bookingId);
    const bookingUpdate: Record<string, unknown> = { paymentStatus: 'paid' };
    if (
      bookingAfter &&
      (bookingAfter.status === 'delivered_to_client' || bookingAfter.status === 'delivered')
    ) {
      bookingUpdate.status = 'completed';
    }
    await DBService.updateBooking(bookingId, bookingUpdate);

    const bookingClientId = normalizeBookingPartyId(bookingAfter?.clientId);
    if (bookingClientId) {
      await NotificationService.createNotification({
        userId: bookingClientId,
        type: 'payment',
        title: 'Payment Confirmed',
        message: 'Your payment has been confirmed. Thank you!',
        data: { bookingId },
      });
    }

    res.json({ success: true, data: updatedPayment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
