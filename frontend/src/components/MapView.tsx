/**
 * MapView Component
 * 
 * Core interactive map component using Mapbox GL JS
 * Supports:
 * - Multiple marker types (bookings, car washes, drivers)
 * - Route visualization
 * - Real-time location updates
 * - Role-based filtering
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import type { Feature, LineString } from 'geojson';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getCurrentPosition, Coordinates } from '../services/locationService';
import { formatDistance } from '../services/mappingService';
import { DEFAULT_CENTER, DEFAULT_ZOOM, getMapboxToken } from '../config/mapbox';
import { parseCoordinates, calculateDistance, getLocatableCoordinates } from '../services/mappingService';
import { filterLusakaCarWashes } from '../utils/lusakaCoordinates';
import RouteVisualization from './mapping/RouteVisualization';
import { setMapRouteLine, clearMapRouteLine } from '../utils/mapRouteLayer';
import {
  isMapStyleReady,
  runWhenMapStyleReady,
  safeGetLayer,
  safeGetSource,
  safeRemoveLayer,
  safeRemoveSource,
} from '../utils/mapLayerSafety';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './MapView.css';

const CARWASH_SOURCE_ID = 'sucar-carwashes-source';
const CARWASH_HIT_LAYER_ID = 'sucar-carwashes-hit';

interface Booking {
  id: string;
  status: string;
  pickupLocation: string;
  pickupCoordinates?: Coordinates | string;
  carWashId?: {
    name?: string;
    carWashName?: string;
    location?: string;
    locationCoordinates?: Coordinates | string;
  };
  vehicleId?: {
    make?: string;
    model?: string;
    plateNo?: string;
  };
  clientId?: {
    name?: string;
  };
  driverId?: {
    name?: string;
  };
}

interface CarWash {
  id: string;
  name?: string;
  carWashName?: string;
  location?: string;
  locationCoordinates?: Coordinates | string;
}

interface Driver {
  id: string;
  name: string;
  locationCoordinates?: Coordinates | string;
}

interface RouteSegment {
  from: Coordinates;
  to: Coordinates;
  distance: number;
  estimatedTime: number;
}

interface MapViewProps {
  bookings?: Booking[];
  /** Pre-loaded car washes (optional; otherwise fetched when showCarWashes) */
  carWashes?: CarWash[];
  activeBookingId?: string;
  onBookingClick?: (booking: Booking) => void;
  onCarWashClick?: (carWash: CarWash) => void;
  showNearbyServices?: boolean;
  showCarWashes?: boolean;
  showDrivers?: boolean;
  showRoute?: boolean;
  routeSegments?: RouteSegment[];
  /** Full driving path from Mapbox Directions (preferred over straight segment lines) */
  routeGeoJson?: Feature<LineString> | null;
  center?: Coordinates;
  /** When false, map won't auto fitBounds on every marker update */
  autoFitMarkers?: boolean;
  /** Single highlighted pin (e.g. pickup location picker) */
  pinLocation?: Coordinates;
  zoom?: number;
  height?: string;
  /** Non-interactive full-bleed map (auth screens) */
  backgroundMode?: boolean;
}

const MapView = ({
  bookings = [],
  carWashes: carWashesProp,
  activeBookingId,
  onBookingClick,
  onCarWashClick,
  showNearbyServices = false,
  showCarWashes = false,
  showDrivers = false,
  showRoute = false,
  routeSegments = [],
  routeGeoJson = null,
  center,
  autoFitMarkers = true,
  pinLocation,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  backgroundMode = false,
}: MapViewProps) => {
  const mapboxToken = getMapboxToken();
  const tokenLoading = false;
  const tokenError = mapboxToken ? null : 'Mapbox token not configured';
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onCarWashClickRef = useRef(onCarWashClick);
  const carWashesRef = useRef<CarWash[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: fetchedCarWashes } = useQuery<CarWash[]>({
    queryKey: ['carwashes-map'],
    queryFn: async () => {
      try {
        const response = await api.get('/carwash/list');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching car washes:', error);
        return [];
      }
    },
    enabled: (showNearbyServices || showCarWashes) && !carWashesProp,
    staleTime: 30000,
  });

  const carWashes = useMemo(() => {
    const list = carWashesProp ?? fetchedCarWashes ?? [];
    return filterLusakaCarWashes(list as Record<string, unknown>[]) as CarWash[];
  }, [carWashesProp, fetchedCarWashes]);

  const carWashesWithCoords = useMemo(() => {
    if (!carWashes?.length) return [];
    return carWashes
      .map((cw) => {
        const coords = getLocatableCoordinates(cw as Record<string, unknown>);
        if (!coords) return null;
        return { carWash: cw, coords };
      })
      .filter((x): x is { carWash: CarWash; coords: Coordinates } => x !== null);
  }, [carWashes]);

  useEffect(() => {
    onCarWashClickRef.current = onCarWashClick;
  }, [onCarWashClick]);

  useEffect(() => {
    carWashesRef.current = carWashes;
  }, [carWashes]);

  // Fetch drivers if needed
  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ['drivers-map'],
    queryFn: async () => {
      try {
        const response = await api.get('/drivers/available');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching drivers:', error);
        return [];
      }
    },
    enabled: showNearbyServices || showDrivers,
    staleTime: 10000, // Cache for 10 seconds (more dynamic)
  });

  // Initialize map when token is ready
  useEffect(() => {
    if (tokenLoading || !mapContainer.current || map.current) return;

    if (!mapboxToken || !mapboxToken.startsWith('pk.')) {
      setMapError(
        tokenError ||
          'Mapbox is not configured. Add VITE_MAPBOX_TOKEN to frontend/.env'
      );
      setMapLoaded(true);
      return;
    }

    let loadTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      mapboxgl.accessToken = mapboxToken;

      const initialCenter: [number, number] = center
        ? [center.lng, center.lat]
        : pinLocation
          ? [pinLocation.lng, pinLocation.lat]
          : DEFAULT_CENTER;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom,
        attributionControl: false,
        interactive: !backgroundMode,
      });

      if (!backgroundMode) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      }

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e: { error?: { message?: string } }) => {
        console.error('Mapbox error:', e);
        setMapError(e.error?.message || 'Failed to load map');
        setMapLoaded(true);
      });

      loadTimeout = setTimeout(() => {
        setMapLoaded((loaded) => {
          if (!loaded) {
            console.warn('Map load timeout - showing map anyway');
            return true;
          }
          return loaded;
        });
      }, 10000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to initialize map';
      console.error('Error initializing map:', error);
      setMapError(message);
      setMapLoaded(true);
    }

    return () => {
      if (loadTimeout) clearTimeout(loadTimeout);
      const instance = map.current;
      if (instance) {
        clearMapRouteLine(instance);
        safeRemoveLayer(instance, CARWASH_HIT_LAYER_ID);
        safeRemoveSource(instance, CARWASH_SOURCE_ID);
        try {
          instance.remove();
        } catch {
          /* already removed */
        }
        map.current = null;
      }
      setMapLoaded(false);
    };
  }, [mapboxToken, tokenLoading, tokenError, backgroundMode]);

  // Gentle camera drift for auth background maps
  useEffect(() => {
    if (!backgroundMode || !map.current || !mapLoaded) return;

    const mapInstance = map.current;
    const [lng, lat] = DEFAULT_CENTER;
    const waypoints: [number, number][] = [
      [lng, lat],
      [lng + 0.035, lat + 0.018],
      [lng - 0.02, lat + 0.028],
      [lng + 0.012, lat - 0.015],
      [lng, lat],
    ];
    let index = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let startId: ReturnType<typeof setTimeout> | undefined;

    const pan = () => {
      if (!map.current) return;
      index = (index + 1) % waypoints.length;
      mapInstance.easeTo({
        center: waypoints[index],
        zoom,
        duration: 14000,
        essential: true,
      });
    };

    startId = window.setTimeout(() => {
      pan();
      intervalId = window.setInterval(pan, 15000);
    }, 2000);

    return () => {
      if (startId) clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [backgroundMode, mapLoaded, zoom]);

  // Get user location
  useEffect(() => {
    if (!showNearbyServices || backgroundMode) return;

    getCurrentPosition()
      .then((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      })
      .catch((error) => {
        console.warn('Location error:', error);
        setLocationError('Could not get your location. Please enable location services.');
      });
  }, [showNearbyServices]);

  // Update map center when center prop changes
  useEffect(() => {
    if (!map.current || !center) return;
    map.current.flyTo({
      center: [center.lng, center.lat],
      zoom: zoom,
      duration: 1000,
    });
  }, [center, zoom]);

  // Auto-fit map to route when route segments are provided
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute || !routeSegments || routeSegments.length === 0) return;

    try {
      // Collect all coordinates from route segments
      const coordinates: [number, number][] = [];
      
      routeSegments.forEach((segment) => {
        coordinates.push([segment.from.lng, segment.from.lat]);
        coordinates.push([segment.to.lng, segment.to.lat]);
      });

      if (coordinates.length === 0) return;

      // Calculate bounds
      const lngs = coordinates.map(c => c[0]);
      const lats = coordinates.map(c => c[1]);
      
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );

      // Add padding
      const padding = { top: 50, bottom: 50, left: 50, right: 50 };
      
      // Fit map to bounds
      map.current.fitBounds(bounds, {
        padding,
        duration: 1000,
        maxZoom: 15,
      });
    } catch (error) {
      console.error('Error fitting map to route:', error);
    }
  }, [mapLoaded, showRoute, routeSegments]);

  // Driving route line (Mapbox Directions geometry)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const mapInstance = map.current;

    if (routeGeoJson) {
      setMapRouteLine(mapInstance, routeGeoJson);
    } else if (!showRoute || !routeSegments.length) {
      clearMapRouteLine(mapInstance);
    }

    return () => {
      clearMapRouteLine(mapInstance);
    };
  }, [mapLoaded, routeGeoJson, showRoute, routeSegments.length]);

  // Clickable car wash hit targets (reliable on top of Mapbox canvas)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;
    let cancelled = false;

    const teardownHitLayer = () => {
      safeRemoveLayer(mapInstance, CARWASH_HIT_LAYER_ID);
      safeRemoveSource(mapInstance, CARWASH_SOURCE_ID);
    };

    if (!showCarWashes) {
      teardownHitLayer();
      return teardownHitLayer;
    }

    const syncCarWashLayer = () => {
      if (cancelled || !isMapStyleReady(mapInstance)) return;

      if (!carWashesWithCoords.length) {
        teardownHitLayer();
        return;
      }

      const collection = {
        type: 'FeatureCollection' as const,
        features: carWashesWithCoords.map(({ carWash, coords }) => ({
          type: 'Feature' as const,
          properties: {
            id: String(carWash.id),
            name: carWash.carWashName || carWash.name || 'Car wash',
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [coords.lng, coords.lat],
          },
        })),
      };

      const existing = safeGetSource(mapInstance, CARWASH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(collection);
        return;
      }

      try {
        mapInstance.addSource(CARWASH_SOURCE_ID, { type: 'geojson', data: collection });
        mapInstance.addLayer({
          id: CARWASH_HIT_LAYER_ID,
          type: 'circle',
          source: CARWASH_SOURCE_ID,
          paint: {
            'circle-radius': 22,
            'circle-color': '#00c896',
            'circle-opacity': 0.01,
            'circle-stroke-width': 0,
          },
        });
      } catch {
        teardownHitLayer();
      }
    };

    const handleCarWashLayerClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const featureId = e.features?.[0]?.properties?.id;
      if (!featureId) return;
      const cw = carWashesRef.current.find((c) => String(c.id) === String(featureId));
      if (cw) onCarWashClickRef.current?.(cw);
    };

    const handleEnter = () => {
      if (isMapStyleReady(mapInstance)) mapInstance.getCanvas().style.cursor = 'pointer';
    };
    const handleLeave = () => {
      if (isMapStyleReady(mapInstance)) mapInstance.getCanvas().style.cursor = '';
    };

    const detachHitHandlers = () => {
      try {
        mapInstance.off('click', CARWASH_HIT_LAYER_ID, handleCarWashLayerClick);
        mapInstance.off('mouseenter', CARWASH_HIT_LAYER_ID, handleEnter);
        mapInstance.off('mouseleave', CARWASH_HIT_LAYER_ID, handleLeave);
      } catch {
        /* layer or map gone */
      }
    };

    const attachHitHandlers = () => {
      if (!safeGetLayer(mapInstance, CARWASH_HIT_LAYER_ID)) return;
      detachHitHandlers();
      mapInstance.on('click', CARWASH_HIT_LAYER_ID, handleCarWashLayerClick);
      mapInstance.on('mouseenter', CARWASH_HIT_LAYER_ID, handleEnter);
      mapInstance.on('mouseleave', CARWASH_HIT_LAYER_ID, handleLeave);
    };

    const syncWithHandlers = () => {
      syncCarWashLayer();
      attachHitHandlers();
    };

    const cancelStyleWait = runWhenMapStyleReady(mapInstance, syncWithHandlers);

    return () => {
      cancelled = true;
      cancelStyleWait();
      detachHitHandlers();
      teardownHitLayer();
    };
  }, [mapLoaded, showCarWashes, carWashesWithCoords]);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add booking markers
    bookings.forEach((booking) => {
      const coords = parseCoordinates(booking.pickupCoordinates);
      if (!coords) return;

      const isActive = booking.id === activeBookingId;
      const el = createMarkerElement('booking', booking.status, isActive);
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([coords.lng, coords.lat])
        .addTo(map.current!);

      if (onBookingClick) {
        el.addEventListener('click', () => onBookingClick(booking));
        el.style.cursor = 'pointer';
      }

      markersRef.current.set(`booking-${booking.id}`, marker);
    });

    // Car wash markers (Lusaka only)
    if (showCarWashes) {
      carWashesWithCoords.forEach(({ carWash, coords }) => {
        const name = carWash.carWashName || carWash.name || 'Car wash';
        const isActive = carWash.id === activeBookingId;
        const el = createCarWashMarkerElement(name, isActive);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current!);

        const openWash = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          onCarWashClickRef.current?.(carWash);
        };
        el.addEventListener('click', openWash);
        el.addEventListener('touchend', openWash);

        markersRef.current.set(`carwash-${carWash.id}`, marker);
      });
    }

    // Add driver markers
    if (drivers) {
      drivers.forEach((driver) => {
        const coords = getLocatableCoordinates(driver as Record<string, unknown>);
        if (!coords) return;

        const el = createMarkerElement('driver');
        const marker = new mapboxgl.Marker(el)
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current!);

        markersRef.current.set(`driver-${driver.id}`, marker);
      });
    }

    // Add user location marker
    if (userLocation) {
      const el = createMarkerElement('user');
      const marker = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current!);

      markersRef.current.set('user-location', marker);
    }

    // Pinned location (location picker / booking)
    if (pinLocation) {
      const el = createMarkerElement('pickup');
      const marker = new mapboxgl.Marker(el)
        .setLngLat([pinLocation.lng, pinLocation.lat])
        .addTo(map.current!);
      markersRef.current.set('pin-location', marker);
    } else {
      const existingPin = markersRef.current.get('pin-location');
      if (existingPin) {
        existingPin.remove();
        markersRef.current.delete('pin-location');
      }
    }

    // Add route markers (pickup and destination) when route is shown
    if (showRoute && routeSegments && routeSegments.length > 0) {
      // Remove existing route markers first
      const existingPickup = markersRef.current.get('route-pickup');
      const existingDest = markersRef.current.get('route-destination');
      if (existingPickup) {
        existingPickup.remove();
        markersRef.current.delete('route-pickup');
      }
      if (existingDest) {
        existingDest.remove();
        markersRef.current.delete('route-destination');
      }

      routeSegments.forEach((segment, index) => {
        // Pickup point marker (only for first segment)
        if (index === 0) {
          const pickupEl = createMarkerElement('pickup');
          const pickupMarker = new mapboxgl.Marker(pickupEl)
            .setLngLat([segment.from.lng, segment.from.lat])
            .addTo(map.current!);
          markersRef.current.set('route-pickup', pickupMarker);
        }

        // Destination point marker (for last segment)
        if (index === routeSegments.length - 1) {
          const destEl = createMarkerElement('destination');
          const destMarker = new mapboxgl.Marker(destEl)
            .setLngLat([segment.to.lng, segment.to.lat])
            .addTo(map.current!);
          markersRef.current.set('route-destination', destMarker);
        }
      });
    } else {
      // Remove route markers when route is not shown
      const existingPickup = markersRef.current.get('route-pickup');
      const existingDest = markersRef.current.get('route-destination');
      if (existingPickup) {
        existingPickup.remove();
        markersRef.current.delete('route-pickup');
      }
      if (existingDest) {
        existingDest.remove();
        markersRef.current.delete('route-destination');
      }
    }

    // Fit map to car wash markers in Lusaka (skip when parent controls camera)
    if (
      autoFitMarkers &&
      !backgroundMode &&
      !activeBookingId &&
      !center &&
      showCarWashes &&
      carWashesWithCoords.length > 0 &&
      map.current
    ) {
      const bounds = new mapboxgl.LngLatBounds();
      carWashesWithCoords.forEach(({ coords }) => {
        bounds.extend([coords.lng, coords.lat]);
      });
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    } else if (!backgroundMode && !showCarWashes && markersRef.current.size > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      markersRef.current.forEach((marker) => {
        const lngLat = marker.getLngLat();
        bounds.extend([lngLat.lng, lngLat.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [
    bookings,
    carWashesWithCoords,
    drivers,
    userLocation,
    pinLocation,
    activeBookingId,
    mapLoaded,
    onBookingClick,
    onCarWashClick,
    showCarWashes,
    showRoute,
    routeSegments,
    backgroundMode,
    autoFitMarkers,
    center,
  ]);

  function createCarWashMarkerElement(name: string, isActive?: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `map-marker map-marker-carwash ${isActive ? 'active' : ''}`;
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
    el.style.touchAction = 'manipulation';

    const pin = document.createElement('div');
    pin.className = 'map-marker-carwash-pin';
    pin.innerHTML = '<span class="marker-icon">🧼</span>';

    const label = document.createElement('span');
    label.className = 'map-marker-hover-label';
    label.textContent = name;

    el.appendChild(pin);
    el.appendChild(label);
    return el;
  }

  // Helper to create marker elements
  const createMarkerElement = (
    type: 'booking' | 'carwash' | 'driver' | 'user' | 'pickup' | 'destination',
    status?: string,
    isActive?: boolean
  ): HTMLElement => {
    const el = document.createElement('div');
    el.className = `map-marker map-marker-${type} ${isActive ? 'active' : ''}`;
    
    const icons: Record<string, string> = {
      booking: '📋',
      carwash: '🧼',
      driver: '🚗',
      user: '📍',
      pickup: '📍',
      destination: '🏁',
    };
    
    el.innerHTML = `<div class="marker-icon">${icons[type] || '📍'}</div>`;
    return el;
  };

  return (
    <div
      className={`map-container${backgroundMode ? ' map-container--background' : ''}`}
      style={{ height, minHeight: backgroundMode ? 0 : undefined }}
    >
      {!backgroundMode && (tokenLoading || !mapLoaded) && !mapError ? (
        <div className="map-loading-overlay">
          <LoadingSpinner size="lg" />
          <p>{tokenLoading ? 'Connecting to Mapbox…' : 'Loading map…'}</p>
        </div>
      ) : null}
      <div
        ref={mapContainer}
        className="map-view"
        style={{
          width: '100%',
          height: '100%',
          minHeight: backgroundMode ? 0 : 400,
          display: 'block',
        }}
      />
      {mapLoaded && showRoute && routeSegments.length > 0 && !routeGeoJson && map.current && (
        <RouteVisualization
          map={map.current}
          route={routeSegments}
          color="#3b82f6"
        />
      )}
      {mapError && !backgroundMode && (
        <div className="map-error-overlay">
          <div className="map-error-message">
            <span>⚠️ {mapError}</span>
          </div>
        </div>
      )}
      {locationError && !backgroundMode && (
        <div className="map-error-overlay">
          <div className="map-error-message">
            <span>⚠️ {locationError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
