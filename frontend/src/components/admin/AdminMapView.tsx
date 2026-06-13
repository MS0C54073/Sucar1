import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useBookings } from '../../hooks/useBookings';
import MapView from '../MapView';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { getCurrentPosition } from '../../services/locationService';
import { getMapboxToken } from '../../config/mapbox';
import { calculateRouteSegment } from '../../services/mappingService';
import type { RouteSegment } from '../../services/mappingService';
import './AdminMapView.css';

interface CarWash {
  id: string;
  name?: string;
  carWashName?: string;
  location?: string;
  locationCoordinates?: unknown;
}

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number | string;
}

async function fetchMapboxRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  token: string
): Promise<{ segments: RouteSegment[]; distanceKm: number; durationMin: number }> {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?steps=false&geometries=geojson&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Directions request failed');
  const data = await res.json();

  if (!data.routes?.length) throw new Error('No route found');

  const route = data.routes[0];
  const coords: [number, number][] = route.geometry.coordinates;
  const distanceKm = route.distance / 1000;
  const durationMin = route.duration / 60;

  const segments: RouteSegment[] = coords.slice(0, -1).map((coord, i) => ({
    from: { lat: coord[1], lng: coord[0] },
    to: { lat: coords[i + 1][1], lng: coords[i + 1][0] },
    distance: 0,
    estimatedTime: 0,
  }));

  return { segments, distanceKm, durationMin };
}

const AdminMapView = () => {
  const [selectedCarWash, setSelectedCarWash] = useState<CarWash | null>(null);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useBookings({
    filters: { role: 'admin' },
    refetchInterval: 10000,
  });

  const { data: carWashes, isLoading: carWashesLoading } = useQuery({
    queryKey: ['admin-carwashes'],
    queryFn: async () => {
      try {
        const response = await api.get('/carwash/list');
        return response.data.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      try {
        const response = await api.get('/drivers/available');
        return response.data.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  // Fetch services for the selected car wash
  const { data: services, isLoading: servicesLoading } = useQuery<ServiceItem[]>({
    queryKey: ['carwash-services', selectedCarWash?.id],
    queryFn: async () => {
      const res = await api.get(`/carwash/services?carWashId=${selectedCarWash!.id}`);
      return res.data.data || [];
    },
    enabled: Boolean(selectedCarWash?.id),
    staleTime: 60000,
  });

  const handleCarWashClick = useCallback((cw: CarWash) => {
    setSelectedCarWash(cw);
    setRouteSegments([]);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCarWash(null);
    setRouteSegments([]);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const handleGetDirections = useCallback(async () => {
    if (!selectedCarWash) return;

    setRouteLoading(true);
    setRouteError(null);

    try {
      // Resolve car wash coordinates
      let toLat: number | null = null;
      let toLng: number | null = null;

      const lc = (selectedCarWash as Record<string, unknown>).locationCoordinates;
      if (lc && typeof lc === 'object') {
        const obj = lc as Record<string, unknown>;
        if (typeof obj.lat === 'number' && typeof obj.lng === 'number') {
          toLat = obj.lat;
          toLng = obj.lng;
        } else if (typeof obj.latitude === 'number' && typeof obj.longitude === 'number') {
          toLat = obj.latitude as number;
          toLng = obj.longitude as number;
        }
      } else if (typeof lc === 'string') {
        const parts = lc.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          toLat = parts[0];
          toLng = parts[1];
        }
      }

      if (toLat === null || toLng === null) {
        setRouteError('Car wash location coordinates are not available.');
        setRouteLoading(false);
        return;
      }

      // Get user location
      const position = await getCurrentPosition();
      const fromLat = position.coords.latitude;
      const fromLng = position.coords.longitude;

      const token = getMapboxToken();
      if (!token) {
        // Fallback: straight-line segment
        const seg = calculateRouteSegment(
          { lat: fromLat, lng: fromLng },
          { lat: toLat, lng: toLng }
        );
        setRouteSegments([seg]);
        setRouteInfo({ distanceKm: seg.distance, durationMin: seg.estimatedTime });
        return;
      }

      const { segments, distanceKm, durationMin } = await fetchMapboxRoute(
        fromLat, fromLng, toLat, toLng, token
      );
      setRouteSegments(segments);
      setRouteInfo({ distanceKm, durationMin });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get directions';
      setRouteError(msg);
    } finally {
      setRouteLoading(false);
    }
  }, [selectedCarWash]);

  const isLoading = bookingsLoading || carWashesLoading || driversLoading;

  const mapBookings = bookings?.filter((b: Record<string, unknown>) => b.pickupCoordinates) || [];

  if (isLoading) {
    return (
      <div className="admin-map-view">
        <div className="admin-map-header">
          <h2>Operational Map View</h2>
        </div>
        <div className="admin-map-loading">
          <LoadingSpinner size="lg" />
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  const cwName = selectedCarWash?.carWashName || selectedCarWash?.name || 'Car Wash';

  return (
    <div className="admin-map-view">
      <div className="admin-map-header">
        <h2>Operational Map View</h2>
        <div className="admin-map-stats">
          <div className="stat-item">
            <span className="stat-label">Bookings:</span>
            <span className="stat-value">{mapBookings.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Car Washes:</span>
            <span className="stat-value">{carWashes?.length || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Drivers:</span>
            <span className="stat-value">{drivers?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="admin-map-legend">
        <div className="legend-item">
          <span className="legend-icon">📋</span>
          <span className="legend-label">Bookings</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🧼</span>
          <span className="legend-label">Car Washes</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🚗</span>
          <span className="legend-label">Drivers</span>
        </div>
      </div>

      <div className="admin-map-container">
        <MapView
          bookings={mapBookings}
          carWashes={carWashes}
          showCarWashes
          showDrivers
          showNearbyServices
          showRoute={routeSegments.length > 0}
          routeSegments={routeSegments}
          onCarWashClick={handleCarWashClick}
          height="600px"
        />

        {selectedCarWash && (
          <div className="admin-cw-panel" role="dialog" aria-label={`${cwName} details`}>
            <div className="admin-cw-panel-head">
              <div>
                <h3>{cwName}</h3>
                {selectedCarWash.location && (
                  <p className="admin-cw-panel-loc">📍 {selectedCarWash.location}</p>
                )}
              </div>
              <button
                type="button"
                className="admin-cw-panel-close"
                onClick={handleClosePanel}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Services */}
            <div className="admin-cw-panel-section">
              <h4>Services</h4>
              {servicesLoading ? (
                <LoadingSpinner size="sm" />
              ) : !services || services.length === 0 ? (
                <p className="admin-cw-panel-empty">No services listed yet.</p>
              ) : (
                <ul className="admin-cw-panel-services">
                  {services.map((s) => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                      <span className="admin-cw-panel-price">
                        K{typeof s.price === 'number' ? s.price.toFixed(2) : s.price}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Route info */}
            {routeInfo && (
              <div className="admin-cw-panel-route-info">
                <span>🗺 {routeInfo.distanceKm.toFixed(1)} km</span>
                <span>⏱ {Math.round(routeInfo.durationMin)} min</span>
              </div>
            )}

            {routeError && (
              <p className="admin-cw-panel-error">⚠ {routeError}</p>
            )}

            {/* Actions */}
            <div className="admin-cw-panel-actions">
              {routeSegments.length === 0 ? (
                <button
                  type="button"
                  className="admin-cw-btn-directions"
                  onClick={handleGetDirections}
                  disabled={routeLoading}
                >
                  {routeLoading ? 'Getting directions…' : '🧭 Get Directions'}
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-cw-btn-clear"
                  onClick={() => { setRouteSegments([]); setRouteInfo(null); }}
                >
                  Clear Route
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMapView;
