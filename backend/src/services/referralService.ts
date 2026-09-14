/**
 * SuCAR Referral / Affiliate service.
 *
 * Clients and drivers can opt in, share a unique code, and earn K25 per referred
 * friend who completes their first car wash booking.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { supabase } from '../config/supabase';

const REWARD_PER_COMPLETION = 25;
const MIN_CASHOUT = 100;

const MILESTONES = [
  { count: 5, label: 'Splasher', tier: 1 },
  { count: 15, label: 'Bubble Buddy', tier: 2 },
  { count: 30, label: 'Wash Partner', tier: 3 },
  { count: 50, label: 'SuCAR Ambassador', tier: 4 },
] as const;

let schemaReadyCache: boolean | null = null;
let applyAttempted = false;

function isMissingReferralTableError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err ? String((err as any).message) : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? String((err as any).code) : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('referral_affiliates') ||
    message.includes('Could not find the table')
  );
}

export async function isReferralSchemaReady(): Promise<boolean> {
  if (schemaReadyCache === true) return true;
  const { error } = await supabase.from('referral_affiliates').select('id').limit(0);
  if (!error) {
    schemaReadyCache = true;
    return true;
  }
  if (isMissingReferralTableError(error)) {
    schemaReadyCache = false;
    return false;
  }
  throw error;
}

export async function ensureReferralSchema(): Promise<boolean> {
  if (await isReferralSchemaReady()) return true;
  if (applyAttempted) return false;
  applyAttempted = true;

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.warn(
      '[referral-schema] referral tables missing. Set DATABASE_URL and restart, or run migrations/add-referrals.sql.'
    );
    return false;
  }

  const sql = readFileSync(join(__dirname, '../../migrations/add-referrals.sql'), 'utf8');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });
  try {
    console.log('[referral-schema] Applying referral migration…');
    await client.connect();
    await client.query(sql);
    schemaReadyCache = true;
    console.log('[referral-schema] Migration applied successfully.');
    return true;
  } catch (err) {
    console.error('[referral-schema] Migration failed:', err);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

function generateReferralCode(userId: string, name?: string): string {
  const slug = (name || 'SUCAR')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6)
    .padEnd(4, 'X');
  const suffix = userId.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `${slug}${suffix}`;
}

export async function getAffiliateByUserId(userId: string) {
  const { data, error } = await supabase
    .from('referral_affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && !isMissingReferralTableError(error)) throw error;
  return data;
}

export async function getAffiliateByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('referral_affiliates')
    .select('*')
    .eq('referral_code', normalized)
    .eq('is_active', true)
    .maybeSingle();
  if (error && !isMissingReferralTableError(error)) throw error;
  return data;
}

/** Opt a client or driver into the affiliate program. */
export async function joinAffiliateProgram(userId: string, name?: string) {
  if (!(await isReferralSchemaReady())) {
    throw new Error('Referral program is not available yet');
  }

  const existing = await getAffiliateByUserId(userId);
  if (existing) return existing;

  let code = generateReferralCode(userId, name);
  let attempts = 0;
  while (attempts < 5) {
    const clash = await getAffiliateByCode(code);
    if (!clash) break;
    code = generateReferralCode(userId, `${name || 'SUCAR'}${attempts}`);
    attempts++;
  }

  const { data, error } = await supabase
    .from('referral_affiliates')
    .insert({
      user_id: userId,
      referral_code: code,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Record a referral when a new user signs up with a code. */
export async function recordReferralSignup(referredUserId: string, referralCode?: string) {
  if (!referralCode || !(await isReferralSchemaReady())) return null;

  const affiliate = await getAffiliateByCode(referralCode);
  if (!affiliate || affiliate.user_id === referredUserId) return null;

  const { data: existing } = await supabase
    .from('referral_events')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .maybeSingle();
  if (existing) return null;

  const { data: event, error: eventError } = await supabase
    .from('referral_events')
    .insert({
      affiliate_id: affiliate.id,
      referrer_user_id: affiliate.user_id,
      referred_user_id: referredUserId,
      status: 'signed_up',
    })
    .select()
    .single();
  if (eventError) throw eventError;

  await supabase
    .from('referral_affiliates')
    .update({
      total_referrals: (affiliate.total_referrals || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id);

  return event;
}

/** Credit referrer when a referred user's first booking completes. */
export async function creditReferralOnBookingComplete(bookingId: string, clientId: string) {
  if (!(await isReferralSchemaReady())) return;

  const { data: event } = await supabase
    .from('referral_events')
    .select('*, referral_affiliates(*)')
    .eq('referred_user_id', clientId)
    .neq('status', 'completed_booking')
    .maybeSingle();

  if (!event) return;

  await applyReferralReward(event, bookingId);
}

async function applyReferralReward(
  event: { id: string; affiliate_id: string; referrer_user_id: string; referral_affiliates?: any },
  bookingId: string
) {
  const affiliate = event.referral_affiliates;
  if (!affiliate) return;

  const reward = REWARD_PER_COMPLETION;
  const now = new Date().toISOString();

  await supabase
    .from('referral_events')
    .update({
      status: 'completed_booking',
      first_booking_id: bookingId,
      reward_amount: reward,
      rewarded_at: now,
      updated_at: now,
    })
    .eq('id', event.id);

  await supabase
    .from('referral_affiliates')
    .update({
      successful_referrals: (affiliate.successful_referrals || 0) + 1,
      total_earned: Number(affiliate.total_earned || 0) + reward,
      available_balance: Number(affiliate.available_balance || 0) + reward,
      updated_at: now,
    })
    .eq('id', affiliate.id);
}

export async function getDashboardStats(userId: string) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    return {
      isAffiliate: false,
      milestones: MILESTONES.map((m) => ({ ...m, reached: false, current: 0 })),
      stats: {
        totalReferrals: 0,
        signedUp: 0,
        firstBooking: 0,
        completedBookings: 0,
        totalEarned: 0,
        availableBalance: 0,
      },
      referralLink: null,
      referralCode: null,
    };
  }

  const { data: events } = await supabase
    .from('referral_events')
    .select('status, created_at')
    .eq('referrer_user_id', userId);

  const list = events || [];
  const signedUp = list.filter((e) => e.status === 'signed_up').length;
  const firstBooking = list.filter((e) => e.status === 'first_booking').length;
  const completedBookings = list.filter((e) => e.status === 'completed_booking').length;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const referralLink = `${frontendUrl}/register?ref=${affiliate.referral_code}`;

  const successful = affiliate.successful_referrals || 0;
  const milestones = MILESTONES.map((m) => ({
    ...m,
    reached: successful >= m.count,
    current: successful,
  }));

  // Referrals over time (last 30 days, grouped by day)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const chartData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = list.filter((e) => e.created_at?.slice(0, 10) === key).length;
    chartData.push({ date: key, count });
  }

  return {
    isAffiliate: true,
    referralCode: affiliate.referral_code,
    referralLink,
    milestones,
    stats: {
      totalReferrals: affiliate.total_referrals || 0,
      signedUp,
      firstBooking,
      completedBookings,
      totalEarned: Number(affiliate.total_earned || 0),
      availableBalance: Number(affiliate.available_balance || 0),
    },
    chartData,
    minCashout: MIN_CASHOUT,
    rewardPerReferral: REWARD_PER_COMPLETION,
  };
}

export async function getLeaderboard(limit = 10) {
  if (!(await isReferralSchemaReady())) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: events } = await supabase
    .from('referral_events')
    .select('referrer_user_id, status, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'completed_booking');

  const counts: Record<string, number> = {};
  for (const e of events || []) {
    counts[e.referrer_user_id] = (counts[e.referrer_user_id] || 0) + 1;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const userIds = sorted.map(([id]) => id);
  const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
  const nameMap = Object.fromEntries((users || []).map((u) => [u.id, u.name]));

  return sorted.map(([userId, count], index) => ({
    rank: index + 1,
    userId,
    name: nameMap[userId] || 'SuCAR Member',
    initials: (nameMap[userId] || 'SM')
      .split(' ')
      .map((w: string) => w[0])
      .join('. ')
      .slice(0, 5),
    completedReferrals: count,
  }));
}

export async function requestCashout(userId: string, amount?: number) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) throw new Error('You are not enrolled in the referral program');

  const balance = Number(affiliate.available_balance || 0);
  const cashoutAmount = amount ?? balance;

  if (cashoutAmount < MIN_CASHOUT) {
    throw new Error(`Minimum cashout is K${MIN_CASHOUT}`);
  }
  if (cashoutAmount > balance) {
    throw new Error('Insufficient balance');
  }

  const { data: cashout, error } = await supabase
    .from('referral_cashouts')
    .insert({
      affiliate_id: affiliate.id,
      user_id: userId,
      amount: cashoutAmount,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from('referral_affiliates')
    .update({
      available_balance: balance - cashoutAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id);

  return cashout;
}
