import {
  BOOKING_STATUSES,
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  CANCELLABLE_STATUSES,
  VALID_TRANSITIONS,
  ROLE_ALLOWED_STATUSES,
  isValidTransition,
  isRoleAllowed,
  validateTransition,
  getStatusLabel,
  getProgressPercentage,
  PICKUP_DELIVERY_TIMELINE,
  DRIVE_IN_TIMELINE,
  BookingStatus,
  UserRole,
} from '../booking-state-machine';

describe('Booking State Machine', () => {
  describe('Status Constants', () => {
    it('should define all expected booking statuses', () => {
      expect(BOOKING_STATUSES).toContain('pending');
      expect(BOOKING_STATUSES).toContain('accepted');
      expect(BOOKING_STATUSES).toContain('declined');
      expect(BOOKING_STATUSES).toContain('picked_up_pending_confirmation');
      expect(BOOKING_STATUSES).toContain('picked_up');
      expect(BOOKING_STATUSES).toContain('delivered_to_wash');
      expect(BOOKING_STATUSES).toContain('at_wash');
      expect(BOOKING_STATUSES).toContain('waiting_bay');
      expect(BOOKING_STATUSES).toContain('washing_bay');
      expect(BOOKING_STATUSES).toContain('drying_bay');
      expect(BOOKING_STATUSES).toContain('wash_completed');
      expect(BOOKING_STATUSES).toContain('delivered');
      expect(BOOKING_STATUSES).toContain('delivered_to_client');
      expect(BOOKING_STATUSES).toContain('completed');
      expect(BOOKING_STATUSES).toContain('cancelled');
    });

    it('should have terminal statuses with no outgoing transitions', () => {
      TERMINAL_STATUSES.forEach((status) => {
        expect(VALID_TRANSITIONS[status]).toEqual([]);
      });
    });

    it('should not overlap active and completed status groups', () => {
      const overlap = ACTIVE_STATUSES.filter((s) => COMPLETED_STATUSES.includes(s));
      expect(overlap).toEqual([]);
    });
  });

  describe('isValidTransition', () => {
    it('should allow pending -> accepted', () => {
      expect(isValidTransition('pending', 'accepted')).toBe(true);
    });

    it('should allow pending -> cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true);
    });

    it('should allow accepted -> picked_up_pending_confirmation', () => {
      expect(isValidTransition('accepted', 'picked_up_pending_confirmation')).toBe(true);
    });

    it('should allow picked_up_pending_confirmation -> picked_up (client confirms)', () => {
      expect(isValidTransition('picked_up_pending_confirmation', 'picked_up')).toBe(true);
    });

    it('should allow picked_up -> delivered_to_wash', () => {
      expect(isValidTransition('picked_up', 'delivered_to_wash')).toBe(true);
    });

    it('should allow washing_bay -> drying_bay', () => {
      expect(isValidTransition('washing_bay', 'drying_bay')).toBe(true);
    });

    it('should allow wash_completed -> delivered_to_client', () => {
      expect(isValidTransition('wash_completed', 'delivered_to_client')).toBe(true);
    });

    it('should allow delivered_to_client -> completed', () => {
      expect(isValidTransition('delivered_to_client', 'completed')).toBe(true);
    });

    it('should NOT allow pending -> wash_completed (skip)', () => {
      expect(isValidTransition('pending', 'wash_completed')).toBe(false);
    });

    it('should NOT allow completed -> pending (reverse)', () => {
      expect(isValidTransition('completed', 'pending')).toBe(false);
    });

    it('should NOT allow cancelled -> accepted', () => {
      expect(isValidTransition('cancelled', 'accepted')).toBe(false);
    });

    it('should NOT allow drying_bay -> washing_bay (backward)', () => {
      expect(isValidTransition('drying_bay', 'washing_bay')).toBe(false);
    });
  });

  describe('isRoleAllowed', () => {
    it('should allow driver to set accepted', () => {
      expect(isRoleAllowed('driver', 'accepted')).toBe(true);
    });

    it('should allow driver to set picked_up', () => {
      expect(isRoleAllowed('driver', 'picked_up')).toBe(true);
    });

    it('should NOT allow driver to set washing_bay', () => {
      expect(isRoleAllowed('driver', 'washing_bay')).toBe(false);
    });

    it('should allow carwash to set washing_bay', () => {
      expect(isRoleAllowed('carwash', 'washing_bay')).toBe(true);
    });

    it('should NOT allow carwash to set picked_up', () => {
      expect(isRoleAllowed('carwash', 'picked_up')).toBe(false);
    });

    it('should allow client to set cancelled', () => {
      expect(isRoleAllowed('client', 'cancelled')).toBe(true);
    });

    it('should NOT allow client to set washing_bay', () => {
      expect(isRoleAllowed('client', 'washing_bay')).toBe(false);
    });

    it('should allow admin to set any status', () => {
      BOOKING_STATUSES.forEach((status) => {
        expect(isRoleAllowed('admin', status)).toBe(true);
      });
    });
  });

  describe('validateTransition', () => {
    it('should validate a correct driver transition', () => {
      const result = validateTransition('pending', 'accepted', 'driver');
      expect(result.valid).toBe(true);
    });

    it('should reject transition from terminal status', () => {
      const result = validateTransition('completed', 'pending', 'admin');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('terminal');
    });

    it('should reject unauthorized role', () => {
      const result = validateTransition('at_wash', 'washing_bay', 'client');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not allowed');
    });

    it('should reject invalid transition path', () => {
      const result = validateTransition('pending', 'wash_completed', 'admin');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    it('should allow admin to bypass role restrictions', () => {
      const result = validateTransition('pending', 'accepted', 'admin');
      expect(result.valid).toBe(true);
    });
  });

  describe('getStatusLabel', () => {
    it('should return human-readable labels', () => {
      expect(getStatusLabel('pending')).toBe('Pending');
      expect(getStatusLabel('picked_up_pending_confirmation')).toBe('Awaiting Client Confirmation');
      expect(getStatusLabel('wash_completed')).toBe('Wash Completed');
      expect(getStatusLabel('delivered_to_client')).toBe('Delivered to Client');
    });
  });

  describe('getProgressPercentage', () => {
    it('should return 0 for first status in pickup_delivery timeline', () => {
      expect(getProgressPercentage('pending', 'pickup_delivery')).toBe(0);
    });

    it('should return 100 for completed', () => {
      expect(getProgressPercentage('completed', 'pickup_delivery')).toBe(100);
    });

    it('should return 0 for cancelled', () => {
      expect(getProgressPercentage('cancelled', 'pickup_delivery')).toBe(0);
    });

    it('should return increasing percentages along the timeline', () => {
      let prev = -1;
      PICKUP_DELIVERY_TIMELINE.forEach((status) => {
        const pct = getProgressPercentage(status, 'pickup_delivery');
        expect(pct).toBeGreaterThanOrEqual(prev);
        prev = pct;
      });
    });

    it('should work for drive-in timeline', () => {
      expect(getProgressPercentage('waiting_bay', 'drive_in')).toBe(0);
      expect(getProgressPercentage('wash_completed', 'drive_in')).toBeGreaterThan(50);
    });
  });

  describe('Transition Graph Integrity', () => {
    it('every status in VALID_TRANSITIONS targets should be a valid BookingStatus', () => {
      Object.entries(VALID_TRANSITIONS).forEach(([from, targets]) => {
        targets.forEach((target) => {
          expect(BOOKING_STATUSES).toContain(target);
        });
      });
    });

    it('every BookingStatus should have an entry in VALID_TRANSITIONS', () => {
      BOOKING_STATUSES.forEach((status) => {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
      });
    });

    it('cancellable statuses should all allow transition to cancelled', () => {
      CANCELLABLE_STATUSES.forEach((status) => {
        expect(VALID_TRANSITIONS[status]).toContain('cancelled');
      });
    });
  });
});
