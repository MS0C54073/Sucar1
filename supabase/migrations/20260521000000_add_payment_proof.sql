-- Payment proof (receipt screenshot URL or data URL)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Allow placeholder until client selects method (legacy rows may use 'pending')
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'pending'));
