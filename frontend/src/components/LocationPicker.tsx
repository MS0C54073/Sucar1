import { useState, useEffect } from 'react';
import { getCurrentPosition, Coordinates } from '../services/locationService';
import { searchLocations, reverseGeocode, GeocodingResult } from '../services/geocodingService';
import MapView from './MapView';
import './LocationPicker.css';

interface LocationPickerProps {
  onLocationSelect: (location: string, coordinates: Coordinates) => void;
  initialLocation?: string;
  initialCoordinates?: Coordinates;
  /** Show Mapbox map preview when coordinates are set */
  showMapPreview?: boolean;
}

const LocationPicker = ({
  onLocationSelect,
  initialLocation,
  initialCoordinates,
  showMapPreview = false,
}: LocationPickerProps) => {
  const [location, setLocation] = useState<string>(initialLocation || '');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(initialCoordinates);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
    if (initialCoordinates) {
      setCoordinates(initialCoordinates);
    }
  }, [initialLocation, initialCoordinates]);

  // Get user location for proximity search
  useEffect(() => {
    getCurrentPosition()
      .then((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      })
      .catch(() => {
        // Silent fail - proximity search will just not use it
      });
  }, []);

  // Search locations with debounce
  useEffect(() => {
    if (!location || location.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(location, userLocation || undefined);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [location, userLocation]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    setShowResults(true);
  };

  const handleResultSelect = async (result: GeocodingResult) => {
    setLocation(result.placeName);
    const coords: Coordinates = {
      lat: result.coordinates.lat,
      lng: result.coordinates.lng,
    };
    setCoordinates(coords);
    setShowResults(false);
    onLocationSelect(result.placeName, coords);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      const coords: Coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoordinates(coords);
      
      // Reverse geocode to get address
      const address = await reverseGeocode(coords);
      const locationText = address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      setLocation(locationText);
      setShowResults(false);
      onLocationSelect(locationText, coords);
    } catch (error: any) {
      alert(`Could not get your location: ${error.message}`);
    }
  };

  return (
    <div className="location-picker">
      <div className="location-picker-input-group">
        <div className="location-picker-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search for an address or location..."
            value={location}
            onChange={handleLocationChange}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click on results
              setTimeout(() => setShowResults(false), 200);
              if (location && coordinates) {
                onLocationSelect(location, coordinates);
              }
            }}
          />
          {isSearching && (
            <span className="location-picker-spinner">⏳</span>
          )}
          
          {/* Autocomplete Results */}
          {showResults && searchResults.length > 0 && (
            <div className="location-picker-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="location-picker-result-item"
                  onClick={() => handleResultSelect(result)}
                >
                  <span className="result-icon">📍</span>
                  <div className="result-content">
                    <div className="result-name">{result.placeName}</div>
                    {result.context && result.context.length > 0 && (
                      <div className="result-context">{result.context.join(', ')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleUseCurrentLocation}
          title="Use current location"
        >
          📍 Current
        </button>
      </div>
      {coordinates && showMapPreview && (
        <div className="location-picker-map">
          <MapView center={coordinates} pinLocation={coordinates} zoom={15} height="180px" />
        </div>
      )}
      {coordinates && (
        <div className="location-picker-coordinates">
          <small>
            Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </small>
        </div>
      )}
      <p className="location-picker-hint">
        Start typing to search for locations, or click "Use Current Location" to automatically detect your location
      </p>
    </div>
  );
};

export default LocationPicker;
