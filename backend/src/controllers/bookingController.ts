import { Response } from 'express';
import { validationResult } from 'express-validator';
import { DBService } from '../services/db-service';
import { QueueService } from '../services/queueService';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  InternalServerError
} from '../shared/errors/AppError';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ApiSuccessResponse } from '../shared/types/api.types';

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (Client)
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap: Record<string, string[]> = {};
    errors.array().forEach((error: any) => {
      const field = error.param || 'general';
      if (!errorMap[field]) {
        errorMap[field] = [];
      }
      errorMap[field].push(error.msg || error.message);
    });
    throw new ValidationError('Validation failed', errorMap);
  }

  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  const { vehicleId, carWashId, serviceId, pickupLocation, pickupCoordinates, scheduledPickupTime, driverId, bookingType } = req.body;

  // Validate required fields
  if (!vehicleId || !carWashId || !serviceId) {
    throw new BadRequestError('Vehicle, car wash, and service are required');
  }

  // Verify vehicle belongs to client
  const vehicle = await DBService.getVehicleById(vehicleId);
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }
  if (vehicle.clientId !== req.user.id) {
    throw new ForbiddenError('Vehicle does not belong to you');
  }

  // Verify service exists and get price
  const service = await DBService.getServiceById(serviceId);
  if (!service) {
    throw new NotFoundError('Service not found');
  }
  if (service.carWashId !== carWashId) {
    throw new BadRequestError('Service does not belong to the specified car wash');
  }

  const bookingTypeValue = bookingType || 'pickup_delivery';

  // Validate booking type
  if (!['pickup_delivery', 'drive_in'].includes(bookingTypeValue)) {
    throw new BadRequestError('Invalid booking type. Must be "pickup_delivery" or "drive_in"');
  }

  // Validate pickup location for pickup_delivery
  if (bookingTypeValue === 'pickup_delivery' && !pickupLocation) {
    throw new BadRequestError('Pickup location is required for pickup & delivery bookings');
  }

  // Create booking
  const booking = await DBService.createBooking({
    clientId: req.user.id,
    driverId: bookingTypeValue === 'pickup_delivery' ? (driverId || null) : null,
    carWashId,
    vehicleId,
    serviceId,
    pickupLocation: bookingTypeValue === 'pickup_delivery' ? pickupLocation : null,
    pickupCoordinates: bookingTypeValue === 'pickup_delivery' ? pickupCoordinates : null,
    scheduledPickupTime,
    totalAmount: service.price,
    status: bookingTypeValue === 'drive_in' ? 'waiting_bay' : 'pending',
    paymentStatus: 'pending',
    bookingType: bookingTypeValue,
  });

  if (!booking || !booking.id) {
    throw new InternalServerError('Failed to create booking');
  }

  // Create payment record
  try {
    await DBService.createPayment({
      bookingId: booking.id,
      amount: service.price,
      method: 'pending',
      status: 'pending',
    });
  } catch (paymentError) {
    console.error('Error creating payment record:', paymentError);
    // Log but don't fail - payment can be created later
  }

  // If drive-in booking, automatically add to queue
  if (bookingTypeValue === 'drive_in') {
    try {
      await QueueService.addToQueue(carWashId, booking.id, 30); // Default 30 minutes
    } catch (queueError) {
      console.error('Error adding to queue:', queueError);
      // Don't fail the booking if queue addition fails
    }
  }

  // Notify relevant parties
  if (booking.driverId) {
    await NotificationService.createNotification({
      userId: booking.driverId as string,
      type: 'booking_update',
      title: 'New Booking Request',
      message: `You have a new booking request for ${vehicle.make} ${vehicle.model}.`,
      data: { bookingId: booking.id },
      priority: 'high',
    });
  }

  await NotificationService.createNotification({
    userId: carWashId,
    type: 'booking_update',
    title: 'New Booking',
    message: `A new ${booking.bookingType} booking has been created.`,
    data: { bookingId: booking.id },
  });

  const response: ApiSuccessResponse = {
    success: true,
    data: booking,
  };

  res.status(201).json(response);
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  let filters: any = {};

  // Filter by role
  if (req.user.role === 'client') {
    filters.clientId = req.user.id;
  } else if (req.user.role === 'driver') {
    filters.driverId = req.user.id;
  } else if (req.user.role === 'carwash') {
    filters.carWashId = req.user.id;
  }
  // Admin sees all

  // Status filter
  if (req.query.status) {
    filters.status = req.query.status as string;
  }

  const bookings = await DBService.getBookings(filters);

  // Validate bookings array
  if (!Array.isArray(bookings)) {
    console.error('❌ getBookings returned non-array:', bookings);
    throw new InternalServerError('Invalid data format received from database');
  }

  const response: ApiSuccessResponse = {
    success: true,
    count: bookings.length,
    data: bookings,
  };

  res.json(response);
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('Booking ID is required');
  }

  const booking = await DBService.getBookingById(req.params.id);

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check authorization
  const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
  const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  const bookingCarWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;

  const isAuthorized =
    req.user.role === 'admin' ||
    bookingClientId === req.user.id ||
    (bookingDriverId && bookingDriverId === req.user.id) ||
    bookingCarWashId === req.user.id;

  if (!isAuthorized) {
    throw new ForbiddenError('You do not have permission to view this booking');
  }

  const response: ApiSuccessResponse = {
    success: true,
    data: booking,
  };

  res.json(response);
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('Booking ID is required');
  }

  const { status } = req.body;

  if (!status) {
    throw new BadRequestError('Status is required');
  }

  const booking = await DBService.getBookingById(req.params.id);

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Get IDs (handle both object and string formats)
  const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
  const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  const bookingCarWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;

  // Authorization and status validation by role
  if (req.user.role === 'driver') {
    if (!bookingDriverId || bookingDriverId !== req.user.id) {
      throw new ForbiddenError('You are not assigned to this booking');
    }
    // Drivers can only set: accepted, declined, picked_up, delivered_to_client
    const allowedStatuses = ['accepted', 'declined', 'picked_up', 'delivered_to_client'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status for driver. Allowed: ${allowedStatuses.join(', ')}`);
    }

    // Driver marks as 'picked_up' -> we represent this as an intermediate
    // status so the client must explicitly confirm the pickup. This leaves
    // a clear audit trail and prevents accidental confirmations by drivers.
    if (status === 'picked_up') {
      const actualStatus = 'picked_up_pending_confirmation';
      req.body.status = actualStatus;
    }
  } else if (req.user.role === 'client') {
    if (bookingClientId !== req.user.id) {
      throw new ForbiddenError('This booking does not belong to you');
    }
    // Clients can confirm pickup or cancel. They can only confirm when the
    // driver has marked the vehicle as picked up (pending confirmation).
    const allowedStatuses = ['picked_up', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestError('Clients can only confirm pickup or cancel bookings');
    }

    if (status === 'picked_up' && (booking as any).status !== 'picked_up_pending_confirmation') {
      throw new BadRequestError('Cannot confirm pickup: Driver has not marked vehicle as picked up yet or already confirmed.');
    }
  } else if (req.user.role === 'carwash') {
    if (bookingCarWashId !== req.user.id) {
      throw new ForbiddenError('This booking does not belong to your car wash');
    }
    // Car wash can set: at_wash, waiting_bay, washing_bay, drying_bay, wash_completed
    const allowedStatuses = ['at_wash', 'waiting_bay', 'washing_bay', 'drying_bay', 'wash_completed'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status for car wash. Allowed: ${allowedStatuses.join(', ')}`);
    }
  } else if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
    throw new ForbiddenError('You do not have permission to update this booking');
  }

  // Use the updated status from logic above if it was reassigned
  const finalStatus = req.body.status || status;

  // Update timestamps based on status
  const updateData: any = { status: finalStatus };
  if (finalStatus === 'picked_up' && !booking.actualPickupTime) {
    updateData.actualPickupTime = new Date().toISOString();
  } else if (finalStatus === 'washing_bay' && !booking.washStartTime) {
    updateData.washStartTime = new Date().toISOString();
  } else if (finalStatus === 'wash_completed' && !booking.washCompleteTime) {
    updateData.washCompleteTime = new Date().toISOString();
  } else if (finalStatus === 'delivered_to_client' && !booking.deliveryTime) {
    updateData.deliveryTime = new Date().toISOString();
  } else if (finalStatus === 'picked_up_pending_confirmation') {
    // If it's pending confirmation, we can also add a field if needed of maybe just use status
  }

  const updatedBooking = await DBService.updateBooking(req.params.id, updateData);

  if (!updatedBooking) {
    throw new InternalServerError('Failed to update booking');
  }

  // Notify relevant parties about status change
  // 1. Notify Client
  let notificationMessage = `Your booking status has been updated to ${finalStatus.replace(/_/g, ' ')}.`;
  let notificationTitle = `Booking Update: ${finalStatus.replace(/_/g, ' ')}`;

  if (finalStatus === 'picked_up_pending_confirmation') {
    notificationTitle = '🚗 Vehicle Picked Up?';
    notificationMessage = 'The driver has arrived and marked your vehicle as picked up. Please confirm the pickup in the app.';
  } else if (finalStatus === 'picked_up') {
    notificationTitle = '✅ Pickup Confirmed';
    notificationMessage = 'Your vehicle pickup has been confirmed. The driver is now heading to the car wash.';
  }

  await NotificationService.createNotification({
    userId: bookingClientId as string,
    type: 'booking_update',
    title: notificationTitle,
    message: notificationMessage,
    data: { bookingId: updatedBooking.id },
    priority: finalStatus === 'picked_up_pending_confirmation' ? 'high' : 'medium',
  });

  // 2. Notify Car Wash if driver picks up (and confirmed by client)
  if (finalStatus === 'picked_up') {
    await NotificationService.createNotification({
      userId: bookingCarWashId as string,
      type: 'booking_update',
      title: 'Vehicle Picked Up',
      message: `The client has confirmed the vehicle pickup. The driver is heading to your car wash.`,
      data: { bookingId: updatedBooking.id },
    });
  }

  // 3. Notify Driver if car wash completes
  if (status === 'wash_completed' && bookingDriverId) {
    await NotificationService.createNotification({
      userId: bookingDriverId as string,
      type: 'booking_update',
      title: 'Wash Completed',
      message: `The car wash has completed the service. You can now deliver the vehicle back to the client.`,
      data: { bookingId: updatedBooking.id },
      priority: 'high',
    });
  }

  const response: ApiSuccessResponse = {
    success: true,
    data: updatedBooking,
  };

  res.json(response);
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Client, Admin)
export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('Booking ID is required');
  }

  const booking = await DBService.getBookingById(req.params.id);

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Get client ID (handle both object and string formats)
  const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;

  // Only client or admin can cancel
  if (req.user.role !== 'admin' && bookingClientId !== req.user.id) {
    throw new ForbiddenError('Only the booking owner or admin can cancel this booking');
  }

  // Can't cancel if already completed or delivered
  const completedStatuses = ['completed', 'delivered', 'wash_completed', 'delivered_to_client', 'cancelled'];
  if (completedStatuses.includes(booking.status)) {
    throw new BadRequestError(`Cannot cancel booking with status: ${booking.status}`);
  }

  const updatedBooking = await DBService.updateBooking(req.params.id, { status: 'cancelled' });

  if (!updatedBooking) {
    throw new InternalServerError('Failed to cancel booking');
  }

  const response: ApiSuccessResponse = {
    success: true,
    data: updatedBooking,
    message: 'Booking cancelled successfully',
  };

  res.json(response);
});
