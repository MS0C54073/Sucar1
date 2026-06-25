-- Run in Supabase SQL editor if not using CLI migrations
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url TEXT;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'pending'));
