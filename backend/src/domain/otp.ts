/**
 * One-time-code checks for phone sign-in.
 *
 * SECURITY: the per-IP rate limiter alone does not stop an attacker spreading
 * guesses for one phone across many IPs; a 6-digit code would fall within its
 * 10-minute lifetime. Each stored code therefore allows MAX_OTP_ATTEMPTS
 * guesses in total, after which it is burned and a new one must be requested.
 */
import { timingSafeEqual } from 'crypto';

export const MAX_OTP_ATTEMPTS = 5;

export interface StoredOtp {
  code: string;
  expiresAt: Date;
  attempts: number;
}

/** Checks before a guess is counted: is this code still usable at all? */
export function otpPrecheck(stored: StoredOtp, now: Date = new Date()): 'ok' | 'expired' | 'locked' {
  if (stored.expiresAt <= now) return 'expired';
  if (stored.attempts >= MAX_OTP_ATTEMPTS) return 'locked';
  return 'ok';
}

/** Constant-time comparison so response timing does not leak matching digits. */
export function otpMatches(storedCode: string, submitted: string): boolean {
  const a = Buffer.from(String(storedCode));
  const b = Buffer.from(String(submitted ?? ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The fixed development code accepted when Twilio Verify is not configured.
 * Never accepted in production: there the stored, attempt-limited code is used.
 */
export const DEV_MOCK_OTP = '123456';

export function isDevMockOtpAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== 'production';
}
