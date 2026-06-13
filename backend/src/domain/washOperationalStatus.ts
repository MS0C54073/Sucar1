/** Operational workflow statuses for wash sessions */
export type WashOperationalStatus =
  | 'CHECKED_IN'
  | 'WAITING'
  | 'ASSIGNED_TO_BAY'
  | 'WASH_IN_PROGRESS'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_UPLOADED'
  | 'PAYMENT_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export const WASH_STATUS_TRANSITIONS: Record<WashOperationalStatus, WashOperationalStatus[]> = {
  CHECKED_IN: ['WAITING', 'CANCELLED'],
  WAITING: ['ASSIGNED_TO_BAY', 'CANCELLED'],
  ASSIGNED_TO_BAY: ['WASH_IN_PROGRESS', 'PAYMENT_PENDING', 'WAITING', 'CANCELLED'],
  WASH_IN_PROGRESS: ['PAYMENT_PENDING', 'PAYMENT_UPLOADED', 'COMPLETED', 'CANCELLED'],
  PAYMENT_PENDING: ['PAYMENT_UPLOADED', 'PAYMENT_CONFIRMED', 'CANCELLED'],
  PAYMENT_UPLOADED: ['PAYMENT_CONFIRMED', 'PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_CONFIRMED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionWashStatus(
  from: WashOperationalStatus,
  to: WashOperationalStatus
): boolean {
  if (from === to) return true;
  return WASH_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertWashTransition(from: string, to: WashOperationalStatus): void {
  const f = from as WashOperationalStatus;
  if (!canTransitionWashStatus(f, to)) {
    throw new Error(`Invalid wash status transition: ${from} → ${to}`);
  }
}

/** Map legacy queue row status to operational */
export function queueRowStatusToOperational(
  queueStatus: string,
  opStatus?: string | null
): WashOperationalStatus {
  if (opStatus) return opStatus as WashOperationalStatus;
  switch (queueStatus) {
    case 'in_progress':
      return 'WASH_IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    default:
      return 'WAITING';
  }
}
