-- Location Tracking Schema Migration
-- Creates user_locations table, adds coordinates to car_washes, and nearby_car_washes RPC

-- 1. Create user_locations table for real-time tracking
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(8, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user_id)
);

-- 2. Create indexes for performance
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_last_updated ON user_locations(user_id, last_updated DESC);
CREATE INDEX idx_user_locations_coords ON user_locations(latitude, longitude);

-- 3. Add columns to car_washes table for location
ALTER TABLE car_washes 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 4. Add constraint to ensure both lat/lng are set together
ALTER TABLE car_washes 
ADD CONSTRAINT car_wash_coords_both_or_none 
CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL));

-- 5. Create PostGIS extension for spatial queries (if not exists)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 6. Create nearby_car_washes RPC using haversine formula
CREATE OR REPLACE FUNCTION nearby_car_washes(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cw.id,
    cw.name,
    cw.latitude,
    cw.longitude,
    ROUND(
      (
        6371 * ACOS(
          LEAST(1, GREATEST(-1, 
            COS(RADIANS(90 - user_lat)) * 
            COS(RADIANS(90 - cw.latitude)) + 
            SIN(RADIANS(90 - user_lat)) * 
            SIN(RADIANS(90 - cw.latitude)) * 
            COS(RADIANS(user_lng - cw.longitude))
          ))
        )
      )::NUMERIC, 2
    )::DECIMAL AS distance_km,
    cw.is_active,
    cw.created_at
  FROM car_washes cw
  WHERE 
    cw.latitude IS NOT NULL 
    AND cw.longitude IS NOT NULL
    AND cw.is_active = true
    AND (
      6371 * ACOS(
        LEAST(1, GREATEST(-1, 
          COS(RADIANS(90 - user_lat)) * 
          COS(RADIANS(90 - cw.latitude)) + 
          SIN(RADIANS(90 - user_lat)) * 
          SIN(RADIANS(90 - cw.latitude)) * 
          COS(RADIANS(user_lng - cw.longitude))
        ))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Enable Row Level Security
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policy: Users can read their own location
CREATE POLICY user_locations_select_own ON user_locations
  FOR SELECT
  USING (user_id = auth.uid());

-- 9. RLS Policy: Users can read counterparty location during active booking
-- (Client sees driver, driver sees client, car wash sees both)
CREATE POLICY user_locations_select_booking_counterparty ON user_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.status IN ('assigned_driver', 'driver_arrived', 'in_service', 'ready_for_delivery', 'out_for_delivery')
      AND (
        (auth.uid() = b.client_id AND user_id = b.driver_id) -- Client sees driver
        OR
        (auth.uid() = b.driver_id AND user_id = b.client_id) -- Driver sees client
        OR
        (auth.uid() = (SELECT id FROM users WHERE email = 
          (SELECT email FROM users WHERE id = b.car_wash_id)) 
         AND (user_id = b.client_id OR user_id = b.driver_id)) -- Car wash sees both
      )
    )
  );

-- 10. RLS Policy: Admins can read all locations
CREATE POLICY user_locations_select_admin ON user_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 11. RLS Policy: Users can insert their own location
CREATE POLICY user_locations_insert_own ON user_locations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 12. RLS Policy: Users can update their own location
CREATE POLICY user_locations_update_own ON user_locations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 13. RLS Policy: Users can delete their own location
CREATE POLICY user_locations_delete_own ON user_locations
  FOR DELETE
  USING (user_id = auth.uid());

-- 14. RLS Policy: Admins can delete any location
CREATE POLICY user_locations_delete_admin ON user_locations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 15. Enable Realtime for user_locations
ALTER PUBLICATION supabase_realtime ADD TABLE user_locations;

-- 16. Create trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_user_locations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_locations_update_timestamp
BEFORE UPDATE ON user_locations
FOR EACH ROW
EXECUTE FUNCTION update_user_locations_timestamp();
