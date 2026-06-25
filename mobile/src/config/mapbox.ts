/**
 * Mapbox public access token for Geocoding API and Mapbox GL (maps).
 *
 * Resolution order:
 * 1. Runtime token set by MapboxProvider / useMapboxToken (from backend API)
 * 2. EXPO_PUBLIC_MAPBOX_TOKEN / MAPBOX_ACCESS_TOKEN in mobile/.env
 *
 * There is intentionally no hardcoded fallback — the backend serves the token at
 * GET /api/config/mapbox-token (MAPBOX_TOKEN in backend/.env).
 */

let runtimeToken: string | null = null;

export const MAPBOX_TOKEN_CACHE_KEY = 'mapbox_token';
export const MAPBOX_TOKEN_EXPIRY_KEY = 'mapbox_token_expiry';

export function setMapboxRuntimeToken(token: string) {
  runtimeToken = token;
}

export function validateMapboxToken(token: string): boolean {
  return Boolean(token && token.startsWith('pk.') && token.length > 20);
}

export function getMapboxAccessToken(): string {
  if (runtimeToken && validateMapboxToken(runtimeToken)) {
    return runtimeToken;
  }

  const fromEnv =
    (typeof process !== 'undefined' &&
      (process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN)) ||
    '';
  const trimmed = fromEnv.trim();
  if (trimmed.length > 0 && validateMapboxToken(trimmed)) {
    return trimmed;
  }

  return '';
}
