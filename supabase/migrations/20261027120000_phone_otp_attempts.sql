-- One-time SMS verification codes, keyed by phone so first-time (userless)
-- sign-ups work too. Mirrors backend/migrations/add-phone-verification.sql.
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  phone       text PRIMARY KEY,
  code        text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Wrong guesses against the current code; it is burned after 5 (see
-- backend/src/domain/otp.ts) so codes cannot be brute-forced across many IPs.
ALTER TABLE phone_verification_codes
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
