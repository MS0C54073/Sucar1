-- SuCAR Referral / Affiliate Program
-- Users opt in to become affiliates and earn rewards when referred friends complete washes.

CREATE TABLE IF NOT EXISTS referral_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_referrals INTEGER NOT NULL DEFAULT 0,
  total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_affiliates_code ON referral_affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_affiliates_user ON referral_affiliates(user_id);

CREATE TABLE IF NOT EXISTS referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES referral_affiliates(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'signed_up',
  -- signed_up | first_booking | completed_booking
  first_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reward_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_events_affiliate ON referral_events(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_status ON referral_events(status);

CREATE TABLE IF NOT EXISTS referral_cashouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES referral_affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending | completed | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_cashouts_user ON referral_cashouts(user_id);
