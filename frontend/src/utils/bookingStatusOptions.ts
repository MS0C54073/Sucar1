export interface BookingForStatusOptions {
  status: string;
  paymentStatus?: string;
  bookingType?: 'pickup_delivery' | 'drive_in';
}

const TERMINAL_STATUSES = ['completed', 'cancelled'];

const NON_CANCELLABLE = [
  'completed',
  'cancelled',
  'wash_completed',
  'delivered_to_client',
  'delivered',
];

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const ADMIN_STATUSES = [
  'pending',
  'accepted',
  'picked_up',
  'picked_up_pending_confirmation',
  'delivered_to_wash',
  'at_wash',
  'waiting_bay',
  'washing_bay',
  'drying_bay',
  'wash_completed',
  'delivered_to_client',
  'delivered',
  'completed',
  'cancelled',
];

/** Statuses the user may set via manual update (backend validates on submit). */
export function getAllowedManualStatuses(
  role: string | undefined,
  booking: BookingForStatusOptions
): { value: string; label: string }[] {
  const { status, paymentStatus } = booking;

  if (TERMINAL_STATUSES.includes(status)) {
    return [];
  }

  if (role === 'admin' || role === 'subadmin') {
    return ADMIN_STATUSES.filter((s) => s !== status).map((s) => ({
      value: s,
      label: formatStatusLabel(s),
    }));
  }

  if (role === 'client') {
    const options: { value: string; label: string }[] = [];
    if (status === 'picked_up_pending_confirmation') {
      options.push({ value: 'picked_up', label: 'Confirm vehicle pickup' });
    }
    if (
      (status === 'delivered_to_client' || status === 'delivered') &&
      paymentStatus === 'paid'
    ) {
      options.push({ value: 'completed', label: 'Mark booking complete' });
    }
    if (!NON_CANCELLABLE.includes(status)) {
      options.push({ value: 'cancelled', label: 'Cancel booking' });
    }
    return options;
  }

  if (role === 'driver') {
    return [
      { value: 'accepted', label: 'Accepted' },
      { value: 'picked_up', label: 'Picked up (await client confirm)' },
      { value: 'delivered_to_wash', label: 'Delivered to car wash' },
      { value: 'delivered_to_client', label: 'Delivered to client' },
    ].filter((o) => o.value !== status);
  }

  if (role === 'carwash') {
    return [
      { value: 'waiting_bay', label: 'Waiting bay' },
      { value: 'at_wash', label: 'At wash / confirm arrival' },
      { value: 'washing_bay', label: 'Washing bay' },
      { value: 'drying_bay', label: 'Drying bay' },
      { value: 'wash_completed', label: 'Wash complete' },
    ].filter((o) => o.value !== status);
  }

  return [];
}

export function canCancelBooking(
  role: string | undefined,
  booking: BookingForStatusOptions
): boolean {
  if (NON_CANCELLABLE.includes(booking.status)) {
    return false;
  }
  return ['client', 'driver', 'carwash', 'admin', 'subadmin'].includes(role || '');
}
