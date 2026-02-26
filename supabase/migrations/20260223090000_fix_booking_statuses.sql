-- Migration: Add missing booking statuses and update check constraint
-- Adds 'picked_up_pending_confirmation' to enum type (if present)
-- and updates the bookings table check constraint to allow the new status

BEGIN;

-- If a Postgres enum type `booking_status` exists, add the new value if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'booking_status' AND e.enumlabel = 'picked_up_pending_confirmation'
    ) THEN
      ALTER TYPE booking_status ADD VALUE 'picked_up_pending_confirmation';
    END IF;
  END IF;
END$$;

-- Update bookings status check constraint to include the new status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (
  status IN (
    'pending', 'accepted', 'declined', 'picked_up', 'picked_up_pending_confirmation',
    'at_wash', 'waiting_bay', 'washing_bay', 'drying_bay', 'wash_completed',
    'delivered', 'delivered_to_wash', 'delivered_to_client', 'completed', 'cancelled', 'created', 'done'
  )
);

COMMIT;
