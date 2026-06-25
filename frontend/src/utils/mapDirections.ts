import { Coordinates } from '../services/mappingService';

/** Open Google Maps directions or place view */
export function buildDirectionsUrl(destination: Coordinates, origin?: Coordinates | null): string {
  const dest = `${destination.lat},${destination.lng}`;
  if (origin) {
    const orig = `${origin.lat},${origin.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
}

export function openDirections(destination: Coordinates, origin?: Coordinates | null): void {
  window.open(buildDirectionsUrl(destination, origin), '_blank', 'noopener,noreferrer');
}
