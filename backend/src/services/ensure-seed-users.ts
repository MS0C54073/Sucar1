import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

type SeedAccount = {
  email: string;
  password: string;
  role: 'admin' | 'client' | 'driver' | 'carwash';
  name: string;
  phone: string;
  nrc: string;
  carWashName?: string;
  location?: string;
  washingBays?: number;
};

/** Known test accounts — passwords must match Login.tsx dev hints */
const SEED_ACCOUNTS: SeedAccount[] = [
  { email: 'admin@sucar.com', password: 'admin123', role: 'admin', name: 'Admin User', phone: '+260970000000', nrc: 'ADMIN001' },
  { email: 'john.mwansa@email.com', password: 'client123', role: 'client', name: 'John Mwansa', phone: '0977123456', nrc: 'CLI001' },
  { email: 'sarah.banda@email.com', password: 'client123', role: 'client', name: 'Sarah Banda', phone: '0977123457', nrc: 'CLI002' },
  { email: 'peter.phiri@email.com', password: 'client123', role: 'client', name: 'Peter Phiri', phone: '0977123458', nrc: 'CLI003' },
  { email: 'mary.tembo@email.com', password: 'client123', role: 'client', name: 'Mary Tembo', phone: '0977123459', nrc: 'CLI004' },
  { email: 'david.ngoma@email.com', password: 'client123', role: 'client', name: 'David Ngoma', phone: '0977123460', nrc: 'CLI005' },
  {
    email: 'sparkle@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Sparkle Auto Wash',
    phone: '0211234567',
    nrc: 'CW001',
    carWashName: 'Sparkle Auto Wash',
    location: 'Cairo Road, Lusaka',
    washingBays: 3,
  },
  {
    email: 'crystal@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Crystal Clean Car Wash',
    phone: '0211234568',
    nrc: 'CW002',
    carWashName: 'Crystal Clean Car Wash',
    location: 'Great East Road, Lusaka',
    washingBays: 4,
  },
  {
    email: 'shine@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Shine Bright Car Care',
    phone: '0211234569',
    nrc: 'CW003',
    carWashName: 'Shine Bright Car Care',
    location: 'Makeni Road, Lusaka',
    washingBays: 2,
  },
  {
    email: 'premium@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Premium Wash Center',
    phone: '0211234570',
    nrc: 'CW004',
    carWashName: 'Premium Wash Center',
    location: 'Woodlands, Lusaka',
    washingBays: 5,
  },
  {
    email: 'quick@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Quick Wash Express',
    phone: '0211234571',
    nrc: 'CW005',
    carWashName: 'Quick Wash Express',
    location: 'Kabulonga, Lusaka',
    washingBays: 2,
  },
  {
    email: 'elite@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Elite Car Spa',
    phone: '0211234572',
    nrc: 'CW006',
    carWashName: 'Elite Car Spa',
    location: 'Roma, Lusaka',
    washingBays: 3,
  },
  {
    email: 'autoshine@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Auto Shine Pro',
    phone: '0211234573',
    nrc: 'CW007',
    carWashName: 'Auto Shine Pro',
    location: 'Northmead, Lusaka',
    washingBays: 4,
  },
  {
    email: 'mega@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Mega Wash Hub',
    phone: '0211234574',
    nrc: 'CW008',
    carWashName: 'Mega Wash Hub',
    location: 'Chilenje, Lusaka',
    washingBays: 6,
  },
  {
    email: 'spotless@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Spotless Auto Care',
    phone: '0211234575',
    nrc: 'CW009',
    carWashName: 'Spotless Auto Care',
    location: 'Libala, Lusaka',
    washingBays: 3,
  },
  {
    email: 'ultra@carwash.com',
    password: 'carwash123',
    role: 'carwash',
    name: 'Ultra Clean Services',
    phone: '0211234576',
    nrc: 'CW010',
    carWashName: 'Ultra Clean Services',
    location: 'Chainda, Lusaka',
    washingBays: 2,
  },
  { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver', name: 'James Mulenga', phone: '0978123456', nrc: 'DRV001' },
  { email: 'michael.chanda@driver.com', password: 'driver123', role: 'driver', name: 'Michael Chanda', phone: '0978123457', nrc: 'DRV002' },
  { email: 'robert.mwanza@driver.com', password: 'driver123', role: 'driver', name: 'Robert Mwanza', phone: '0978123458', nrc: 'DRV003' },
  { email: 'thomas.banda@driver.com', password: 'driver123', role: 'driver', name: 'Thomas Banda', phone: '0978123459', nrc: 'DRV004' },
  { email: 'andrew.phiri@driver.com', password: 'driver123', role: 'driver', name: 'Andrew Phiri', phone: '0978123460', nrc: 'DRV005' },
  { email: 'daniel.tembo@driver.com', password: 'driver123', role: 'driver', name: 'Daniel Tembo', phone: '0978123461', nrc: 'DRV006' },
  { email: 'mark.ngoma@driver.com', password: 'driver123', role: 'driver', name: 'Mark Ngoma', phone: '0978123462', nrc: 'DRV007' },
  { email: 'paul.mwila@driver.com', password: 'driver123', role: 'driver', name: 'Paul Mwila', phone: '0978123463', nrc: 'DRV008' },
  { email: 'steven.lungu@driver.com', password: 'driver123', role: 'driver', name: 'Steven Lungu', phone: '0978123464', nrc: 'DRV009' },
  { email: 'brian.mbewe@driver.com', password: 'driver123', role: 'driver', name: 'Brian Mbewe', phone: '0978123465', nrc: 'DRV010' },
];

const LUSAKA_COORDS = JSON.stringify({ lat: -15.3875, lng: 28.3228 });

async function passwordOk(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    return bcrypt.compare(plain, stored);
  }
  return stored === plain;
}

function buildInsertRow(account: SeedAccount, hashedPassword: string): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: account.name,
    email: account.email.toLowerCase().trim(),
    password: hashedPassword,
    phone: account.phone,
    nrc: account.nrc,
    role: account.role,
    is_active: true,
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
    location_coordinates: LUSAKA_COORDS,
  };

  if (account.role === 'admin') {
    row.admin_level = 'super_admin';
  }
  if (account.role === 'carwash') {
    row.car_wash_name = account.carWashName || account.name;
    row.location = account.location || 'Lusaka';
    row.washing_bays = account.washingBays ?? 2;
  }
  if (account.role === 'driver') {
    row.availability = true;
    row.address = 'Lusaka, Zambia';
    row.driver_rating = 4.5;
    row.completed_jobs = 0;
  }

  return row;
}

/**
 * Ensures seed test accounts exist and can log in (bcrypt password, active, approved).
 */
export async function ensureSeedUsers(): Promise<void> {
  // SECURITY: these are known-password test fixtures. Never seed them in
  // production — they would be live, guessable accounts.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_USERS !== 'true') {
    console.warn('[security] Skipping seed-user creation in production.');
    return;
  }

  let repaired = 0;
  let created = 0;

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

      const hashedPassword = await bcrypt.hash(account.password, 10);

      if (!user) {
        const { error: insertErr } = await supabase
          .from('users')
          .insert(buildInsertRow(account, hashedPassword));

        if (insertErr) {
          console.warn(`⚠️  Could not create ${email}:`, insertErr.message);
        } else {
          created++;
        }
        continue;
      }

      const ok = await passwordOk(account.password, user.password as string | null);
      const updates: Record<string, unknown> = {};

      if (!ok) {
        updates.password = hashedPassword;
      }
      if (user.is_active === false) {
        updates.is_active = true;
      }
      if (user.approval_status && user.approval_status !== 'approved') {
        updates.approval_status = 'approved';
      }
      if (user.role !== account.role) {
        updates.role = account.role;
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

  if (created > 0) {
    console.log(`✅ Created ${created} missing seed account(s)`);
  }
  if (repaired > 0) {
    console.log(`✅ Repaired ${repaired} seed account(s) for login`);
  }
}
