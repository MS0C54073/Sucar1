-- One-time SMS verification codes, keyed by phone so first-time (userless)
-- sign-ups work too. A row is replaced on resend and deleted on success.
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  phone       text PRIMARY KEY,
  code        text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
