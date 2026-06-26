/**
 * Booking Status Service
 *
 * Extracts the complex status transition logic, role validation,
 * legacy fallback handling, and notification dispatch from the
 * booking controller into a testable, reusable service.
 *
 * This replaces the 300+ line monolithic updateBookingStatus handler
 * with a clean, composable service layer.
 */

import { DBService } from './db-service';
import { NotificationService } from './notificationService';
import {
  BadRequestError,
  ForbiddenError,
} from '../shared/errors/AppError';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending' | 'accepted' | 'declined'
  | 'picked_up_pending_confirmation' | 'picked_up'
  | 'delivered_to_wash' | 'at_wash'
  | 'waiting_bay' | 'washing_bay' | 'drying_bay'
  | 'wash_completed' | 'delivered' | 'delivered_to_client'
  | 'completed' | 'cancelled';

export type UserRole = 'client' | 'driver' | 'carwash' | 'admin' | 'subadmin';

interface StatusUpdateRequest {
  bookingId: string;
  requestedStatus: BookingStatus;
  actorId: string;
  actorRole: UserRole;
}

interface StatusUpdateResult {
  updatedBooking: any;
  appliedStatus: BookingStatus;
  wasRemapped: boolean;
}

// ─── Role-Based Validation ───────────────────────────────────────────────────

const DRIVER_ALLOWED: BookingStatus[] = ['accepted', 'declined', 'picked_up', 'delivered_to_wash', 'delivered_to_client'];
const CLIENT_ALLOWED: BookingStatus[] = ['picked_up', 'cancelled', 'completed'];
const CARWASH_ALLOWED: BookingStatus[] = ['at_wash', 'waiting_bay', 'washing_bay', 'drying_bay', 'wash_completed'];
const TERMINAL_STATUSES: BookingStatus[] = ['completed', 'cancelled', 'declined'];

/**
 * Validate that the actor's role permits setting the requested status.
 */
export function validateRolePermission(role: UserRole, status: BookingStatus): void {
  if (role === 'admin' || role === 'subadmin') return;

  const allowedMap: Record<string, BookingStatus[]> = {
    driver: DRIVER_ALLOWED,
    client: CLIENT_ALLOWED,
    carwash: CARWASH_ALLOWED,
  };

  const allowed = allowedMap[role];
  if (!allowed || !allowed.includes(status)) {
    throw new BadRequestError(
      `Role "${role}" cannot set status "${status}". Allowed: ${(allowed || []).join(', ')}`
    );
  }
}

// ─── Status Remapping (Driver-Specific) ──────────────────────────────────────

/**
 * Apply driver-specific status remapping rules.
 * - Driver's 'picked_up' becomes 'picked_up_pending_confirmation'
 * - Driver's 'delivered_to_wash' becomes 'at_wash' for legacy compat
 * - Driver's 'delivered_to_client' becomes 'delivered' for legacy compat
 */
export function applyDriverRemapping(status: BookingStatus): BookingStatus {
  const remapTable: Partial<Record<BookingStatus, BookingStatus>> = {
    picked_up: 'picked_up_pending_confirmation',
    delivered_to_wash: 'at_wash',
    delivered_to_client: 'delivered',
  };
  return remapTable[status] || status;
}

// ─── Client-Specific Validation ──────────────────────────────────────────────

/**
 * Validate client-specific business rules for status changes.
 */
export function validateClientRules(booking: any, requestedStatus: BookingStatus): void {
  if (requestedStatus === 'picked_up') {
    if (booking.status !== 'picked_up_pending_confirmation') {
      throw new BadRequestError(
        'Cannot confirm pickup: Driver has not marked vehicle as picked up yet or already confirmed.'
      );
    }
  }

  if (requestedStatus === 'completed') {
    if (booking.status !== 'delivered_to_client' && booking.status !== 'delivered') {
      throw new BadRequestError('Cannot complete: Vehicle not marked as delivered to client');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestError('Cannot complete: Payment not confirmed yet');
    }
  }
}

// ─── Legacy Fallback Logic ───────────────────────────────────────────────────

const LEGACY_FALLBACK_TIER1: Record<string, BookingStatus> = {
  picked_up_pending_confirmation: 'picked_up',
  delivered_to_wash: 'at_wash',
  delivered_to_client: 'delivered',
  waiting_bay: 'at_wash',
};

const LEGACY_FALLBACK_TIER2: Record<string, BookingStatus> = {
  delivered_to_wash: 'delivered',
  waiting_bay: 'delivered',
  washing_bay: 'delivered',
  drying_bay: 'delivered',
  delivered_to_client: 'completed',
};

/**
 * Attempt to persist a booking update with automatic legacy fallbacks.
 * Handles DB constraint errors by progressively falling back to older status values.
 */
export async function persistWithFallback(
  bookingId: string,
  updateData: Record<string, any>
): Promise<{ booking: any; appliedStatus: BookingStatus; wasRemapped: boolean }> {
  const originalStatus = updateData.status as BookingStatus;

  // First attempt: try the exact status
  try {
    const booking = await DBService.updateBooking(bookingId, updateData);
    return { booking, appliedStatus: originalStatus, wasRemapped: false };
  } catch (err: any) {
    const msg = err?.message || '';
    const isConstraint = err?.code === '23514' ||
      msg.includes('bookings_status_check') ||
      msg.toLowerCase().includes('check constraint');
    const isMissingColumn = msg.includes('wash_acceptance_pending') ||
      msg.includes('client_confirm_pending') ||
      msg.includes('return_in_progress') ||
      msg.includes('out_for_delivery') ||
      msg.toLowerCase().includes('schema cache');

    if (isMissingColumn) {
      // Strip unknown columns and retry
      const stripped = stripUnknownColumns(updateData);
      const booking = await DBService.updateBooking(bookingId, stripped);
      return { booking, appliedStatus: stripped.status, wasRemapped: false };
    }

    if (!isConstraint) throw err;

    // Tier 1 fallback
    const tier1Status = LEGACY_FALLBACK_TIER1[originalStatus];
    if (tier1Status) {
      try {
        const fallbackData = { ...updateData, status: tier1Status };
        const booking = await DBService.updateBooking(bookingId, fallbackData);
        return { booking, appliedStatus: tier1Status, wasRemapped: true };
      } catch (e2: any) {
        const m2 = e2?.message || '';
        if (m2.includes('schema cache') || m2.includes('wash_acceptance_pending')) {
          const stripped = stripUnknownColumns({ ...updateData, status: tier1Status });
          const booking = await DBService.updateBooking(bookingId, stripped);
          return { booking, appliedStatus: tier1Status, wasRemapped: true };
        }
        // Try tier 2
      }
    }

    // Tier 2 fallback
    const tier2Status = LEGACY_FALLBACK_TIER2[originalStatus];
    if (tier2Status) {
      const tier2Data = stripUnknownColumns({ ...updateData, status: tier2Status });
      const booking = await DBService.updateBooking(bookingId, tier2Data);
      return { booking, appliedStatus: tier2Status, wasRemapped: true };
    }

    throw err;
  }
}

/**
 * Remove columns that may not exist in older DB schemas.
 */
function stripUnknownColumns(data: Record<string, any>): Record<string, any> {
  const {
    washAcceptancePending,
    clientConfirmPending,
    returnInProgress,
    outForDelivery,
    ...clean
  } = data;
  return clean;
}

// ─── Timestamp Updates ───────────────────────────────────────────────────────

/**
 * Determine which timestamp fields to set based on the new status.
 */
export function getTimestampUpdates(
  status: BookingStatus,
  booking: any
): Record<string, string> {
  const now = new Date().toISOString();
  const updates: Record<string, string> = {};

  if (status === 'picked_up' && !booking.actualPickupTime) {
    updates.actualPickupTime = now;
  } else if (status === 'washing_bay' && !booking.washStartTime) {
    updates.washStartTime = now;
  } else if (status === 'wash_completed' && !booking.washCompleteTime) {
    updates.washCompleteTime = now;
  } else if ((status === 'delivered_to_client' || status === 'delivered') && !booking.deliveryTime) {
    updates.deliveryTime = now;
  }

  return updates;
}

// ─── Workflow Flag Updates ────────────────────────────────────────────────────

/**
 * Determine workflow flag changes based on the new status.
 */
export function getWorkflowFlagUpdates(status: BookingStatus): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  if (status === 'delivered_to_wash') {
    flags.washAcceptancePending = true;
  }
  if (status === 'at_wash') {
    flags.washAcceptancePending = false;
  }
  if (status === 'delivered_to_client' || status === 'delivered') {
    flags.clientConfirmPending = true;
  }
  if (status === 'completed') {
    flags.clientConfirmPending = false;
  }

  return flags;
}

// ─── Notification Dispatch ───────────────────────────────────────────────────

/**
 * Send appropriate notifications based on the status change.
 */
export async function dispatchNotifications(
  booking: any,
  appliedStatus: BookingStatus,
  originalRequestedStatus: BookingStatus
): Promise<void> {
  const clientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
  const driverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  const carWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;

  // 1. Always notify client
  let title = `Booking Update: ${appliedStatus.replace(/_/g, ' ')}`;
  let message = `Your booking status has been updated to ${appliedStatus.replace(/_/g, ' ')}.`;
  let priority: 'low' | 'medium' | 'high' = 'medium';

  if (appliedStatus === 'picked_up_pending_confirmation') {
    title = 'Vehicle Picked Up?';
    message = 'The driver has arrived and marked your vehicle as picked up. Please confirm the pickup in the app.';
    priority = 'high';
  } else if (appliedStatus === 'picked_up') {
    title = 'Pickup Confirmed';
    message = 'Your vehicle pickup has been confirmed. The driver is now heading to the car wash.';
  }

  if (clientId) {
    await NotificationService.createNotification({
      userId: clientId,
      type: 'booking_update',
      title,
      message,
      data: { bookingId: booking.id },
      priority,
    });
  }

  // 2. Notify car wash when pickup confirmed
  if (appliedStatus === 'picked_up' && carWashId) {
    await NotificationService.createNotification({
      userId: carWashId,
      type: 'booking_update',
      title: 'Vehicle Picked Up',
      message: 'The client has confirmed the vehicle pickup. The driver is heading to your car wash.',
      data: { bookingId: booking.id },
    });
  }

  // 3. Notify car wash when vehicle delivered
  if ((appliedStatus === 'delivered_to_wash' || (appliedStatus === 'at_wash' && originalRequestedStatus === 'delivered_to_wash')) && carWashId) {
    await NotificationService.createNotification({
      userId: carWashId,
      type: 'booking_update',
      title: 'Vehicle Delivered to Wash',
      message: 'A vehicle has arrived. Please open Live Tracking and press "Confirm Arrival".',
      data: { bookingId: booking.id },
      priority: 'high',
    });
  }

  // 4. Notify driver when wash completes
  if (originalRequestedStatus === 'wash_completed' && driverId) {
    await NotificationService.createNotification({
      userId: driverId,
      type: 'booking_update',
      title: 'Wash Completed',
      message: 'The car wash has completed the service. You can now deliver the vehicle back to the client.',
      data: { bookingId: booking.id },
      priority: 'high',
    });
  }
}

// ─── Audit Logging ───────────────────────────────────────────────────────────

/**
 * Write an audit log entry for the status change.
 */
export async function writeAuditLog(
  bookingId: string,
  actorId: string,
  actorRole: string,
  fromStatus: BookingStatus,
  toStatus: BookingStatus,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await DBService.createBookingStatusLog({
      bookingId,
      actorId,
      actorRole,
      fromStatus,
      toStatus,
      note: 'Status updated via bookingStatusService',
      metadata,
    });
  } catch (err) {
    console.error('Failed to write booking status log:', err);
  }
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Process a complete booking status update request.
 * This is the single entry point that replaces the monolithic controller logic.
 */
export async function processStatusUpdate(request: StatusUpdateRequest): Promise<StatusUpdateResult> {
  const { bookingId, requestedStatus, actorId, actorRole } = request;

  // 1. Fetch booking
  const booking = await DBService.getBookingById(bookingId);
  if (!booking) {
    throw new BadRequestError('Booking not found');
  }

  // 2. Validate role permission
  validateRolePermission(actorRole, requestedStatus);

  // 3. Validate ownership
  const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
  const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
  const bookingCarWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;

  if (actorRole === 'driver' && (!bookingDriverId || bookingDriverId !== actorId)) {
    throw new ForbiddenError('You are not assigned to this booking');
  }
  if (actorRole === 'client' && bookingClientId !== actorId) {
    throw new ForbiddenError('This booking does not belong to you');
  }
  if (actorRole === 'carwash' && bookingCarWashId !== actorId) {
    throw new ForbiddenError('This booking does not belong to your car wash');
  }

  // 4. Apply role-specific business rules
  if (actorRole === 'client') {
    validateClientRules(booking, requestedStatus);
  }

  // 5. Determine final status (with driver remapping)
  let finalStatus = requestedStatus;
  if (actorRole === 'driver') {
    finalStatus = applyDriverRemapping(requestedStatus);
  }

  // 6. Build update payload
  const timestamps = getTimestampUpdates(finalStatus, booking);
  const flags = getWorkflowFlagUpdates(finalStatus);
  const updateData = {
    status: finalStatus,
    ...timestamps,
    ...flags,
  };

  // 7. Persist with legacy fallback
  const { booking: updatedBooking, appliedStatus, wasRemapped } = await persistWithFallback(bookingId, updateData);

  // 8. Write audit log
  await writeAuditLog(bookingId, actorId, actorRole, booking.status, appliedStatus, {
    requestedStatus,
    wasRemapped,
    ...flags,
  });

  // 9. Dispatch notifications
  await dispatchNotifications(updatedBooking, appliedStatus, requestedStatus);

  return { updatedBooking, appliedStatus, wasRemapped };
}
