-- Migration: Ensure booking_status enum includes all application statuses
-- and update bookings_status_check to allow them

BEGIN;

-- List of statuses used across the application
-- We'll add any missing enum labels to the booking_status type
DO $$
DECLARE
  vals TEXT[] := ARRAY[
    'pending','accepted','declined','picked_up','picked_up_pending_confirmation',
    'at_wash','waiting_bay','washing_bay','drying_bay','wash_completed',
    'delivered','delivered_to_wash','delivered_to_client','completed','cancelled',
    'created','done'
  ];
  v TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    FOREACH v IN ARRAY vals LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'booking_status' AND e.enumlabel = v
      ) THEN
        EXECUTE format('ALTER TYPE booking_status ADD VALUE IF NOT EXISTS %L', v);
      END IF;
    END LOOP;
  END IF;
END$$;

-- Replace bookings_status_check with an updated list to prevent constraint violations
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (
  status::text IN (
    'pending','accepted','declined','picked_up','picked_up_pending_confirmation',
    'at_wash','waiting_bay','washing_bay','drying_bay','wash_completed',
    'delivered','delivered_to_wash','delivered_to_client','completed','cancelled',
    'created','done'
  )
);

COMMIT;
