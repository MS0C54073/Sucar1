import { resolveCarWashCoordinates as resolveLusakaCarWashCoords } from '../utils/lusakaCoordinates';

/**
 * Mapping Service
 * 
 * Provides geospatial calculations and utilities for mapping features:
 * - Distance calculations (Haversine formula)
 * - Route optimization
 * - Proximity-based filtering
 * - Time and distance formatting
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  from: Coordinates;
  to: Coordinates;
  distance: number; // in kilometers
  estimatedTime: number; // in minutes
}

export interface RoutePoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  type: 'pickup' | 'wash' | 'dropoff';
  estimatedTime?: number;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  segments: RouteSegment[];
  totalDistance: number;
  totalTime: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lng - from.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate route segment with distance and estimated time
 */
export function calculateRouteSegment(
  from: Coordinates,
  to: Coordinates,
  averageSpeed: number = 50 // km/h
): RouteSegment {
  const distance = calculateDistance(from, to);
  const estimatedTime = (distance / averageSpeed) * 60; // Convert to minutes
  
  return {
    from,
    to,
    distance,
    estimatedTime: Math.round(estimatedTime),
  };
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) {
    return '—';
  }
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/** Parse API price fields (number, string, or missing) */
export function parsePrice(price: unknown): number {
  if (price == null || price === '') return 0;
  const n = typeof price === 'number' ? price : parseFloat(String(price));
  return Number.isFinite(n) ? n : 0;
}

export function formatKwacha(amount: unknown): string {
  return parsePrice(amount).toFixed(2);
}

/**
 * Format time for display
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Parse coordinates from various formats (JSON string, {lat,lng}, GeoJSON Point, [lng,lat])
 */
export function parseCoordinates(
  coords: string | Coordinates | number[] | Record<string, unknown> | null | undefined
): Coordinates | null {
  if (coords == null) return null;

  if (Array.isArray(coords) && coords.length >= 2) {
    const a = Number(coords[0]);
    const b = Number(coords[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    // GeoJSON order is [lng, lat]; detect by Zambia-ish ranges if ambiguous
    if (Math.abs(a) <= 90 && Math.abs(b) > 90) {
      return { lat: a, lng: b };
    }
    if (Math.abs(b) <= 90 && Math.abs(a) > 90) {
      return { lat: b, lng: a };
    }
    return { lng: a, lat: b };
  }

  if (typeof coords === 'object') {
    const o = coords as Record<string, unknown>;
    if (Array.isArray(o.coordinates) && o.coordinates.length >= 2) {
      return parseCoordinates(o.coordinates as number[]);
    }
    const lat = o.lat ?? o.latitude;
    const lng = o.lng ?? o.longitude ?? o.lon;
    if (lat != null && lng != null) {
      const latN = Number(lat);
      const lngN = Number(lng);
      if (Number.isFinite(latN) && Number.isFinite(lngN)) {
        return { lat: latN, lng: lngN };
      }
    }
    return null;
  }

  if (typeof coords === 'string') {
    const trimmed = coords.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parseCoordinates(parsed);
    } catch {
      const parts = trimmed.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }
    }
  }

  return null;
}

/** Resolve coordinates from a car wash, driver, or booking-like record */
export function getLocatableCoordinates(
  item: Record<string, unknown> | null | undefined
): Coordinates | null {
  if (!item) return null;
  if (
    item.role === 'carwash' ||
    item.carWashName ||
    (typeof item.location === 'string' && item.location.toLowerCase().includes('lusaka'))
  ) {
    const lusaka = resolveLusakaCarWashCoords(item);
    if (lusaka) return lusaka;
  }
  return (
    parseCoordinates(item.locationCoordinates as string | Coordinates) ??
    parseCoordinates(item.location_coordinates as string | Coordinates) ??
    parseCoordinates(item.coordinates as string | Coordinates) ??
    parseCoordinates(item.pickupCoordinates as string | Coordinates) ??
    parseCoordinates(item.pickup_coordinates as string | Coordinates) ??
    (item.latitude != null && item.longitude != null
      ? {
          lat: Number(item.latitude),
          lng: Number(item.longitude),
        }
      : null)
  );
}

/**
 * Find nearby items within a radius
 */
type Locatable = {
  coordinates?: Coordinates | string | null;
  locationCoordinates?: Coordinates | string | null;
};

function getItemCoordinates(item: Locatable): Coordinates | null {
  return getLocatableCoordinates(item as Record<string, unknown>);
}

export function findNearby<T extends Locatable>(
  items: T[],
  center: Coordinates,
  radiusKm: number = 10
): T[] {
  return items
    .map((item) => {
      const coords = getItemCoordinates(item);
      if (!coords) return null;
      
      const distance = calculateDistance(center, coords);
      return { item, distance };
    })
    .filter((result): result is { item: T; distance: number } => 
      result !== null && result.distance <= radiusKm
    )
    .sort((a, b) => a.distance - b.distance)
    .map((result) => result.item);
}

/**
 * Optimize driver route using nearest-neighbor algorithm
 */
export function optimizeDriverRoute(
  startLocation: Coordinates,
  bookings: Array<{
    id: string;
    pickupCoordinates: Coordinates | string | null;
    carWashCoordinates?: Coordinates | string | null;
    dropoffCoordinates?: Coordinates | string | null;
    carWashName?: string;
    vehicleInfo?: string;
  }>
): OptimizedRoute | null {
  if (bookings.length === 0) return null;
  
  const points: RoutePoint[] = [];
  const segments: RouteSegment[] = [];
  
  // Parse all coordinates
  const parsedBookings = bookings
    .map((booking) => {
      const pickup = parseCoordinates(booking.pickupCoordinates);
      const wash = parseCoordinates(booking.carWashCoordinates);
      const dropoff = parseCoordinates(booking.dropoffCoordinates || booking.pickupCoordinates);
      
      return { ...booking, pickup, wash, dropoff };
    })
    .filter((b) => b.pickup !== null);
  
  if (parsedBookings.length === 0) return null;
  
  let currentLocation = startLocation;
  const visited = new Set<string>();
  
  // Nearest-neighbor algorithm
  while (visited.size < parsedBookings.length) {
    let nearest: typeof parsedBookings[0] | null = null;
    let nearestDistance = Infinity;
    let nearestType: 'pickup' | 'wash' | 'dropoff' = 'pickup';
    let nearestCoords: Coordinates | null = null;
    
    for (const booking of parsedBookings) {
      if (visited.has(booking.id)) continue;
      
      // Check pickup distance
      if (booking.pickup) {
        const dist = calculateDistance(currentLocation, booking.pickup);
        if (dist < nearestDistance) {
          nearest = booking;
          nearestDistance = dist;
          nearestType = 'pickup';
          nearestCoords = booking.pickup;
        }
      }
      
      // Check wash distance (if already picked up)
      if (booking.wash && visited.has(`${booking.id}-pickup`)) {
        const dist = calculateDistance(currentLocation, booking.wash);
        if (dist < nearestDistance) {
          nearest = booking;
          nearestDistance = dist;
          nearestType = 'wash';
          nearestCoords = booking.wash;
        }
      }
    }
    
    if (!nearest || !nearestCoords) break;
    
    // Add segment
    const segment = calculateRouteSegment(currentLocation, nearestCoords);
    segments.push(segment);
    
    // Add point
    const pointName = 
      nearestType === 'pickup' 
        ? `Pickup: ${nearest.vehicleInfo || 'Vehicle'}`
        : nearestType === 'wash'
        ? `Wash: ${nearest.carWashName || 'Car Wash'}`
        : `Dropoff: ${nearest.vehicleInfo || 'Vehicle'}`;
    
    points.push({
      id: `${nearest.id}-${nearestType}`,
      name: pointName,
      coordinates: nearestCoords,
      type: nearestType,
      estimatedTime: segment.estimatedTime,
    });
    
    visited.add(nearestType === 'pickup' ? `${nearest.id}-pickup` : nearest.id);
    currentLocation = nearestCoords;
  }
  
  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
  const totalTime = segments.reduce((sum, s) => sum + s.estimatedTime, 0);
  
  return {
    points,
    segments,
    totalDistance,
    totalTime,
  };
}

/**
 * Estimate queue wait time based on position and average service time
 */
export function estimateQueueWaitTime(
  position: number,
  averageServiceTimeMinutes: number = 30
): number {
  // Simple estimation: position * average service time
  // Could be enhanced with actual queue data
  return position * averageServiceTimeMinutes;
}

export { resolveCarWashCoordinates } from '../utils/lusakaCoordinates';
