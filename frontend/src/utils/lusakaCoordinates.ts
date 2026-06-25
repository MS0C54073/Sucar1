import type { Coordinates } from '../services/mappingService';
import { parseCoordinates } from '../services/mappingService';

export const LUSAKA_CENTER: Coordinates = { lat: -15.3875, lng: 28.3228 };

export const LUSAKA_BOUNDS = {
  minLat: -15.55,
  maxLat: -15.22,
  minLng: 28.15,
  maxLng: 28.55,
};

const LUSAKA_AREA_COORDS: Record<string, Coordinates> = {
  'cairo road': { lat: -15.4167, lng: 28.2833 },
  'great east': { lat: -15.395, lng: 28.35 },
  makeni: { lat: -15.42, lng: 28.31 },
  woodlands: { lat: -15.43, lng: 28.28 },
  kabulonga: { lat: -15.4, lng: 28.34 },
  roma: { lat: -15.37, lng: 28.3 },
  northmead: { lat: -15.38, lng: 28.29 },
  chilenje: { lat: -15.44, lng: 28.32 },
  libala: { lat: -15.36, lng: 28.33 },
  chainda: { lat: -15.45, lng: 28.3 },
};

export function resolveLusakaFromLocation(locationText?: string | null): Coordinates | null {
  if (!locationText) return null;
  const text = locationText.toLowerCase();
  for (const [keyword, coords] of Object.entries(LUSAKA_AREA_COORDS)) {
    if (text.includes(keyword)) return { ...coords };
  }
  if (text.includes('lusaka')) return { ...LUSAKA_CENTER };
  return null;
}

export function isInLusaka(coords: Coordinates): boolean {
  return (
    coords.lat >= LUSAKA_BOUNDS.minLat &&
    coords.lat <= LUSAKA_BOUNDS.maxLat &&
    coords.lng >= LUSAKA_BOUNDS.minLng &&
    coords.lng <= LUSAKA_BOUNDS.maxLng
  );
}

export function resolveCarWashCoordinates(
  carWash: Record<string, unknown> | null | undefined
): Coordinates | null {
  if (!carWash) return null;
  const stored = parseCoordinates(
    (carWash.locationCoordinates ?? carWash.location_coordinates) as string | Coordinates
  );
  if (stored && isInLusaka(stored)) return stored;
  return resolveLusakaFromLocation(carWash.location as string);
}

export function filterLusakaCarWashes<T extends Record<string, unknown>>(items: T[]): T[] {
  return items
    .map((item) => {
      const coords = resolveCarWashCoordinates(item);
      if (!coords) return null;
      return { ...item, locationCoordinates: coords };
    })
    .filter((x): x is T & { locationCoordinates: Coordinates } => x !== null);
}
