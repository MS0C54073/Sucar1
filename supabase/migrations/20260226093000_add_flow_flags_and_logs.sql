-- Add transparent flow flags and audit log
BEGIN;

-- Flags on bookings to support dual-confirmation and progress markers
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS wash_acceptance_pending BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS client_confirm_pending BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS return_in_progress BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS out_for_delivery BOOLEAN DEFAULT FALSE;

-- Audit log for booking status transitions and key custody events
CREATE TABLE IF NOT EXISTS booking_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(20) NOT NULL,
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  note TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_status_log_booking_id ON booking_status_log(booking_id);

COMMIT;
