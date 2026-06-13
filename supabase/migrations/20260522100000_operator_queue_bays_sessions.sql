-- Operator queue: washing bays, wash sessions, extended queue & payments

CREATE TABLE IF NOT EXISTS washing_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bay_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'maintenance', 'offline')),
  service_types TEXT[] DEFAULT ARRAY['standard', 'deluxe', 'detail'],
  max_vehicle_size VARCHAR(20) DEFAULT 'large',
  current_wash_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (car_wash_id, bay_number)
);

CREATE INDEX IF NOT EXISTS idx_washing_bays_car_wash ON washing_bays(car_wash_id);
CREATE INDEX IF NOT EXISTS idx_washing_bays_status ON washing_bays(car_wash_id, status);

CREATE TABLE IF NOT EXISTS wash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  queue_entry_id UUID,
  bay_id UUID REFERENCES washing_bays(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operational_status VARCHAR(40) NOT NULL DEFAULT 'WAITING',
  service_duration_minutes INTEGER NOT NULL DEFAULT 30,
  priority INTEGER NOT NULL DEFAULT 0,
  is_express BOOLEAN NOT NULL DEFAULT FALSE,
  vehicle_size VARCHAR(20) DEFAULT 'medium',
  service_type VARCHAR(100),
  wash_started_at TIMESTAMPTZ,
  wash_ends_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_wash_sessions_car_wash ON wash_sessions(car_wash_id);
CREATE INDEX IF NOT EXISTS idx_wash_sessions_status ON wash_sessions(car_wash_id, operational_status);
CREATE INDEX IF NOT EXISTS idx_wash_sessions_bay ON wash_sessions(bay_id);

-- Extend queue (table may exist from backend script)
CREATE TABLE IF NOT EXISTS car_wash_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  estimated_start_time TIMESTAMPTZ,
  estimated_completion_time TIMESTAMPTZ,
  service_duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (car_wash_id, booking_id)
);

ALTER TABLE car_wash_queue ADD COLUMN IF NOT EXISTS wash_session_id UUID REFERENCES wash_sessions(id) ON DELETE SET NULL;
ALTER TABLE car_wash_queue ADD COLUMN IF NOT EXISTS bay_id UUID REFERENCES washing_bays(id) ON DELETE SET NULL;
ALTER TABLE car_wash_queue ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE car_wash_queue ADD COLUMN IF NOT EXISTS is_express BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE car_wash_queue ADD COLUMN IF NOT EXISTS operational_status VARCHAR(40) DEFAULT 'WAITING';

ALTER TABLE payments ADD COLUMN IF NOT EXISTS wash_session_id UUID REFERENCES wash_sessions(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Realtime (ignore if publication missing)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE washing_bays;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wash_sessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE car_wash_queue;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
