-- Ratings & Reviews
-- Clients rate a completed booking; ratings aggregate onto the car wash and driver.
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_wash_id UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  car_wash_rating INTEGER CHECK (car_wash_rating BETWEEN 1 AND 5),
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_car_wash ON reviews(car_wash_id);
CREATE INDEX IF NOT EXISTS idx_reviews_driver ON reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);

-- Aggregate rating columns on users (car wash uses rating/rating_count;
-- driver_rating already exists from add-location-rating-fields.sql).
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.0
  CHECK (rating >= 0 AND rating <= 5.0);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0
  CHECK (rating_count >= 0);
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_rating DECIMAL(3, 2) DEFAULT 0.0
  CHECK (driver_rating >= 0 AND driver_rating <= 5.0);
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_rating_count INTEGER DEFAULT 0
  CHECK (driver_rating_count >= 0);

CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating) WHERE role = 'carwash';

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
