/**
 * Reviews & Ratings service
 *
 * Clients leave one review per booking once the wash is finished. A review can
 * rate the car wash and (for pickup & delivery jobs) the driver. Aggregate
 * scores are recomputed on every write and stored on the users table so the
 * recommendation engine and listings can read them cheaply.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { supabase } from '../config/supabase';
import { toCamelCase } from './db-service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../shared/errors/AppError';

// Booking statuses that mean the service is finished and can be reviewed.
const REVIEWABLE_STATUSES = [
  'wash_completed',
  'delivered_to_client',
  'delivered',
  'completed',
];

let schemaReadyCache: boolean | null = null;
let applyAttempted = false;

function isMissingReviewsTableError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : String(err);
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes("'public.reviews'") ||
    message.includes('reviews')
  );
}

export async function isReviewsSchemaReady(): Promise<boolean> {
  if (schemaReadyCache === true) return true;
  const { error } = await supabase.from('reviews').select('id').limit(0);
  if (!error) {
    schemaReadyCache = true;
    return true;
  }
  if (isMissingReviewsTableError(error)) {
    schemaReadyCache = false;
    return false;
  }
  throw error;
}

/** Apply the reviews migration when DATABASE_URL (or SUPABASE_DB_URL) is set. */
export async function ensureReviewsSchema(): Promise<boolean> {
  if (await isReviewsSchemaReady()) return true;
  if (applyAttempted) return false;
  applyAttempted = true;

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.warn(
      '[reviews-schema] reviews table missing. Set DATABASE_URL in backend/.env and restart, or run migrations/add-reviews.sql in the Supabase SQL editor.'
    );
    return false;
  }

  const sqlPath = join(__dirname, '../../migrations/add-reviews.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('[reviews-schema] Applying reviews migration…');
    await client.connect();
    await client.query(sql);
    schemaReadyCache = true;
    console.log('[reviews-schema] Migration applied successfully.');
    return true;
  } catch (err) {
    console.error('[reviews-schema] Migration failed:', err);
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

/** Recompute and persist a user's aggregate rating from the reviews table. */
async function recomputeUserRating(
  userId: string,
  kind: 'carwash' | 'driver'
): Promise<void> {
  const column = kind === 'carwash' ? 'car_wash_rating' : 'driver_rating';
  const idColumn = kind === 'carwash' ? 'car_wash_id' : 'driver_id';

  const { data, error } = await supabase
    .from('reviews')
    .select(column)
    .eq(idColumn, userId)
    .not(column, 'is', null);

  if (error) {
    console.error('[reviews] Failed to load ratings for aggregate:', error);
    return;
  }

  const values = ((data as any[]) || [])
    .map((row: any) => Number(row[column]))
    .filter((n: number) => Number.isFinite(n) && n > 0);

  const count = values.length;
  const average =
    count > 0
      ? Math.round((values.reduce((sum: number, n: number) => sum + n, 0) / count) * 100) / 100
      : 0;

  const update =
    kind === 'carwash'
      ? { rating: average, rating_count: count }
      : { driver_rating: average, driver_rating_count: count };

  const { error: updateError } = await supabase.from('users').update(update).eq('id', userId);
  if (updateError) {
    console.error('[reviews] Failed to persist aggregate rating:', updateError);
  }
}

interface CreateReviewInput {
  bookingId: string;
  clientId: string;
  carWashRating?: number;
  driverRating?: number;
  comment?: string;
}

function validateStars(value: number | undefined, label: string): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new BadRequestError(`${label} must be a whole number between 1 and 5.`);
  }
  return n;
}

export async function createReview(input: CreateReviewInput) {
  const ready = await isReviewsSchemaReady();
  if (!ready) {
    throw new BadRequestError(
      'Reviews are not available yet — the reviews table has not been created. Run migrations/add-reviews.sql.'
    );
  }

  const carWashStars = validateStars(input.carWashRating, 'Car wash rating');
  const driverStars = validateStars(input.driverRating, 'Driver rating');

  if (carWashStars === null && driverStars === null) {
    throw new BadRequestError('Provide at least a car wash or driver rating.');
  }

  // Load the booking and verify ownership + completion.
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, client_id, car_wash_id, driver_id, status')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!booking) throw new NotFoundError('Booking not found.');
  if (booking.client_id !== input.clientId) {
    throw new ForbiddenError('You can only review your own bookings.');
  }
  if (!REVIEWABLE_STATUSES.includes(booking.status)) {
    throw new BadRequestError('You can only review a booking once the wash is complete.');
  }

  const payload = {
    booking_id: input.bookingId,
    client_id: input.clientId,
    car_wash_id: booking.car_wash_id || null,
    driver_id: booking.driver_id || null,
    car_wash_rating: carWashStars,
    driver_rating: driverStars,
    comment: input.comment?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: review, error: upsertError } = await supabase
    .from('reviews')
    .upsert(payload, { onConflict: 'booking_id,client_id' })
    .select('*')
    .single();

  if (upsertError) throw upsertError;

  if (booking.car_wash_id && carWashStars !== null) {
    await recomputeUserRating(booking.car_wash_id, 'carwash');
  }
  if (booking.driver_id && driverStars !== null) {
    await recomputeUserRating(booking.driver_id, 'driver');
  }

  return toCamelCase(review);
}

export async function getBookingReview(bookingId: string, clientId: string) {
  if (!(await isReviewsSchemaReady())) return null;
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  return data ? toCamelCase(data) : null;
}

interface ReviewSummary {
  rating: number;
  count: number;
  reviews: any[];
}

export async function getReviewsForUser(
  userId: string,
  kind: 'carwash' | 'driver',
  limit = 20
): Promise<ReviewSummary> {
  if (!(await isReviewsSchemaReady())) {
    return { rating: 0, count: 0, reviews: [] };
  }

  const column = kind === 'carwash' ? 'car_wash_rating' : 'driver_rating';
  const idColumn = kind === 'carwash' ? 'car_wash_id' : 'driver_id';

  const { data, error } = await supabase
    .from('reviews')
    .select('id, booking_id, comment, created_at, ' + column)
    .eq(idColumn, userId)
    .not(column, 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data as any[]) || [];
  const values = rows
    .map((r: any) => Number(r[column]))
    .filter((n: number) => Number.isFinite(n));
  const count = values.length;
  const rating =
    count > 0
      ? Math.round((values.reduce((s: number, n: number) => s + n, 0) / count) * 100) / 100
      : 0;

  return { rating, count, reviews: toCamelCase(rows) };
}
