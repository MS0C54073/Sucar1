/**
 * NearbyCarWashes Component
 * Displays nearby car washes on a map and in a list view
 * Allows users to search with custom radius, use current location, and book
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useLiveLocation from '../hooks/useLiveLocation';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';
import './NearbyCarWashes.css';

interface CarWash {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  isActive: boolean;
  createdAt: string;
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

  // Get user's current location with real-time updates
  const { location: gpsLocation, loading: gpsLoading, error: gpsError } = useLiveLocation({
    enabled: true,
    intervalMs: 5000, // Real-time updates every 5 seconds
  });

  useEffect(() => {
    if (gpsLocation) {
      setUserLocation({
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
      });
    }
  }, [gpsLocation]);

  // Fetch nearby car washes with real-time polling
  const { data: nearbyCarWashes, isLoading, error, refetch } = useQuery<CarWash[]>({
    queryKey: ['nearby-carwashes', userLocation?.lat, userLocation?.lng, radiusKm],
    queryFn: async () => {
      if (!userLocation) {
        throw new Error('Location not available');
      }

      const response = await api.post('/api/nearby-carwashes', {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm,
      });

      return response.data.data || [];
    },
    enabled: !!userLocation,
    staleTime: 15000, // Consider data fresh for 15 seconds
    refetchInterval: 30000, // Poll for updates every 30 seconds
  });

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseFloat(e.target.value);
    setRadiusKm(newRadius);
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
    navigate('/booking', { state: { carWashId: carWash.id } });
  };

  // Filter and sort car washes
  const filteredAndSortedCarWashes = useCallback(() => {
    let filtered = nearbyCarWashes || [];
    
    // Apply active filter
    if (showOnlyActive) {
      filtered = filtered.filter(cw => cw.isActive);
    }
    
    // Apply sorting
    if (sortBy === 'distance') {
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    <strong>{radiusKm} km</strong></label>
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
            {gpsLoading ? '📍 Getting location...' : '📍 Use My Location'}
          </button>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${!listView ? 'active' : ''}`}
              onClick={() => setListView(false)}
              title="Map view"
            >
              🗺️ Map
            </button>
            <button
              className={`toggle-btn ${listView ? 'active' : ''}`}
              onClick={() => setListView(true)}
              title="List view"
            >
              📋 List
            </button>
          </div>
        </div>

        {/* Filters */}
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
                🔵 {userLocation.lat.toFixed(2)}°, {userLocation.lng.toFixed(2)}°
              </div>
            )}
          </div>
        )}psLoading ? '📍 Getting location...' : '📍 Use My Location'}
          </button>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${!listView ? 'active' : ''}`}
              onClick={() => setListView(false)}
              title="Map view"
            >
              🗺️ Map
            </button>
            <button
              className={`toggle-btn ${listView ? 'active' : ''}`}
              onClick={() => setListView(true)}
              title="List view"
            >
              📋 List
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="error-banner">
            <span>⚠️ {gpsError}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      {!userLocation ? (
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Getting your location...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">
            <span>❌ {error instanceof Error ? error.message : 'Failed to fetch nearby car washes'}</span>
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
          <div className="empty-icon">🧼</div>
          <p>No car washes found within {radiusKm} km</p>
          <p className="empty-hint">Try increasing the radius</p>
        </div>
      ) : (
        <>
          {/* Map View */}
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

          {/* List View */}
          {listView && (
            <div className="list-section">
              <div className="carwash-list">
                {filteredAndSortedCarWashes().map((carWash) => (
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
                      <span className={`status-dot ${carWash.isActive ? 'active' : 'inactive'}`}></span>
                      <span className="status-text">
                        {carWash.isActive ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    {showBookButton && carWash.isActive && (
                      <button
                        className="book-button"
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

          {/* Summary */}
          <div className="summary">
            Found <strong>{filteredAndSortedCarWashes().length}</strong> car wash{filteredAndSortedCarWashes().length !== 1 ? 'es' : ''} within{' '}
            <strong>{radiusKm} km</strong> {showOnlyActive && '(Open now)'}
          </div>
        </>
      )}
    </div>
  );
};

export default NearbyCarWashes;
