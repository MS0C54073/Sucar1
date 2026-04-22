/**
 * Mapbox public access token for Geocoding API and Mapbox GL (maps).
 *
 * Set `EXPO_PUBLIC_MAPBOX_TOKEN` in `.env` (Expo inlines at build time).
 * `MAPBOX_ACCESS_TOKEN` is also read for tooling compatibility.
 *
 * In __DEV__, a fallback keeps maps/geocoding working when env is not set;
 * replace with your own token in production and restrict it in Mapbox dashboard.
 */
const DEV_PUBLIC_FALLBACK =
  'pk.eyJ1IjoibXV6b3NhbGkiLCJhIjoiY21oc2J2d2tyMGg3ejJtc2N4dXg0NGo4eiJ9.p75SiHMh2nWAlbnFR8kyXQ';

export function getMapboxAccessToken(): string {
  const fromEnv =
    (typeof process !== 'undefined' &&
      (process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN)) ||
    '';
  const trimmed = fromEnv.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  if (__DEV__) {
    return DEV_PUBLIC_FALLBACK;
  }
  return '';
}
