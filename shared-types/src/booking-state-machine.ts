/**
 * Centralized Booking State Machine
 *
 * Single source of truth for the booking lifecycle across all platforms
 * (backend, web frontend, mobile app). Any status transition must be
 * validated against this module.
 *
 * Status Flow (Pickup & Delivery):
 *   pending -> accepted -> picked_up_pending_confirmation -> picked_up
 *   -> delivered_to_wash -> at_wash -> waiting_bay -> washing_bay
 *   -> drying_bay -> wash_completed -> delivered_to_client -> completed
 *
 * Status Flow (Drive-In):
 *   waiting_bay -> at_wash -> washing_bay -> drying_bay
 *   -> wash_completed -> completed
 *
 * Terminal states: completed, cancelled, declined
 */

// ─── Status Enum ─────────────────────────────────────────────────────────────

export const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'declined',
  'picked_up_pending_confirmation',
  'picked_up',
  'delivered_to_wash',
  'at_wash',
  'waiting_bay',
  'washing_bay',
  'drying_bay',
  'wash_completed',
  'delivered',
  'delivered_to_client',
  'completed',
  'cancelled',
] as const;

export type BookingStatus = typeof BOOKING_STATUSES[number];

// ─── Booking Types ───────────────────────────────────────────────────────────

export const BOOKING_TYPES = ['pickup_delivery', 'drive_in'] as const;
export type BookingType = typeof BOOKING_TYPES[number];

// ─── Status Groups ───────────────────────────────────────────────────────────

/** Terminal statuses — no further transitions allowed */
export const TERMINAL_STATUSES: BookingStatus[] = ['completed', 'cancelled', 'declined'];

/** Statuses considered "active" for UI grouping */
export const ACTIVE_STATUSES: BookingStatus[] = [
  'pending',
  'accepted',
  'picked_up_pending_confirmation',
  'picked_up',
  'delivered_to_wash',
  'at_wash',
  'waiting_bay',
  'washing_bay',
  'drying_bay',
  'wash_completed',
];

/** Statuses considered "completed" for UI grouping */
export const COMPLETED_STATUSES: BookingStatus[] = ['completed', 'delivered', 'delivered_to_client'];

/** Statuses that are cancellable */
export const CANCELLABLE_STATUSES: BookingStatus[] = ['pending', 'accepted', 'picked_up_pending_confirmation', 'picked_up'];

// ─── Role-Based Allowed Transitions ─────────────────────────────────────────

export type UserRole = 'client' | 'driver' | 'carwash' | 'admin' | 'subadmin';

/**
 * Defines which statuses each role is allowed to set.
 * Admin/subadmin can set any status.
 */
export const ROLE_ALLOWED_STATUSES: Record<UserRole, BookingStatus[]> = {
  client: ['picked_up', 'cancelled', 'completed'],
  driver: ['accepted', 'declined', 'picked_up', 'delivered_to_wash', 'delivered_to_client'],
  carwash: ['at_wash', 'waiting_bay', 'washing_bay', 'drying_bay', 'wash_completed'],
  admin: [...BOOKING_STATUSES],
  subadmin: [...BOOKING_STATUSES],
};

// ─── Valid Transitions Map ───────────────────────────────────────────────────

/**
 * Maps each status to the set of statuses it can transition to.
 * This is the canonical transition graph.
 */
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['accepted', 'declined', 'cancelled'],
  accepted: ['picked_up_pending_confirmation', 'picked_up', 'declined', 'cancelled', 'waiting_bay'],
  declined: [],
  picked_up_pending_confirmation: ['picked_up', 'cancelled'],
  picked_up: ['delivered_to_wash', 'at_wash', 'cancelled'],
  delivered_to_wash: ['at_wash', 'waiting_bay', 'washing_bay'],
  at_wash: ['waiting_bay', 'washing_bay'],
  waiting_bay: ['at_wash', 'washing_bay'],
  washing_bay: ['drying_bay'],
  drying_bay: ['wash_completed', 'delivered_to_client'],
  wash_completed: ['delivered_to_client', 'delivered', 'completed'],
  delivered: ['completed'],
  delivered_to_client: ['completed'],
  completed: [],
  cancelled: [],
};

// ─── Validation Helpers ──────────────────────────────────────────────────────

/**
 * Check if a transition from one status to another is valid.
 */
export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Check if a role is allowed to set a given status.
 */
export function isRoleAllowed(role: UserRole, status: BookingStatus): boolean {
  if (role === 'admin' || role === 'subadmin') return true;
  const allowed = ROLE_ALLOWED_STATUSES[role];
  return allowed ? allowed.includes(status) : false;
}

/**
 * Validate a complete status transition request.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateTransition(
  from: BookingStatus,
  to: BookingStatus,
  role: UserRole
): { valid: boolean; reason?: string } {
  if (TERMINAL_STATUSES.includes(from)) {
    return { valid: false, reason: `Cannot transition from terminal status "${from}"` };
  }

  if (!isRoleAllowed(role, to)) {
    return { valid: false, reason: `Role "${role}" is not allowed to set status "${to}"` };
  }

  if (!isValidTransition(from, to)) {
    return { valid: false, reason: `Invalid transition from "${from}" to "${to}"` };
  }

  return { valid: true };
}

// ─── Status Labels ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  picked_up_pending_confirmation: 'Awaiting Client Confirmation',
  picked_up: 'Picked Up',
  delivered_to_wash: 'Delivered to Wash',
  at_wash: 'At Car Wash',
  waiting_bay: 'Waiting Bay',
  washing_bay: 'Washing',
  drying_bay: 'Drying',
  wash_completed: 'Wash Completed',
  delivered: 'Delivered',
  delivered_to_client: 'Delivered to Client',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Get human-readable label for a status.
 */
export function getStatusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status] || status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Driver-Specific Mapping ─────────────────────────────────────────────────

/**
 * When a driver sets 'picked_up', the backend maps it to
 * 'picked_up_pending_confirmation' so the client must confirm.
 */
export const DRIVER_STATUS_REMAP: Partial<Record<BookingStatus, BookingStatus>> = {
  picked_up: 'picked_up_pending_confirmation',
};

// ─── Legacy Fallback Mapping ─────────────────────────────────────────────────

/**
 * For databases that haven't applied the latest migration,
 * map newer statuses to legacy-compatible ones.
 */
export const LEGACY_FALLBACK_MAP: Partial<Record<BookingStatus, BookingStatus>> = {
  picked_up_pending_confirmation: 'picked_up',
  delivered_to_wash: 'at_wash',
  delivered_to_client: 'delivered',
  waiting_bay: 'at_wash',
};

/**
 * Second-tier fallback for very old schemas.
 */
export const LEGACY_TIER2_FALLBACK: Partial<Record<BookingStatus, BookingStatus>> = {
  delivered_to_wash: 'delivered',
  waiting_bay: 'delivered',
  washing_bay: 'delivered',
  drying_bay: 'delivered',
  delivered_to_client: 'completed',
};

// ─── Timeline Ordering ───────────────────────────────────────────────────────

/**
 * Canonical ordering of statuses for timeline/progress display.
 * Used by LiveTracking and progress indicators.
 */
export const PICKUP_DELIVERY_TIMELINE: BookingStatus[] = [
  'pending',
  'accepted',
  'picked_up_pending_confirmation',
  'picked_up',
  'delivered_to_wash',
  'at_wash',
  'washing_bay',
  'drying_bay',
  'wash_completed',
  'delivered_to_client',
  'completed',
];

export const DRIVE_IN_TIMELINE: BookingStatus[] = [
  'waiting_bay',
  'at_wash',
  'washing_bay',
  'drying_bay',
  'wash_completed',
  'completed',
];

/**
 * Get the progress percentage for a given status in a booking type.
 */
export function getProgressPercentage(status: BookingStatus, bookingType: BookingType): number {
  const timeline = bookingType === 'drive_in' ? DRIVE_IN_TIMELINE : PICKUP_DELIVERY_TIMELINE;
  const index = timeline.indexOf(status);
  if (index === -1) {
    // Terminal or out-of-flow status
    if (status === 'completed') return 100;
    if (status === 'cancelled' || status === 'declined') return 0;
    return 50; // Unknown position
  }
  return Math.round((index / (timeline.length - 1)) * 100);
}
