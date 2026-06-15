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
import { useMapbox } from '../context/MapboxContext';
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
import Icon from './icons/Icon';
import './MapView.css';

const CARWASH_SOURCE_ID = 'sucar-carwashes-source';
const CARWASH_HIT_LAYER_ID = 'sucar-carwashes-hit';

// Inline white SVG glyphs for map markers (no emoji — clean, professional).
const svgGlyph = (inner: string) =>
  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const MARKER_SVG: Record<string, string> = {
  booking: svgGlyph('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="M9 11h6"/><path d="M9 15h4"/>'),
  carwash: svgGlyph('<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 4.7 7 3c-.29 1.7-1.14 3.13-2.29 4.06S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05Z"/><path d="M12.56 6.6A11 11 0 0 0 14 3c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6 6 0 0 1-11.9 1"/>'),
  driver: svgGlyph('<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M3 17h18v-3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3Z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>'),
  user: svgGlyph('<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  pickup: svgGlyph('<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  destination: svgGlyph('<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>'),
};

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
  /** Optional real face avatar shown as the marker (live tracking participants) */
  avatar?: {
    name?: string;
    photoUrl?: string | null;
    variant?: 'you' | 'counterparty';
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
  profilePictureUrl?: string | null;
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
  const { token: contextToken, loading: contextTokenLoading } = useMapbox();
  const mapboxToken = contextToken || getMapboxToken();
  const tokenLoading = contextTokenLoading && !mapboxToken;
  const tokenError = mapboxToken || tokenLoading ? null : 'Mapbox token not configured';
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

      let geolocate: mapboxgl.GeolocateControl | null = null;

      if (!backgroundMode) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // "My location" button: prompts for permission, shows a live GPS dot,
        // and recenters the map on the user's real position once accepted.
        geolocate = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true, timeout: 10000 },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true,
        });
        map.current.addControl(geolocate, 'top-right');

        geolocate.on('geolocate', (pos: GeolocationPosition) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        });
        geolocate.on('error', (err: GeolocationPositionError) => {
          if (err?.code === err?.PERMISSION_DENIED) {
            setLocationError('Location permission denied. Enable it to see your position.');
          }
        });
      }

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);

        // Auto-prompt for the user's location on interactive maps. The browser
        // only shows the permission dialog once; afterwards this is silent.
        if (geolocate && !center && !pinLocation) {
          setTimeout(() => {
            try {
              geolocate?.trigger();
            } catch {
              /* control not ready */
            }
          }, 400);
        }
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
      const el = booking.avatar
        ? createAvatarMarkerElement(
            booking.avatar.name,
            booking.avatar.photoUrl,
            isActive,
            booking.avatar.variant
          )
        : createMarkerElement('booking', booking.status, isActive);

      const marker = new mapboxgl.Marker(
        booking.avatar ? { element: el, anchor: 'bottom' } : el
      )
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

    // Add driver markers (real face when available)
    if (drivers) {
      drivers.forEach((driver) => {
        const coords = getLocatableCoordinates(driver as Record<string, unknown>);
        if (!coords) return;

        const el = createAvatarMarkerElement(driver.name, driver.profilePictureUrl, false, 'counterparty');
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current!);

        markersRef.current.set(`driver-${driver.id}`, marker);
      });
    }

    // User location is rendered by Mapbox's GeolocateControl (live GPS dot),
    // so we intentionally don't add a separate custom "user" marker here.

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
    pin.innerHTML = `<span class="marker-icon">${MARKER_SVG.carwash}</span>`;

    const label = document.createElement('span');
    label.className = 'map-marker-hover-label';
    label.textContent = name;

    el.appendChild(pin);
    el.appendChild(label);
    return el;
  }

  // Build initials from a display name (fallback when there's no photo)
  function getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
  }

  // Circular "face" marker showing a user's photo (or initials) with a pin tail
  function createAvatarMarkerElement(
    name?: string,
    photoUrl?: string | null,
    isActive?: boolean,
    variant: 'you' | 'counterparty' = 'counterparty'
  ): HTMLElement {
    const el = document.createElement('div');
    el.className = `map-marker map-avatar-marker map-avatar-marker--${variant} ${isActive ? 'active' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = 'map-avatar-marker__bubble';

    const renderInitials = () => {
      const initials = document.createElement('span');
      initials.className = 'map-avatar-marker__initials';
      initials.textContent = getInitials(name);
      bubble.appendChild(initials);
    };

    if (photoUrl) {
      const img = document.createElement('img');
      img.className = 'map-avatar-marker__img';
      img.src = photoUrl;
      img.alt = name || 'User';
      img.loading = 'eager';
      img.decoding = 'async';
      img.onerror = () => {
        img.remove();
        if (!bubble.querySelector('.map-avatar-marker__initials')) renderInitials();
      };
      bubble.appendChild(img);
    } else {
      renderInitials();
    }

    const tail = document.createElement('div');
    tail.className = 'map-avatar-marker__tail';

    el.appendChild(bubble);
    el.appendChild(tail);

    if (name) {
      const label = document.createElement('span');
      label.className = 'map-marker-hover-label';
      label.textContent = name;
      el.appendChild(label);
    }

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

    el.innerHTML = `<div class="marker-icon">${MARKER_SVG[type] || MARKER_SVG.user}</div>`;
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
            <span><Icon name="alertTriangle" size={15} /> {mapError}</span>
          </div>
        </div>
      )}
      {locationError && !backgroundMode && (
        <div className="map-error-overlay">
          <div className="map-error-message">
            <span><Icon name="alertTriangle" size={15} /> {locationError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
