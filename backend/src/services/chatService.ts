import { supabase } from '../config/supabase';

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatService {
  // Get messages for a booking
  static async getMessages(bookingId: string, _userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Send a message
  static async sendMessage(
    bookingId: string,
    senderId: string,
    receiverId: string,
    message: string
  ) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mark messages as read
  static async markAsRead(messageIds: string[], userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .in('id', messageIds)
      .eq('receiver_id', userId)
      .select();

    if (error) throw error;
    return data;
  }

  // Get unread message count for a user
  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }

  // Get all conversations for admin
  static async getAllConversations() {
    // This is a complex query to get latest message per booking
    // For simplicity, we'll get all bookings with messages
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        booking_id,
        sender_id,
        receiver_id,
        message,
        read,
        created_at,
        booking:bookings(
            id,
            status,
            client:users!bookings_client_id_fkey(id, name),
            driver:users!bookings_driver_id_fkey(id, name),
            car_wash:users!bookings_car_wash_id_fkey(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by booking_id
    const conversationsMap: Record<string, any> = {};

    for (const msg of (data || [])) {
      if (!msg.booking_id) continue;

      if (!conversationsMap[msg.booking_id]) {
        const booking = msg.booking as any;
        const participants = [];
        if (booking?.client) participants.push({ ...booking.client, role: 'client' });
        if (booking?.driver) participants.push({ ...booking.driver, role: 'driver' });
        if (booking?.car_wash) participants.push({ ...booking.car_wash, role: 'carwash' });

        conversationsMap[msg.booking_id] = {
          bookingId: msg.booking_id,
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unreadCount: 0,
          participants,
        };
      }

      if (!msg.read) {
        conversationsMap[msg.booking_id].unreadCount++;
      }
    }

    return Object.values(conversationsMap);
  }

  /** Conversations for the current user (client, driver, or car wash). */
  static async getConversationsForUser(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        id,
        booking_id,
        sender_id,
        receiver_id,
        message,
        read,
        created_at,
        booking:bookings(
          id,
          status,
          client_id,
          driver_id,
          car_wash_id,
          client:users!bookings_client_id_fkey(id, name),
          driver:users!bookings_driver_id_fkey(id, name),
          car_wash:users!bookings_car_wash_id_fkey(id, name, car_wash_name)
        )
      `
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const conversationsMap: Record<string, any> = {};

    for (const msg of data || []) {
      if (!msg.booking_id) continue;

      const booking = msg.booking as any;
      if (!booking) continue;

      const clientId = booking.client_id || booking.client?.id;
      const driverId = booking.driver_id || booking.driver?.id;
      const carWashId = booking.car_wash_id || booking.car_wash?.id;

      const hasAccess =
        clientId === userId || driverId === userId || carWashId === userId;
      if (!hasAccess) continue;

      let otherParty: { id: string; name: string; role: string } | null = null;
      if (userId === clientId) {
        if (driverId && driverId !== userId) {
          otherParty = {
            id: driverId,
            name: booking.driver?.name || 'Driver',
            role: 'driver',
          };
        } else if (carWashId) {
          otherParty = {
            id: carWashId,
            name: booking.car_wash?.car_wash_name || booking.car_wash?.name || 'Car Wash',
            role: 'carwash',
          };
        }
      } else if (userId === driverId || userId === carWashId) {
        otherParty = {
          id: clientId,
          name: booking.client?.name || 'Client',
          role: 'client',
        };
      }

      if (!conversationsMap[msg.booking_id]) {
        conversationsMap[msg.booking_id] = {
          bookingId: msg.booking_id,
          bookingStatus: booking.status,
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unreadCount: 0,
          otherParty,
        };
      }

      if (!msg.read && msg.receiver_id === userId) {
        conversationsMap[msg.booking_id].unreadCount += 1;
      }
    }

    return Object.values(conversationsMap).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );
  }
}
