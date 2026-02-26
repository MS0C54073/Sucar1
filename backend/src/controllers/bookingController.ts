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
    // Drivers can only set: accepted, declined, picked_up, delivered_to_wash, delivered_to_client
    const allowedStatuses = ['accepted', 'declined', 'picked_up', 'delivered_to_wash', 'delivered_to_client'];
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

    // For older schemas, proactively map delivered_to_wash to a widely-supported status
    // The robust fallback below will still handle any residual constraint errors.
    if (status === 'delivered_to_wash') {
      req.body.status = 'at_wash';
    }
    if (status === 'delivered_to_client') {
      // Legacy-safe fallback to avoid check constraint on older schemas
      req.body.status = 'delivered';
    }
  } else if (req.user.role === 'client') {
    if (bookingClientId !== req.user.id) {
      throw new ForbiddenError('This booking does not belong to you');
    }
    // Clients can confirm pickup, cancel, or confirm final receipt when delivered back
    const allowedStatuses = ['picked_up', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestError('Clients can only confirm pickup or cancel bookings');
    }

    if (status === 'picked_up' && (booking as any).status !== 'picked_up_pending_confirmation') {
      throw new BadRequestError('Cannot confirm pickup: Driver has not marked vehicle as picked up yet or already confirmed.');
    }
    if (status === 'completed') {
      // Final confirmation only allowed after delivery to client and payment confirmed
      if ((booking as any).status !== 'delivered_to_client') {
        throw new BadRequestError('Cannot complete: Vehicle not marked as delivered to client');
      }
      if ((booking as any).paymentStatus !== 'paid') {
        throw new BadRequestError('Cannot complete: Payment not confirmed yet');
      }
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

  // Dual-confirmation flags
  if (finalStatus === 'delivered_to_wash') {
    updateData.washAcceptancePending = true;
  }
  if (finalStatus === 'at_wash') {
    updateData.washAcceptancePending = false;
  }
  if (finalStatus === 'delivered_to_client') {
    updateData.clientConfirmPending = true;
  }
  if (finalStatus === 'completed') {
    updateData.clientConfirmPending = false;
  }

  // Apply update with a safe fallback if DB constraint rejects the
  // 'picked_up_pending_confirmation' status (migration not yet applied).
  let updatedBooking: any;
  let appliedStatus = updateData.status;
  try {
    updatedBooking = await DBService.updateBooking(req.params.id, updateData);
  } catch (err: any) {
    const msg = err?.message || err?.toString?.() || '';
    const isConstraint = (err?.code === '23514') || (typeof msg === 'string' && (msg.includes('bookings_status_check') || msg.toLowerCase().includes('check constraint')));
    const isMissingColumn = typeof msg === 'string' && (
      msg.includes("wash_acceptance_pending") ||
      msg.includes("client_confirm_pending") ||
      msg.includes("return_in_progress") ||
      msg.includes("out_for_delivery") ||
      msg.toLowerCase().includes('schema cache')
    );
    if (isConstraint && updateData.status === 'picked_up_pending_confirmation') {
      // Fallback: skip the intermediate confirmation and set to 'picked_up'
      // so flows keep working until the migration is applied.
      const fallbackData = { ...updateData, status: 'picked_up' } as any;
      try {
        updatedBooking = await DBService.updateBooking(req.params.id, fallbackData);
        appliedStatus = 'picked_up';
      } catch (e2: any) {
        const m2 = e2?.message || '';
        const missing = typeof m2 === 'string' && (m2.includes('schema cache') || m2.includes('wash_acceptance_pending') || m2.includes('client_confirm_pending'));
        if (missing) {
          const { washAcceptancePending, clientConfirmPending, returnInProgress, outForDelivery, ...stripped } = fallbackData;
          updatedBooking = await DBService.updateBooking(req.params.id, stripped);
          appliedStatus = stripped.status;
        } else {
          throw e2;
        }
      }
    } else if (isConstraint) {
      // Map newer statuses to legacy ones if enum/check constraint is outdated
      const desired = updateData.status;
      const fallbackMap: Record<string, string> = {
        delivered_to_wash: 'at_wash',
        delivered_to_client: 'delivered',
        waiting_bay: 'at_wash',
        washing_bay: 'at_wash',
        drying_bay: 'wash_completed',
      };
      const mapped = (fallbackMap as any)[desired] || desired;
      if (mapped !== desired) {
        const fallbackData = { ...updateData, status: mapped } as any;
        try {
          updatedBooking = await DBService.updateBooking(req.params.id, fallbackData);
          appliedStatus = mapped;
        } catch (e2: any) {
          const m2 = e2?.message || '';
          const missing = typeof m2 === 'string' && (m2.includes('schema cache') || m2.includes('wash_acceptance_pending') || m2.includes('client_confirm_pending'));
          const stillConstraint = (e2?.code === '23514') || (typeof m2 === 'string' && (m2.includes('bookings_status_check') || m2.toLowerCase().includes('check constraint')));
          if (missing) {
            const { washAcceptancePending, clientConfirmPending, returnInProgress, outForDelivery, ...stripped } = fallbackData;
            updatedBooking = await DBService.updateBooking(req.params.id, stripped);
            appliedStatus = stripped.status;
          } else if (stillConstraint) {
            // Final fallback tier for very old schemas
            const tier2Map: Record<string, string> = {
              delivered_to_wash: 'delivered',
              waiting_bay: 'delivered',
              washing_bay: 'delivered',
              drying_bay: 'delivered',
              delivered_to_client: 'completed',
            };
            const tier2 = (tier2Map as any)[desired];
            if (tier2) {
              const tier2Data = { ...updateData, status: tier2 } as any;
              try {
                updatedBooking = await DBService.updateBooking(req.params.id, tier2Data);
                appliedStatus = tier2;
              } catch (e3: any) {
                const m3 = e3?.message || '';
                const missing3 = typeof m3 === 'string' && (m3.includes('schema cache') || m3.includes('wash_acceptance_pending') || m3.includes('client_confirm_pending'));
                if (missing3) {
                  const { washAcceptancePending, clientConfirmPending, returnInProgress, outForDelivery, ...stripped3 } = tier2Data;
                  updatedBooking = await DBService.updateBooking(req.params.id, stripped3);
                  appliedStatus = stripped3.status;
                } else {
                  throw e3;
                }
              }
            } else {
              throw e2;
            }
          } else {
            throw e2;
          }
        }
      } else {
        throw err;
      }
    } else if (isMissingColumn) {
      // Remove non-existent flag columns and retry the update to avoid column errors
      const { washAcceptancePending, clientConfirmPending, returnInProgress, outForDelivery, ...stripped } = updateData as any;
      updatedBooking = await DBService.updateBooking(req.params.id, stripped);
      appliedStatus = stripped.status;
    } else {
      throw err;
    }
  }
  // Audit log
  try {
    await DBService.createBookingStatusLog({
      bookingId: updatedBooking.id,
      actorId: req.user.id,
      actorRole: req.user.role,
      fromStatus: (booking as any).status,
      toStatus: appliedStatus,
      note: 'Status updated via updateBookingStatus',
      metadata: {
        washAcceptancePending: updateData.washAcceptancePending ?? (booking as any).washAcceptancePending,
        clientConfirmPending: updateData.clientConfirmPending ?? (booking as any).clientConfirmPending,
      },
    });
  } catch (logErr) {
    console.error('Failed to write booking status log:', logErr);
  }

  if (!updatedBooking) {
    throw new InternalServerError('Failed to update booking');
  }

  // Notify relevant parties about status change
  // 1. Notify Client
  let notificationMessage = `Your booking status has been updated to ${appliedStatus.replace(/_/g, ' ')}.`;
  let notificationTitle = `Booking Update: ${appliedStatus.replace(/_/g, ' ')}`;

  if (appliedStatus === 'picked_up_pending_confirmation') {
    notificationTitle = '🚗 Vehicle Picked Up?';
    notificationMessage = 'The driver has arrived and marked your vehicle as picked up. Please confirm the pickup in the app.';
  } else if (appliedStatus === 'picked_up') {
    notificationTitle = '✅ Pickup Confirmed';
    notificationMessage = 'Your vehicle pickup has been confirmed. The driver is now heading to the car wash.';
  }

  await NotificationService.createNotification({
    userId: bookingClientId as string,
    type: 'booking_update',
    title: notificationTitle,
    message: notificationMessage,
    data: { bookingId: updatedBooking.id },
    priority: appliedStatus === 'picked_up_pending_confirmation' ? 'high' : 'medium',
  });

  // 2. Notify Car Wash if driver picks up (and confirmed by client)
  if (appliedStatus === 'picked_up') {
    await NotificationService.createNotification({
      userId: bookingCarWashId as string,
      type: 'booking_update',
      title: 'Vehicle Picked Up',
      message: `The client has confirmed the vehicle pickup. The driver is heading to your car wash.`,
      data: { bookingId: updatedBooking.id },
    });
  }

  // 2b. Notify Car Wash when vehicle delivered to wash (prompt acceptance)
  // Also notify if legacy fallback mapped this to 'at_wash' but original intent was delivered_to_wash
  if (appliedStatus === 'delivered_to_wash' || (appliedStatus === 'at_wash' && status === 'delivered_to_wash')) {
    await NotificationService.createNotification({
      userId: bookingCarWashId as string,
      type: 'booking_update',
      title: 'Vehicle Delivered to Wash',
      message: 'A vehicle has arrived. Please open Live Tracking and press “Confirm Arrival”.',
      data: { bookingId: updatedBooking.id },
      priority: 'high',
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

// @desc    Mark return in progress (driver picks up from wash)
// @route   POST /api/bookings/:id/return-in-progress
// @access  Private (Driver)
export const markReturnInProgress = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }
  const booking = await DBService.getBookingById(req.params.id);
  if (!booking) throw new NotFoundError('Booking not found');

  const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  if (req.user.role !== 'driver' || bookingDriverId !== req.user.id) {
    throw new ForbiddenError('Only assigned driver can mark return in progress');
  }
  if ((booking as any).status !== 'wash_completed' && (booking as any).status !== 'drying_bay') {
    throw new BadRequestError('Return can only start after service completion');
  }

  const updated = await DBService.updateBooking(req.params.id, { returnInProgress: true });
  try {
    await DBService.createBookingStatusLog({
      bookingId: updated.id,
      actorId: req.user.id,
      actorRole: req.user.role,
      fromStatus: (booking as any).status,
      toStatus: (booking as any).status,
      note: 'Driver picked vehicle from wash (return in progress)',
      metadata: { returnInProgress: true },
    });
  } catch {}

  const response: ApiSuccessResponse = { success: true, data: updated };
  res.json(response);
});

// @desc    Mark out for delivery (driver heading to client)
// @route   POST /api/bookings/:id/out-for-delivery
// @access  Private (Driver)
export const markOutForDelivery = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }
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
  try {
    await DBService.createBookingStatusLog({
      bookingId: updated.id,
      actorId: req.user.id,
      actorRole: req.user.role,
      fromStatus: (booking as any).status,
      toStatus: (booking as any).status,
      note: 'Driver is out for delivery to client',
      metadata: { outForDelivery: true },
    });
  } catch {}

  const response: ApiSuccessResponse = { success: true, data: updated };
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
