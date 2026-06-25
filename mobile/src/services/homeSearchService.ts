import { CarWashListItem } from '../components/ui/CarWashCard';
import { searchLocations, GeocodingResult } from './geocodingService';
import { Coordinates } from './locationService';

export type SearchSuggestionType = 'carwash' | 'place';

export interface SearchSuggestion {
  id: string;
  type: SearchSuggestionType;
  title: string;
  subtitle?: string;
  /** Set when type is carwash */
  carWash?: CarWashListItem;
  /** Set when type is place */
  coordinates?: Coordinates;
}

function matchCarWashes(query: string, carWashes: CarWashListItem[], limit = 5): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return carWashes
    .filter((w) => {
      const name = (w.carWashName || w.name || '').toLowerCase();
      const loc = (w.location || '').toLowerCase();
      const svcText = (w.services || [])
        .map((s) => (s.name || '').toLowerCase())
        .join(' ');
      return name.includes(q) || loc.includes(q) || svcText.includes(q);
    })
    .slice(0, limit)
    .map((w) => ({
      id: `wash-${w.id}`,
      type: 'carwash' as const,
      title: w.carWashName || w.name || 'Car wash',
      subtitle: w.location || 'Car wash',
      carWash: w,
    }));
}

function placeToSuggestion(result: GeocodingResult): SearchSuggestion {
  return {
    id: `place-${result.id}`,
    type: 'place',
    title: result.placeName.split(',')[0]?.trim() || result.placeName,
    subtitle: result.placeName,
    coordinates: result.coordinates,
  };
}

/**
 * Home-screen search: car wash matches (instant) + Mapbox place predictions (async).
 */
export async function fetchHomeSearchSuggestions(
  query: string,
  carWashes: CarWashListItem[],
  proximity?: Coordinates
): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const washMatches = matchCarWashes(trimmed, carWashes, 5);
  if (trimmed.length < 2) return washMatches;

  const places = await searchLocations(trimmed, proximity);
  const placeSuggestions = places.slice(0, 4).map(placeToSuggestion);

  // De-dupe: skip places whose title already matches a wash name
  const washTitles = new Set(washMatches.map((s) => s.title.toLowerCase()));
  const filteredPlaces = placeSuggestions.filter(
    (p) => !washTitles.has(p.title.toLowerCase())
  );

  return [...washMatches, ...filteredPlaces];
}

/** Highlight helper — returns whether query matches title for UI bolding */
export function suggestionMatchesQuery(title: string, query: string): boolean {
  return title.toLowerCase().includes(query.trim().toLowerCase());
}
