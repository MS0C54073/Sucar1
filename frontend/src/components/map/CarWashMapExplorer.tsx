import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Feature, LineString } from 'geojson';
import MapView from '../MapView';
import CarWashDetailPanel from './CarWashDetailPanel';
import CarWashSearchAutocomplete from './CarWashSearchAutocomplete';
import LoadingSpinner from '../LoadingSpinner';
import useMapboxDirections from '../../hooks/useMapboxDirections';
import { Coordinates, RouteSegment } from '../../services/mappingService';
import { LUSAKA_CENTER } from '../../utils/lusakaCoordinates';
import { resolveCarWashCoordinates } from '../../utils/lusakaCoordinates';
import { filterLusakaCarWashes } from '../../utils/lusakaCoordinates';
import { openDirections } from '../../utils/mapDirections';
import './CarWashMapExplorer.css';

export interface ExplorerCarWash {
  id: string;
  name: string;
  carWashName?: string;
  location?: string;
  coords: Coordinates;
  services?: { id: string; name: string; price: number | string }[];
}

interface CarWashMapExplorerProps {
  rawCarWashes?: Record<string, unknown>[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  userLocation?: Coordinates | null;
  selectedWash: ExplorerCarWash | null;
  onSelectWash: (wash: ExplorerCarWash | null) => void;
  onBook?: (washId: string, serviceId?: string) => void;
  height?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Shared with home hero when provided */
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export function buildExplorerWashes(raw: Record<string, unknown>[]): ExplorerCarWash[] {
  return toExplorerRows(raw);
}

function toExplorerRows(raw: Record<string, unknown>[]): ExplorerCarWash[] {
  return filterLusakaCarWashes(raw)
    .map((cw) => {
      const coords = resolveCarWashCoordinates(cw);
      if (!coords) return null;
      const name = (cw.carWashName as string) || (cw.name as string) || 'Car wash';
      const id = String((cw.id as string) || (cw._id as string) || '');
      if (!id) return null;
      return {
        id,
        name,
        carWashName: cw.carWashName as string | undefined,
        location: cw.location as string | undefined,
        coords,
        services: (cw.services as ExplorerCarWash['services']) || [],
      };
    })
    .filter((x): x is ExplorerCarWash => x !== null);
}

function matchesWashQuery(wash: ExplorerCarWash, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const name = wash.name.toLowerCase();
  const loc = (wash.location || '').toLowerCase();
  const alt = (wash.carWashName || '').toLowerCase();
  const services = (wash.services || []).map((s) => s.name.toLowerCase()).join(' ');
  const haystack = `${name} ${alt} ${loc} ${services}`;
  return terms.every((term) => haystack.includes(term));
}

const CarWashMapExplorer = ({
  rawCarWashes = [],
  isLoading = false,
  error,
  onRetry,
  userLocation,
  selectedWash,
  onSelectWash,
  onBook,
  height = 'min(72vh, 680px)',
  className = '',
  searchPlaceholder = 'Search car washes in Lusaka…',
  emptyMessage = 'No car washes match your search.',
  searchQuery: searchQueryProp,
  onSearchQueryChange,
}: CarWashMapExplorerProps) => {
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = searchQueryProp ?? internalSearch;
  const setSearchQuery = onSearchQueryChange ?? setInternalSearch;
  const [mapCenter, setMapCenter] = useState<Coordinates | undefined>();
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<LineString> | null>(null);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const { getDirections } = useMapboxDirections();

  const allWashes = useMemo(() => toExplorerRows(rawCarWashes), [rawCarWashes]);

  const filteredWashes = useMemo(() => {
    if (!searchQuery.trim()) return allWashes;
    return allWashes.filter((w) => matchesWashQuery(w, searchQuery));
  }, [allWashes, searchQuery]);

  const handleSearchSelect = useCallback(
    (wash: ExplorerCarWash) => {
      setSearchQuery(wash.name);
      onSelectWash(wash);
      setMapCenter(wash.coords);
    },
    [onSelectWash, setSearchQuery]
  );

  useEffect(() => {
    if (selectedWash?.coords) {
      setMapCenter(selectedWash.coords);
    }
  }, [selectedWash?.id, selectedWash?.coords]);

  const loadRouteToWash = useCallback(
    async (wash: ExplorerCarWash) => {
      const destination = wash.coords;
      const origin = userLocation ?? LUSAKA_CENTER;

      setRouteLoading(true);
      setRouteError(null);

      try {
        const data = await getDirections(origin.lng, origin.lat, destination.lng, destination.lat, 'driving');
        if (!data?.geometry?.geometry) {
          setRouteError('Could not load route. Try again or open in Maps.');
          setRouteGeoJson(null);
          setRouteSegments([]);
          return;
        }

        const line = data.geometry.geometry as LineString;
        setRouteGeoJson({
          type: 'Feature',
          geometry: line,
          properties: {},
        });
        setRouteSegments([
          {
            from: origin,
            to: destination,
            distance: data.distance / 1000,
            estimatedTime: data.duration / 60,
          },
        ]);
        setMapCenter(destination);
      } catch {
        setRouteError('Route unavailable');
        setRouteGeoJson(null);
        setRouteSegments([]);
      } finally {
        setRouteLoading(false);
      }
    },
    [getDirections, userLocation]
  );

  useEffect(() => {
    if (!selectedWash) {
      setRouteGeoJson(null);
      setRouteSegments([]);
      setRouteError(null);
    }
  }, [selectedWash?.id]);

  const handleMapClick = useCallback(
    (cw: { id: string }) => {
      const w = allWashes.find((x) => String(x.id) === String(cw.id));
      if (w) {
        onSelectWash(w);
        setMapCenter(w.coords);
      }
    },
    [allWashes, onSelectWash]
  );

  const handleRoute = useCallback(
    (wash: ExplorerCarWash) => {
      void loadRouteToWash(wash);
      openDirections(wash.coords, userLocation);
    },
    [loadRouteToWash, userLocation]
  );

  const mapZoom = selectedWash ? 14 : 12;
  const showRoute = routeSegments.length > 0 && Boolean(routeGeoJson);

  return (
    <div className={`car-wash-map-explorer ${className}`.trim()} style={{ ['--map-explorer-height' as string]: height }}>
      <div className="car-wash-map-explorer__map-wrap">
        {isLoading ? (
          <div className="car-wash-map-explorer__state">
            <LoadingSpinner size="lg" />
            <p>Loading map…</p>
          </div>
        ) : error ? (
          <div className="car-wash-map-explorer__state">
            <p>Could not load car washes.</p>
            {onRetry && (
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        ) : allWashes.length === 0 ? (
          <div className="car-wash-map-explorer__state">
            <p>No Lusaka car washes on the map yet.</p>
          </div>
        ) : (
          <MapView
            carWashes={filteredWashes.map((w) => ({
              id: w.id,
              name: w.name,
              carWashName: w.carWashName || w.name,
              location: w.location,
              locationCoordinates: w.coords,
              services: w.services,
            }))}
            showCarWashes={filteredWashes.length > 0}
            pinLocation={userLocation}
            activeBookingId={selectedWash?.id}
            onCarWashClick={handleMapClick}
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            autoFitMarkers={!selectedWash && !mapCenter}
            showRoute={showRoute}
            routeSegments={routeSegments}
            routeGeoJson={routeGeoJson}
          />
        )}

        <div className="car-wash-map-explorer__overlays" aria-hidden={false}>
          <CarWashSearchAutocomplete
            variant="map"
            washes={allWashes}
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleSearchSelect}
            isLoading={isLoading}
            placeholder={searchPlaceholder}
            emptyMessage={emptyMessage}
          />

          {!isLoading && !error && allWashes.length > 0 && (
            <div className="map-float-badge" aria-live="polite">
              {filteredWashes.length} location{filteredWashes.length !== 1 ? 's' : ''} in Lusaka
            </div>
          )}

          {filteredWashes.length === 0 && searchQuery && !isLoading && (
            <div className="map-float-hint">{emptyMessage}</div>
          )}

          {routeLoading && <div className="map-float-route-status">Loading route…</div>}
          {routeError && <div className="map-float-route-status map-float-route-status--error">{routeError}</div>}

          {selectedWash && (
            <div className="map-float-panel">
              <CarWashDetailPanel
                carWash={selectedWash}
                userLocation={userLocation}
                onClose={() => onSelectWash(null)}
                onBook={onBook || (() => {})}
                onRoute={() => handleRoute(selectedWash)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarWashMapExplorer;
