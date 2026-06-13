/**
 * Lusaka, Zambia — approximate coordinates for car wash areas (map markers).
 */
export const LUSAKA_CENTER = { lat: -15.3875, lng: 28.3228 };

export const LUSAKA_BOUNDS = {
  minLat: -15.55,
  maxLat: -15.22,
  minLng: 28.15,
  maxLng: 28.55,
};

/** Keyword in location string → { lat, lng } */
export const LUSAKA_AREA_COORDS: Record<string, { lat: number; lng: number }> = {
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
  kamwala: { lat: -15.42, lng: 28.28 },
  kabwata: { lat: -15.41, lng: 28.29 },
  rhodespark: { lat: -15.4, lng: 28.31 },
  longacres: { lat: -15.4, lng: 28.32 },
};

export type Coords = { lat: number; lng: number };

export function parseStoredCoordinates(raw: unknown): Coords | null {
  if (!raw) return null;
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    const lat = o.lat ?? o.latitude;
    const lng = o.lng ?? o.longitude ?? o.lon;
    if (lat != null && lng != null) {
      const latN = Number(lat);
      const lngN = Number(lng);
      if (Number.isFinite(latN) && Number.isFinite(lngN)) return { lat: latN, lng: lngN };
    }
    if (Array.isArray(o.coordinates) && o.coordinates.length >= 2) {
      const a = Number(o.coordinates[0]);
      const b = Number(o.coordinates[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) return { lng: a, lat: b };
    }
  }
  if (typeof raw === 'string') {
    try {
      return parseStoredCoordinates(JSON.parse(raw));
    } catch {
      const parts = raw.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  }
  return null;
}

export function resolveLusakaCoordinates(locationText?: string | null): Coords | null {
  if (!locationText) return null;
  const text = locationText.toLowerCase();
  if (!text.includes('lusaka') && !Object.keys(LUSAKA_AREA_COORDS).some((k) => text.includes(k))) {
    return null;
  }
  for (const [keyword, coords] of Object.entries(LUSAKA_AREA_COORDS)) {
    if (text.includes(keyword)) return { ...coords };
  }
  if (text.includes('lusaka')) return { ...LUSAKA_CENTER };
  return null;
}

export function isInLusakaBounds(coords: Coords): boolean {
  return (
    coords.lat >= LUSAKA_BOUNDS.minLat &&
    coords.lat <= LUSAKA_BOUNDS.maxLat &&
    coords.lng >= LUSAKA_BOUNDS.minLng &&
    coords.lng <= LUSAKA_BOUNDS.maxLng
  );
}

export function resolveCarWashCoordinates(carWash: {
  location?: string | null;
  locationCoordinates?: unknown;
  location_coordinates?: unknown;
}): Coords | null {
  const stored =
    parseStoredCoordinates(carWash.locationCoordinates) ??
    parseStoredCoordinates(carWash.location_coordinates);
  if (stored && isInLusakaBounds(stored)) return stored;
  return resolveLusakaCoordinates(carWash.location);
}
