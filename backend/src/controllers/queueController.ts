import { Response } from 'express';
import { QueueService } from '../services/queueService';
import { DBService } from '../services/db-service';
import { AuthRequest } from '../middleware/auth';

// @desc    Get queue for a car wash
// @route   GET /api/queue/carwash/:carWashId
// @access  Private
export const getQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { carWashId } = req.params;
    const userId = req.user!.id;

    // Verify access
    if (req.user!.role !== 'admin' && userId !== carWashId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const queue = await QueueService.getQueue(carWashId);

    res.json({
      success: true,
      data: queue,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get queue position for a booking
// @route   GET /api/queue/booking/:bookingId
// @access  Private
export const getBookingQueuePosition = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user!.id;

    // Verify access
    const booking = await DBService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    const clientId =
      typeof booking.clientId === 'object' ? (booking.clientId as { id?: string })?.id : booking.clientId;
    const carWashId =
      typeof booking.carWashId === 'object'
        ? (booking.carWashId as { id?: string })?.id
        : booking.carWashId;

    const hasAccess =
      clientId === userId ||
      carWashId === userId ||
      req.user!.role === 'admin' ||
      req.user!.role === 'subadmin';

    if (!hasAccess) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const queuePosition = await QueueService.getBookingQueuePosition(bookingId);

    res.json({
      success: true,
      data: queuePosition,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Add booking to queue
// @route   POST /api/queue/add
// @access  Private (Car Wash)
export const addToQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, serviceDurationMinutes } = req.body;
    const carWashId = req.user!.id;

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
      return;
    }

    // Verify booking belongs to this car wash
    const booking = await DBService.getBookingById(bookingId);
    const bookingCarWashId =
      typeof booking.carWashId === 'object'
        ? (booking.carWashId as { id?: string })?.id
        : booking.carWashId;

    if (!booking || bookingCarWashId !== carWashId) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    const queueEntry = await QueueService.addToQueue(
      carWashId,
      bookingId,
      serviceDurationMinutes || 30
    );

    res.status(201).json({
      success: true,
      data: queueEntry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Start service
// @route   PUT /api/queue/:queueId/start
// @access  Private (Car Wash)
export const startService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { queueId } = req.params;

    const queueEntry = await QueueService.startService(queueId);

    res.json({
      success: true,
      data: queueEntry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Complete service
// @route   PUT /api/queue/:queueId/complete
// @access  Private (Car Wash)
export const completeService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { queueId } = req.params;

    const queueEntry = await QueueService.completeService(queueId);

    res.json({
      success: true,
      data: queueEntry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update service duration
// @route   PUT /api/queue/:queueId/duration
// @access  Private (Car Wash)
export const updateServiceDuration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { queueId } = req.params;
    const { durationMinutes } = req.body;

    if (!durationMinutes || durationMinutes < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid duration in minutes is required',
      });
      return;
    }

    const queueEntry = await QueueService.updateServiceDuration(
      queueId,
      durationMinutes
    );

    res.json({
      success: true,
      data: queueEntry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
