/**
 * Mapbox Configuration
 *
 * Token resolution order:
 * 1. Runtime token set by MapboxProvider / useMapboxToken
 * 2. localStorage cache from edge function
 * 3. VITE_MAPBOX_TOKEN in .env
 *
 * There is intentionally no hardcoded fallback — provide a token via env or the
 * get-mapbox-token edge function.
 */

export const MAPBOX_TOKEN_CACHE_KEY = 'mapbox_token';
export const MAPBOX_TOKEN_EXPIRY_KEY = 'mapbox_token_expiry';

let runtimeToken: string | null = null;

export function setMapboxRuntimeToken(token: string) {
  runtimeToken = token;
}

export function validateMapboxToken(token: string): boolean {
  return Boolean(token && token.startsWith('pk.') && token.length > 20);
}

function readCachedToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const cached = localStorage.getItem(MAPBOX_TOKEN_CACHE_KEY);
  const expiry = localStorage.getItem(MAPBOX_TOKEN_EXPIRY_KEY);
  if (!cached || !expiry) return null;
  if (new Date(expiry).getTime() <= Date.now()) return null;
  return validateMapboxToken(cached) ? cached : null;
}

/** Synchronous token for geocoding / directions (after provider has loaded). */
export function getMapboxToken(): string {
  if (runtimeToken && validateMapboxToken(runtimeToken)) {
    return runtimeToken;
  }

  const cached = readCachedToken();
  if (cached) {
    runtimeToken = cached;
    return cached;
  }

  const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  if (envToken && validateMapboxToken(envToken)) {
    runtimeToken = envToken;
    return envToken;
  }

  console.error(
    'Mapbox token missing. Add VITE_MAPBOX_TOKEN to frontend/.env or deploy the get-mapbox-token edge function.'
  );
  return '';
}
// Mapbox style configuration
export const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const;

// Default map center (Lusaka, Zambia) — Mapbox order: [lng, lat]
export const LUSAKA_LAT = -15.3875;
export const LUSAKA_LNG = 28.3228;
export const DEFAULT_CENTER: [number, number] = [LUSAKA_LNG, LUSAKA_LAT];
export const DEFAULT_ZOOM = 12;

export default {
  getToken: getMapboxToken,
  validateToken: validateMapboxToken,
  styles: MAPBOX_STYLES,
  defaultCenter: DEFAULT_CENTER,
  defaultZoom: DEFAULT_ZOOM,
};
