/**
 * Mapbox public access token for Geocoding API and Mapbox GL (maps).
 *
 * Set `EXPO_PUBLIC_MAPBOX_TOKEN` in `.env` (Expo inlines at build time).
 * `MAPBOX_ACCESS_TOKEN` is also read for tooling compatibility.
 *
 * There is intentionally no hardcoded fallback — provide a token via env and
 * restrict it in the Mapbox dashboard.
 */
export function getMapboxAccessToken(): string {
  const fromEnv =
    (typeof process !== 'undefined' &&
      (process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN)) ||
    '';
  const trimmed = fromEnv.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn('Mapbox token missing. Set EXPO_PUBLIC_MAPBOX_TOKEN in mobile/.env.');
  }
  return '';
}
