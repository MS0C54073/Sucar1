import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

/** Known test accounts from SEED_DATA_CREDENTIALS.md */
const SEED_ACCOUNTS: { email: string; password: string; role: string }[] = [
  { email: 'admin@sucar.com', password: 'admin123', role: 'admin' },
  { email: 'john.mwansa@email.com', password: 'client123', role: 'client' },
  { email: 'sarah.banda@email.com', password: 'client123', role: 'client' },
  { email: 'peter.phiri@email.com', password: 'client123', role: 'client' },
  { email: 'mary.tembo@email.com', password: 'client123', role: 'client' },
  { email: 'david.ngoma@email.com', password: 'client123', role: 'client' },
  { email: 'sparkle@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'crystal@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'shine@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'premium@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'quick@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'elite@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'autoshine@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'mega@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'spotless@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'ultra@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver' },
  { email: 'michael.chanda@driver.com', password: 'driver123', role: 'driver' },
  { email: 'robert.mwanza@driver.com', password: 'driver123', role: 'driver' },
  { email: 'thomas.banda@driver.com', password: 'driver123', role: 'driver' },
  { email: 'andrew.phiri@driver.com', password: 'driver123', role: 'driver' },
  { email: 'daniel.tembo@driver.com', password: 'driver123', role: 'driver' },
  { email: 'mark.ngoma@driver.com', password: 'driver123', role: 'driver' },
  { email: 'paul.mwila@driver.com', password: 'driver123', role: 'driver' },
  { email: 'steven.lungu@driver.com', password: 'driver123', role: 'driver' },
  { email: 'brian.mbewe@driver.com', password: 'driver123', role: 'driver' },
];

async function passwordOk(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    return bcrypt.compare(plain, stored);
  }
  return stored === plain;
}

/**
 * Ensures seed test accounts can log in: valid bcrypt password, active, approved.
 */
export async function ensureSeedUsers(): Promise<void> {
  let repaired = 0;
  let missing = 0;

  for (const account of SEED_ACCOUNTS) {
    const email = account.email.toLowerCase().trim();
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, password, is_active, approval_status, role')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn(`⚠️  ensureSeedUsers ${email}:`, error.message);
        continue;
      }

      if (!user) {
        missing++;
        continue;
      }

      const ok = await passwordOk(account.password, user.password as string | null);
      const updates: Record<string, unknown> = {};

      if (!ok) {
        updates.password = await bcrypt.hash(account.password, 10);
      }
      if (user.is_active === false) {
        updates.is_active = true;
      }
      if (user.approval_status && user.approval_status !== 'approved') {
        updates.approval_status = 'approved';
      }

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabase.from('users').update(updates).eq('id', user.id);
        if (upErr) {
          console.warn(`⚠️  Could not repair ${email}:`, upErr.message);
        } else {
          repaired++;
        }
      }
    } catch (e: any) {
      console.warn(`⚠️  ensureSeedUsers ${email}:`, e.message);
    }
  }

  if (repaired > 0) {
    console.log(`✅ Repaired ${repaired} seed account(s) for login`);
  }
  if (missing > 0) {
    console.log(`ℹ️  ${missing} seed account(s) missing — run: cd backend && node scripts/seed-data.js`);
  }
}
