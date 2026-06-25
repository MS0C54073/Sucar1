import { supabase } from '../config/supabase';
import { DBService } from './db-service';
import { QueueEngineService } from './queueEngineService';
import { WashingBayService } from './washingBayService';

export interface QueueEntry {
  id: string;
  carWashId: string;
  bookingId: string;
  position: number;
  estimatedStartTime: Date | null;
  estimatedCompletionTime: Date | null;
  serviceDurationMinutes: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

export class QueueService {
  // Add booking to queue
  static async addToQueue(
    carWashId: string,
    bookingId: string,
    serviceDurationMinutes: number = 30
  ) {
    const result = await QueueEngineService.checkIn(bookingId, carWashId, {
      durationMinutes: serviceDurationMinutes,
    });
    return result.queue;
  }

  // Get queue for a car wash
  static async getQueue(carWashId: string) {
    const { data, error } = await supabase
      .from('car_wash_queue')
      .select(`
        *,
        booking:bookings(
          id,
          status,
          vehicle:vehicles(*),
          client:users!bookings_client_id_fkey(id, name, phone)
        )
      `)
      .eq('car_wash_id', carWashId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get queue position for a booking
  static async getBookingQueuePosition(bookingId: string) {
    const { data, error } = await supabase
      .from('car_wash_queue')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async startService(queueId: string) {
    const { data: row, error } = await supabase
      .from('car_wash_queue')
      .select('car_wash_id, bay_id')
      .eq('id', queueId)
      .single();
    if (error || !row) throw error || new Error('Queue entry not found');

    let bayId = row.bay_id as string | null;
    if (!bayId) {
      const bay = await WashingBayService.getAvailableBay(row.car_wash_id);
      if (!bay) throw new Error('No available washing bay');
      await QueueEngineService.assignQueueEntryToBay(row.car_wash_id, queueId, bay.id);
      bayId = bay.id;
    }

    await QueueEngineService.startWashOnBay(row.car_wash_id, bayId as string);
    const { data } = await supabase.from('car_wash_queue').select('*').eq('id', queueId).single();
    return data;
  }

  static async completeService(queueId: string) {
    const { data: row, error } = await supabase
      .from('car_wash_queue')
      .select('car_wash_id, bay_id, booking_id')
      .eq('id', queueId)
      .single();
    if (error || !row) throw error || new Error('Queue entry not found');

    if (row.bay_id) {
      await QueueEngineService.completeWashOnBay(row.car_wash_id, row.bay_id);
    } else {
      await supabase
        .from('car_wash_queue')
        .update({ status: 'completed', operational_status: 'PAYMENT_PENDING' })
        .eq('id', queueId);
      await DBService.updateBooking(row.booking_id, {
        status: 'wash_completed',
        paymentStatus: 'pending',
      });
      await QueueEngineService.tryAssignNextBay(row.car_wash_id);
    }

    const { data } = await supabase.from('car_wash_queue').select('*').eq('id', queueId).single();
    return data;
  }

  // Update service duration
  static async updateServiceDuration(
    queueId: string,
    durationMinutes: number
  ) {
    const queueEntry = await supabase
      .from('car_wash_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (queueEntry.error) throw queueEntry.error;

    const estimatedCompletionTime = new Date(
      new Date(queueEntry.data.estimated_start_time).getTime() +
        durationMinutes * 60000
    );

    const { data, error } = await supabase
      .from('car_wash_queue')
      .update({
        service_duration_minutes: durationMinutes,
        estimated_completion_time: estimatedCompletionTime.toISOString(),
      })
      .eq('id', queueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculate wait time for a position
  static async calculateWaitTime(carWashId: string, position: number) {
    const { data, error } = await supabase
      .from('car_wash_queue')
      .select('service_duration_minutes')
      .eq('car_wash_id', carWashId)
      .lt('position', position)
      .in('status', ['waiting', 'in_progress'])
      .order('position', { ascending: true });

    if (error) throw error;

    const waitMinutes = (data || []).reduce(
      (sum, entry) => sum + (entry.service_duration_minutes || 30),
      0
    );

    return waitMinutes;
  }
}
