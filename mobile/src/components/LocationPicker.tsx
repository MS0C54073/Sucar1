import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentPosition, Coordinates } from '../services/locationService';
import { searchLocations, reverseGeocode, GeocodingResult } from '../services/geocodingService';
import { useMapbox } from '../context/MapboxContext';
import { ClientColors } from '../constants/sucarTheme';

interface LocationPickerProps {
  onLocationSelect: (location: string, coordinates: Coordinates) => void;
  initialLocation?: string;
  initialCoordinates?: Coordinates;
}

/**
 * Reusable location input with search + current‑location support.
 *
 * Uses a geocoding service to provide autocomplete suggestions and
 * can fall back to manual entry; selected coordinates are passed up
 * via the onLocationSelect callback.
 */
const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  initialCoordinates,
}) => {
  const [location, setLocation] = useState<string>(initialLocation || '');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(initialCoordinates);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { token: mapboxToken, loading: tokenLoading } = useMapbox();

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
      .then((coords) => {
        setUserLocation(coords);
      })
      .catch(() => {
        // Silent fail - proximity search will just not use it
      });
  }, []);

  // Search locations with debounce — re-runs when token becomes available
  useEffect(() => {
    if (!location || location.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setSearchError(null);
      return;
    }

    if (tokenLoading) return;

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchLocations(location, userLocation || undefined);
        setSearchResults(results);
        setShowResults(true);
        if (results.length === 0 && !mapboxToken) {
          setSearchError('Location search unavailable. Start the backend server.');
        } else if (results.length === 0) {
          setSearchError('No locations found. Try a different search.');
        }
      } catch {
        setSearchError('Search failed. Check your connection.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [location, userLocation, mapboxToken, tokenLoading]);

  const handleLocationChange = (text: string) => {
    setLocation(text);
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
    setIsGettingLocation(true);
    try {
      const coords = await getCurrentPosition();
      setCoordinates(coords);
      
      // Reverse geocode to get address
      const address = await reverseGeocode(coords);
      const locationText = address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      setLocation(locationText);
      setShowResults(false);
      onLocationSelect(locationText, coords);
    } catch (error: any) {
      Alert.alert('Location Error', `Could not get your location: ${error.message}`);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Search for an address or location..."
            value={location}
            onChangeText={handleLocationChange}
            onFocus={() => {
              if (searchResults.length > 0 || location.length >= 2) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay hide so result taps register (onPressIn also selects)
              setTimeout(() => setShowResults(false), 250);
            }}
          />
          {isSearching && (
            <View style={styles.spinner}>
              <ActivityIndicator size="small" color={ClientColors.primary} />
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.currentButton, isGettingLocation && styles.currentButtonDisabled]}
          onPress={handleUseCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.currentButtonInner}>
              <Ionicons name="locate" size={15} color="#fff" />
              <Text style={styles.currentButtonText}>Current</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Autocomplete Results */}
      {showResults && searchResults.length > 0 && (
        <ScrollView
          style={styles.resultsContainer}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="always"
        >
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.resultItem}
              onPressIn={() => handleResultSelect(item)}
            >
              <Ionicons name="location-outline" size={18} color="#64748B" style={styles.resultIcon} />
              <View style={styles.resultContent}>
                <Text style={styles.resultName}>{item.placeName}</Text>
                {item.context && item.context.length > 0 && (
                  <Text style={styles.resultContext}>{item.context.join(', ')}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showResults && searchResults.length === 0 && location.length >= 2 && !isSearching && searchError && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>{searchError}</Text>
        </View>
      )}

      {coordinates && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesText}>
            Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </Text>
        </View>
      )}

      <Text style={styles.hint}>
        Start typing to search for locations, or tap "Current" to automatically detect your location
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  spinner: {
    position: 'absolute',
    right: 10,
    top: 15,
  },
  currentButton: {
    backgroundColor: ClientColors.primary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  currentButtonDisabled: {
    opacity: 0.6,
  },
  currentButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  resultContext: {
    fontSize: 12,
    color: '#666',
  },
  coordinatesContainer: {
    marginTop: 5,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  noResults: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noResultsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default LocationPicker;
