import dotenv from 'dotenv';

// Ensure env is loaded even if this module is imported before index.ts runs dotenv.config()
dotenv.config();

const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-change-me';
const MIN_SECRET_LENGTH = 16;

let cachedSecret: string | null = null;

/**
 * Resolve the JWT signing secret.
 * - Production: throws if JWT_SECRET is missing or too weak (fail-fast).
 * - Development: falls back to a clearly-insecure dev secret with a loud warning.
 */
export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (secret && secret.length >= MIN_SECRET_LENGTH) {
    cachedSecret = secret;
    return cachedSecret;
  }

  if (isProduction) {
    throw new Error(
      `JWT_SECRET is missing or too short (must be at least ${MIN_SECRET_LENGTH} characters). ` +
        'Set a strong, random JWT_SECRET in the environment before starting the server in production.'
    );
  }

  console.warn(
    '\u26A0\uFE0F  [security] JWT_SECRET is not set (or too short). Using an INSECURE development fallback. ' +
      'Never run production without a strong JWT_SECRET.'
  );
  cachedSecret = DEV_FALLBACK_SECRET;
  return cachedSecret;
}

/**
 * Validate auth-critical configuration at boot. Call this during startup so the
 * process fails fast in production instead of issuing forgeable tokens.
 */
export function assertAuthConfig(): void {
  // Triggers the production guard above if misconfigured.
  getJwtSecret();
}
