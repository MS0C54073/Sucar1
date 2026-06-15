/**
 * NearbyCarWashes Component
 * Displays nearby car washes on a map and in a list view
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useLiveLocation from '../../hooks/useLiveLocation';
import MapView from '../MapView';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import './NearbyCarWashes.css';

interface CarWash {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  isActive: boolean;
  createdAt?: string;
}

interface NearbyCarWashesProps {
  onCarWashSelect?: (carWash: CarWash) => void;
  showBookButton?: boolean;
}

const NearbyCarWashes: React.FC<NearbyCarWashesProps> = ({
  onCarWashSelect,
  showBookButton = true,
}) => {
  const navigate = useNavigate();
  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedCarWash, setSelectedCarWash] = useState<CarWash | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [listView, setListView] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const { location: gpsLocation, loading: gpsLoading, error: gpsError } = useLiveLocation({
    enabled: true,
    intervalMs: 5000,
  });

  useEffect(() => {
    if (gpsLocation) {
      setUserLocation({
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
      });
    }
  }, [gpsLocation]);

  const { data: nearbyCarWashes, isLoading, error, refetch } = useQuery<CarWash[]>({
    queryKey: ['nearby-carwashes', userLocation?.lat, userLocation?.lng, radiusKm],
    queryFn: async () => {
      if (!userLocation) {
        throw new Error('Location not available');
      }

      const response = await api.post('/locations/nearby-carwashes', {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm,
      });

      return response.data.data || [];
    },
    enabled: !!userLocation,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRadiusKm(parseFloat(e.target.value));
  };

  const handleUseMyLocation = useCallback(() => {
    if (gpsLocation) {
      setUserLocation({
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
      });
    }
  }, [gpsLocation]);

  const handleCarWashSelect = (carWash: CarWash) => {
    setSelectedCarWash(carWash);
    onCarWashSelect?.(carWash);
  };

  const handleBookCarWash = (carWash: CarWash) => {
    navigate('/client/book', { state: { carWashId: carWash.id } });
  };

  const filteredAndSortedCarWashes = useCallback(() => {
    let filtered = nearbyCarWashes || [];

    if (showOnlyActive) {
      filtered = filtered.filter((cw) => cw.isActive);
    }

    if (sortBy === 'distance') {
      filtered = [...filtered].sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [nearbyCarWashes, showOnlyActive, sortBy]);

  const carWashMarkers = useMemo(
    () =>
      filteredAndSortedCarWashes().map((carWash) => ({
        id: carWash.id,
        status: carWash.isActive ? 'active' : 'inactive',
        pickupLocation: carWash.name,
        pickupCoordinates: {
          lat: carWash.latitude,
          lng: carWash.longitude,
        },
      })),
    [filteredAndSortedCarWashes]
  );

  const displayList = filteredAndSortedCarWashes();

  return (
    <div className="nearby-carwashes-container">
      <div className="search-header">
        <div className="search-controls">
          <div className="radius-control">
            <label htmlFor="radius-slider">
              Search radius: <strong>{radiusKm} km</strong>
            </label>
            <input
              id="radius-slider"
              type="range"
              min="1"
              max="50"
              value={radiusKm}
              onChange={handleRadiusChange}
              className="radius-slider"
            />
          </div>

          <button
            className="location-button"
            onClick={handleUseMyLocation}
            disabled={gpsLoading}
            title="Use your current location"
          >
            <Icon name="mapPin" size={15} /> {gpsLoading ? 'Getting location...' : 'Use My Location'}
          </button>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${!listView ? 'active' : ''}`}
              onClick={() => setListView(false)}
              title="Map view"
            >
              <Icon name="map" size={15} /> Map
            </button>
            <button
              className={`toggle-btn ${listView ? 'active' : ''}`}
              onClick={() => setListView(true)}
              title="List view"
            >
              <Icon name="clipboard" size={15} /> List
            </button>
          </div>
        </div>

        {listView && (
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'distance' | 'name')}
                className="sort-select"
              >
                <option value="distance">Nearest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
              />
              <span>Open Now</span>
            </label>

            {userLocation && (
              <div className="location-indicator">
                <Icon name="mapPin" size={13} /> {userLocation.lat.toFixed(2)}°, {userLocation.lng.toFixed(2)}°
              </div>
            )}
          </div>
        )}

        {gpsError && (
          <div className="error-banner">
            <span><Icon name="alertTriangle" size={14} /> {gpsError}</span>
          </div>
        )}
      </div>

      {!userLocation ? (
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Getting your location...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">
            <span>
              <Icon name="alertCircle" size={14} /> {error instanceof Error ? error.message : 'Failed to fetch nearby car washes'}
            </span>
            <button onClick={() => refetch()} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Finding nearby car washes...</p>
        </div>
      ) : !nearbyCarWashes || nearbyCarWashes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="droplets" size={32} /></div>
          <p>No car washes found within {radiusKm} km</p>
          <p className="empty-hint">Try increasing the radius</p>
        </div>
      ) : (
        <>
          {!listView && (
            <div className="map-section">
              <MapView
                bookings={carWashMarkers}
                center={userLocation}
                height="500px"
                activeBookingId={selectedCarWash?.id}
              />
            </div>
          )}

          {listView && (
            <div className="list-section">
              <div className="carwash-list">
                {displayList.map((carWash) => (
                  <div
                    key={carWash.id}
                    className={`carwash-card ${selectedCarWash?.id === carWash.id ? 'selected' : ''} ${!carWash.isActive ? 'inactive' : ''}`}
                    onClick={() => handleCarWashSelect(carWash)}
                  >
                    <div className="carwash-header">
                      <h3 className="carwash-name">{carWash.name}</h3>
                      <span className="distance-badge">
                        {carWash.distanceKm.toFixed(1)} km away
                      </span>
                    </div>

                    <div className="carwash-status">
                      <span className={`status-dot ${carWash.isActive ? 'active' : 'inactive'}`} />
                      <span className="status-text">{carWash.isActive ? 'Open' : 'Closed'}</span>
                    </div>

                    {showBookButton && carWash.isActive && (
                      <button
                        className="book-button"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookCarWash(carWash);
                        }}
                      >
                        Book Service →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="summary">
            Found <strong>{displayList.length}</strong> car wash
            {displayList.length !== 1 ? 'es' : ''} within <strong>{radiusKm} km</strong>
            {showOnlyActive && ' (Open now)'}
          </div>
        </>
      )}
    </div>
  );
};

export default NearbyCarWashes;
