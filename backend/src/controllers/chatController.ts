import { Response } from 'express';
import { ChatService } from '../services/chatService';
import { DBService } from '../services/db-service';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ForbiddenError, NotFoundError, BadRequestError } from '../shared/errors/AppError';

// @desc    Get messages for a booking
// @route   GET /api/chat/booking/:bookingId
// @access  Private
export const getMessages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const userId = req.user!.id;

  // Verify user has access to this booking
  const booking = await DBService.getBookingById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Normalize possible shapes: objects with id, camelCase vs snake_case
  const bookingClientId =
    (typeof (booking as any).clientId === 'object' ? (booking as any).clientId?.id : (booking as any).clientId) ||
    (booking as any).client_id;
  const bookingDriverId =
    (typeof (booking as any).driverId === 'object' ? (booking as any).driverId?.id : (booking as any).driverId) ||
    (booking as any).driver_id;
  const bookingCarWashId =
    (typeof (booking as any).carWashId === 'object' ? (booking as any).carWashId?.id : (booking as any).carWashId) ||
    (booking as any).car_wash_id;

  const hasAccess =
    bookingClientId === userId ||
    bookingDriverId === userId ||
    bookingCarWashId === userId ||
    req.user!.role === 'admin' ||
    req.user!.role === 'subadmin';

  if (!hasAccess) {
    throw new ForbiddenError('Not authorized to view this chat');
  }

  const messages = await ChatService.getMessages(bookingId, userId);

  res.json({
    success: true,
    data: messages,
  });
});

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookingId, receiverId, message } = req.body;
  const senderId = req.user!.id;

  if (!bookingId || !receiverId || !message) {
    throw new BadRequestError('Booking ID, receiver ID, and message are required');
  }

  // Verify user has access to this booking
  const booking = await DBService.getBookingById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Normalize possible shapes: objects with id, camelCase vs snake_case
  const bookingClientId =
    (typeof (booking as any).clientId === 'object' ? (booking as any).clientId?.id : (booking as any).clientId) ||
    (booking as any).client_id;
  const bookingDriverId =
    (typeof (booking as any).driverId === 'object' ? (booking as any).driverId?.id : (booking as any).driverId) ||
    (booking as any).driver_id;
  const bookingCarWashId =
    (typeof (booking as any).carWashId === 'object' ? (booking as any).carWashId?.id : (booking as any).carWashId) ||
    (booking as any).car_wash_id;

  const hasAccess =
    bookingClientId === senderId ||
    bookingDriverId === senderId ||
    bookingCarWashId === senderId ||
    req.user!.role === 'admin' ||
    req.user!.role === 'subadmin';

  if (!hasAccess) {
    throw new ForbiddenError('Not authorized to send messages in this chat');
  }

  const newMessage = await ChatService.sendMessage(
    bookingId,
    senderId,
    receiverId,
    message
  );

  // Notify receiver
  await NotificationService.createNotification({
    userId: receiverId,
    type: 'message',
    title: `New Message from ${req.user!.name}`,
    message: message.length > 50 ? message.substring(0, 47) + '...' : message,
    data: {
      bookingId,
      senderId,
      messageId: newMessage.id
    },
    priority: 'medium',
  });

  res.status(201).json({
    success: true,
    data: newMessage,
  });
});

/**
 * @desc    Get all conversations for admin
 * @route   GET /api/chat/conversations
 * @access  Private (Admin)
 */
export const getAllConversations = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'admin' && req.user!.role !== 'subadmin') {
    throw new ForbiddenError('Only admins can view all conversations');
  }

  const conversations = await ChatService.getAllConversations();

  res.json({
    success: true,
    data: conversations,
  });
});

// @desc    Mark messages as read
// @route   PUT /api/chat/read or PUT /api/chat/read/:bookingId
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { bookingId } = req.params;

    // If bookingId is provided, mark all messages for that booking as read
    if (bookingId) {
      const messages = await ChatService.getMessages(bookingId, userId);
      const unreadIds = messages
        .filter((msg: any) => !msg.read && (msg.receiverId === userId || msg.receiver_id === userId))
        .map((msg: any) => msg.id);

      if (unreadIds.length > 0) {
        await ChatService.markAsRead(unreadIds, userId);
      }

      res.json({
        success: true,
        message: 'Messages marked as read',
      });
      return;
    }

    // Otherwise, use messageIds from body
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      res.status(400).json({
        success: false,
        message: 'Message IDs array is required',
      });
      return;
    }

    await ChatService.markAsRead(messageIds, userId);

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await ChatService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
