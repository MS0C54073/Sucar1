/**
 * Geocoding Service (Mobile)
 * Uses Mapbox Geocoding API for location search and autocomplete
 */

// Mapbox token (same as web version)
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXV6b3NhbGkiLCJhIjoiY21oc2J2d2tyMGg3ejJtc2N4dXg0NGo4eiJ9.p75SiHMh2nWAlbnFR8kyXQ';

export interface GeocodingResult {
  id: string;
  placeName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  context?: string[];
}

/**
 * Search for locations using Mapbox Geocoding API
 */
export async function searchLocations(
  query: string,
  proximity?: { lat: number; lng: number }
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Default to Lusaka, Zambia when no proximity is provided so results are
  // biased toward the intended city. Also restrict results to Zambia only
  // to avoid returning USA addresses (or other countries).
  const DEFAULT_LUSAKA = { lat: -15.3875, lng: 28.3228 };
  const useProximity = proximity ?? DEFAULT_LUSAKA;
  const proximityParam = `&proximity=${useProximity.lng},${useProximity.lat}`;
  const countryParam = `&country=zm`;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      `limit=5&` +
      `types=address,poi,place${proximityParam}${countryParam}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return (data.features || []).map((feature: any) => ({
      id: feature.id,
      placeName: feature.place_name,
      coordinates: {
        lng: feature.center[0],
        lat: feature.center[1],
      },
      address: feature.place_name,
      context: feature.context?.map((ctx: any) => ctx.text) || [],
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  coordinates: { lat: number; lng: number }
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?` +
      `access_token=${MAPBOX_TOKEN}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
