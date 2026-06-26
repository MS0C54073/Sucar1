/**
 * Centralized booking lifecycle helpers.
 *
 * This is the single source of truth in the mobile app for how booking
 * statuses are labelled, coloured, and which action each role can take next.
 * It mirrors the backend state machine in
 * `backend/src/controllers/bookingController.ts` (including the legacy-safe
 * fallbacks where `delivered_to_wash` is stored as `at_wash` and
 * `delivered_to_client` is stored as `delivered`).
 */
import { Colors } from './theme';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'picked_up_pending_confirmation'
  | 'picked_up'
  | 'delivered_to_wash'
  | 'at_wash'
  | 'waiting_bay'
  | 'washing_bay'
  | 'drying_bay'
  | 'wash_completed'
  | 'delivered_to_client'
  | 'delivered'
  | 'completed'
  | 'cancelled';

/** Human-friendly labels for every backend status (incl. legacy aliases). */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  picked_up_pending_confirmation: 'Awaiting Pickup Confirmation',
  picked_up: 'Picked Up',
  delivered_to_wash: 'Delivered to Wash',
  at_wash: 'At Car Wash',
  waiting_bay: 'Waiting Bay',
  washing_bay: 'Washing',
  drying_bay: 'Drying',
  wash_completed: 'Wash Completed',
  delivered_to_client: 'Delivered',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Status badge colours (extends the base StatusColors map in theme.ts). */
export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.info,
  declined: Colors.error,
  picked_up_pending_confirmation: Colors.warning,
  picked_up: Colors.primary,
  delivered_to_wash: Colors.info,
  at_wash: Colors.gray500,
  waiting_bay: Colors.gray500,
  washing_bay: Colors.primary,
  drying_bay: Colors.info,
  wash_completed: Colors.success,
  delivered_to_client: Colors.success,
  delivered: Colors.success,
  completed: Colors.success,
  cancelled: Colors.error,
};

const titleCase = (status: string) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const getStatusLabel = (status?: string): string => {
  if (!status) return 'Unknown';
  return BOOKING_STATUS_LABELS[status] || titleCase(status);
};

export const getStatusColor = (status?: string): string => {
  if (!status) return Colors.gray500;
  return BOOKING_STATUS_COLORS[status] || Colors.gray500;
};

/** Terminal states – no further action possible. */
const COMPLETED_STATUSES = ['completed', 'cancelled', 'declined'];

export const isCompletedBooking = (status?: string): boolean =>
  status ? COMPLETED_STATUSES.includes(status) : false;

/**
 * Active states where the client should see the live tracking experience.
 * Mirrors the in-flight portion of the lifecycle (driver assigned through
 * delivery), excluding terminal/idle states.
 */
const ACTIVE_STATUSES = [
  'accepted',
  'picked_up_pending_confirmation',
  'picked_up',
  'delivered_to_wash',
  'at_wash',
  'waiting_bay',
  'washing_bay',
  'drying_bay',
  'wash_completed',
  'delivered_to_client',
  'delivered',
];

export const isActiveBooking = (status?: string): boolean =>
  status ? ACTIVE_STATUSES.includes(status) : false;

export interface DriverAction {
  label: string;
  icon: 'checkmark-circle' | 'car' | 'business' | 'arrow-redo' | 'navigate' | 'checkmark-done';
  /**
   * How to perform the action:
   * - `accept`     → PUT /drivers/bookings/:id/accept
   * - `status`     → PUT /bookings/:id/status { status: apiStatus }
   * - `return`     → POST /bookings/:id/return-in-progress
   * - `delivery`   → POST /bookings/:id/out-for-delivery
   */
  kind: 'accept' | 'status' | 'return' | 'delivery';
  apiStatus?: string;
}

export interface BookingLike {
  status?: string;
  returnInProgress?: boolean;
  outForDelivery?: boolean;
}

/**
 * Determines the single next action a driver can take for a booking, given
 * its status and return-delivery flags. Returns `null` when the driver must
 * wait on another party (client confirmation, car wash processing, payment).
 */
export const getDriverNextAction = (booking: BookingLike): DriverAction | null => {
  const status = booking.status;

  switch (status) {
    case 'pending':
      return { label: 'Accept Job', icon: 'checkmark-circle', kind: 'accept' };
    case 'accepted':
      return { label: 'Mark Picked Up', icon: 'car', kind: 'status', apiStatus: 'picked_up' };
    case 'picked_up':
      return {
        label: 'Deliver to Wash',
        icon: 'business',
        kind: 'status',
        apiStatus: 'delivered_to_wash',
      };
    // Return-delivery flow once the wash is finished.
    case 'wash_completed':
    case 'drying_bay':
      if (!booking.returnInProgress) {
        return { label: 'Start Return', icon: 'arrow-redo', kind: 'return' };
      }
      if (!booking.outForDelivery) {
        return { label: 'Out for Delivery', icon: 'navigate', kind: 'delivery' };
      }
      return {
        label: 'Mark Delivered',
        icon: 'checkmark-done',
        kind: 'status',
        apiStatus: 'delivered_to_client',
      };
    default:
      // picked_up_pending_confirmation, delivered_to_wash, at_wash, waiting_bay,
      // washing_bay, delivered(_to_client), completed, cancelled → no driver action.
      return null;
  }
};

/** Short hint explaining why the driver currently has no action. */
export const getDriverWaitingHint = (status?: string): string | null => {
  switch (status) {
    case 'picked_up_pending_confirmation':
      return 'Waiting for client to confirm pickup';
    case 'delivered_to_wash':
    case 'at_wash':
    case 'waiting_bay':
    case 'washing_bay':
      return 'Car wash is processing the vehicle';
    case 'delivered_to_client':
    case 'delivered':
      return 'Waiting for client to confirm receipt & payment';
    default:
      return null;
  }
};
