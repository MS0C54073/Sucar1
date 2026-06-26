/**
 * Refactored Booking Controller
 *
 * This is the cleaned-up version of bookingController.ts that delegates
 * complex logic to bookingStatusService.ts. It reduces the controller
 * from ~660 lines to ~200 lines while maintaining identical behavior.
 *
 * To adopt: rename this file to bookingController.ts after testing.
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import { DBService } from '../services/db-service';
import { QueueService } from '../services/queueService';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { processStatusUpdate, BookingStatus } from '../services/bookingStatusService';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  InternalServerError,
} from '../shared/errors/AppError';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ApiSuccessResponse } from '../shared/types/api.types';

// ─── Create Booking ──────────────────────────────────────────────────────────

export const createBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap: Record<string, string[]> = {};
    errors.array().forEach((error: any) => {
      const field = error.param || 'general';
      if (!errorMap[field]) errorMap[field] = [];
      errorMap[field].push(error.msg || error.message);
    });
    throw new ValidationError('Validation failed', errorMap);
  }

  if (!req.user?.id) throw new ForbiddenError('User not authenticated');

  const { vehicleId, carWashId, serviceId, pickupLocation, pickupCoordinates, scheduledPickupTime, driverId, bookingType } = req.body;

  if (!vehicleId || !carWashId || !serviceId) {
    throw new BadRequestError('Vehicle, car wash, and service are required');
  }

  // Verify vehicle ownership
  const vehicle = await DBService.getVehicleById(vehicleId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  if (vehicle.clientId !== req.user.id) throw new ForbiddenError('Vehicle does not belong to you');

  // Verify service
  const service = await DBService.getServiceById(serviceId);
  if (!service) throw new NotFoundError('Service not found');
  if (service.carWashId !== carWashId) throw new BadRequestError('Service does not belong to the specified car wash');

  const bookingTypeValue = bookingType || 'pickup_delivery';
  if (!['pickup_delivery', 'drive_in'].includes(bookingTypeValue)) {
    throw new BadRequestError('Invalid booking type. Must be "pickup_delivery" or "drive_in"');
  }
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

  if (!booking?.id) throw new InternalServerError('Failed to create booking');

  // Create payment record (non-blocking)
  try {
    await DBService.createPayment({ bookingId: booking.id, amount: service.price, method: 'pending', status: 'pending' });
  } catch (e) {
    console.error('Error creating payment record:', e);
  }

  // Auto-queue for drive-in
  if (bookingTypeValue === 'drive_in') {
    try { await QueueService.addToQueue(carWashId, booking.id, 30); } catch (e) { console.error('Queue error:', e); }
  }

  // Notifications
  if (booking.driverId) {
    await NotificationService.createNotification({
      userId: booking.driverId,
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
    message: `A new ${bookingTypeValue} booking has been created.`,
    data: { bookingId: booking.id },
  });

  res.status(201).json({ success: true, data: booking } as ApiSuccessResponse);
});

// ─── Get Bookings ────────────────────────────────────────────────────────────

export const getBookings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new ForbiddenError('User not authenticated');

  const filters: any = {};
  if (req.user.role === 'client') filters.clientId = req.user.id;
  else if (req.user.role === 'driver') filters.driverId = req.user.id;
  else if (req.user.role === 'carwash') filters.carWashId = req.user.id;
  if (req.query.status) filters.status = req.query.status as string;

  const bookings = await DBService.getBookings(filters);
  if (!Array.isArray(bookings)) throw new InternalServerError('Invalid data format');

  res.json({ success: true, count: bookings.length, data: bookings } as ApiSuccessResponse);
});

// ─── Get Single Booking ──────────────────────────────────────────────────────

export const getBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new ForbiddenError('User not authenticated');
  if (!req.params.id) throw new BadRequestError('Booking ID is required');

  const booking = await DBService.getBookingById(req.params.id);
  if (!booking) throw new NotFoundError('Booking not found');

  // Authorization check
  const clientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
  const driverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  const carWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;

  const isAuthorized = req.user.role === 'admin' || req.user.role === 'subadmin' ||
    clientId === req.user.id || (driverId && driverId === req.user.id) || carWashId === req.user.id;

  if (!isAuthorized) throw new ForbiddenError('You do not have permission to view this booking');

  res.json({ success: true, data: booking } as ApiSuccessResponse);
});

// ─── Update Booking Status (Delegated to Service) ────────────────────────────

export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new ForbiddenError('User not authenticated');
  if (!req.params.id) throw new BadRequestError('Booking ID is required');
  if (!req.body.status) throw new BadRequestError('Status is required');

  const result = await processStatusUpdate({
    bookingId: req.params.id,
    requestedStatus: req.body.status as BookingStatus,
    actorId: req.user.id,
    actorRole: req.user.role as any,
  });

  res.json({ success: true, data: result.updatedBooking } as ApiSuccessResponse);
});

// ─── Mark Return In Progress ─────────────────────────────────────────────────

export const markReturnInProgress = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new ForbiddenError('User not authenticated');

  const booking = await DBService.getBookingById(req.params.id);
  if (!booking) throw new NotFoundError('Booking not found');

  const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  if (req.user.role !== 'driver' || bookingDriverId !== req.user.id) {
    throw new ForbiddenError('Only assigned driver can mark return in progress');
  }
  if (booking.status !== 'wash_completed' && booking.status !== 'drying_bay') {
    throw new BadRequestError('Return can only start after service completion');
  }

  const updated = await DBService.updateBooking(req.params.id, { returnInProgress: true });
  res.json({ success: true, data: updated } as ApiSuccessResponse);
});

// ─── Mark Out For Delivery ───────────────────────────────────────────────────

export const markOutForDelivery = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new ForbiddenError('User not authenticated');

  const booking = await DBService.getBookingById(req.params.id);
  if (!booking) throw new NotFoundError('Booking not found');

  const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  if (req.user.role !== 'driver' || bookingDriverId !== req.user.id) {
    throw new ForbiddenError('Only assigned driver can mark out for delivery');
  }
  if (!(booking as any).returnInProgress) {
    throw new BadRequestError('Must pick vehicle from wash before going out for delivery');
  }

  const updated = await DBService.updateBooking(req.params.id, { outForDelivery: true });
  res.json({ success: true, data: updated } as ApiSuccessResponse);
});

// ─── Cancel Booking ──────────────────────────────────────────────────────────

export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) throw new ForbiddenError('User not authenticated');
  if (!req.params.id) throw new BadRequestError('Booking ID is required');

  const booking = await DBService.getBookingById(req.params.id);
  if (!booking) throw new NotFoundError('Booking not found');

  const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
  if (req.user.role !== 'admin' && bookingClientId !== req.user.id) {
    throw new ForbiddenError('Only the booking owner or admin can cancel this booking');
  }

  const nonCancellable = ['completed', 'delivered', 'wash_completed', 'delivered_to_client', 'cancelled'];
  if (nonCancellable.includes(booking.status)) {
    throw new BadRequestError(`Cannot cancel booking with status: ${booking.status}`);
  }

  const updatedBooking = await DBService.updateBooking(req.params.id, { status: 'cancelled' });
  if (!updatedBooking) throw new InternalServerError('Failed to cancel booking');

  res.json({ success: true, data: updatedBooking, message: 'Booking cancelled successfully' } as ApiSuccessResponse);
});
