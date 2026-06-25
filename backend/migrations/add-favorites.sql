-- Favorites: a client's saved car washes.
CREATE TABLE IF NOT EXISTS favorites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_wash_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, car_wash_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites (user_id);
CREATE INDEX IF NOT EXISTS favorites_car_wash_idx ON favorites (car_wash_id);
