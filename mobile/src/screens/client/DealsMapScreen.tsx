import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../utils/api';
import CarWashMapView, {
  CarWashMapViewHandle,
  MapWashMarker,
} from '../../components/CarWashMapView';
import MapControlButtons from '../../components/ui/MapControlButtons';
import SearchAutocomplete, { AutocompleteItem } from '../../components/ui/SearchAutocomplete';
import { CarWashListItem } from '../../components/ui/CarWashCard';
import { ClientColors, AppLayout } from '../../constants/sucarTheme';
import { useUserLocation, distanceKm, parseWashCoords } from '../../hooks/useUserLocation';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  fetchHomeSearchSuggestions,
  SearchSuggestion,
} from '../../services/homeSearchService';

const DealsMapScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<CarWashMapViewHandle>(null);

  const [carWashes, setCarWashes] = useState<CarWashListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedWashId, setSelectedWashId] = useState<string | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const washesWithCoords = useMemo(
    () =>
      carWashes
        .map((w) => ({ wash: w, coords: parseWashCoords(w) }))
        .filter((x): x is { wash: CarWashListItem; coords: NonNullable<ReturnType<typeof parseWashCoords>> } =>
          Boolean(x.coords)
        ),
    [carWashes]
  );

  const markerCoordList = useMemo(
    () => washesWithCoords.map(({ coords }) => coords),
    [washesWithCoords]
  );

  const {
    coords: userCoords,
    loading: locationLoading,
    permission: locationPermission,
    error: locationError,
    refresh: refreshLocation,
    gpsRejected,
  } = useUserLocation(markerCoordList);

  const fetchWashes = useCallback(async () => {
    try {
      const res = await apiClient.get('/carwash/list?includeServices=true');
      setCarWashes(res.data.data || []);
    } catch (e) {
      console.error('Deals map washes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWashes();
  }, [fetchWashes]);

  useEffect(() => {
    if (userCoords) {
      mapRef.current?.sendCommand('flyToUser');
    }
  }, [userCoords]);

  const mapMarkers: MapWashMarker[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return washesWithCoords
      .filter(({ wash }) => {
        if (!q) return true;
        const name = (wash.carWashName || wash.name || '').toLowerCase();
        const loc = (wash.location || '').toLowerCase();
        return name.includes(q) || loc.includes(q);
      })
      .map(({ wash, coords }) => ({
        id: wash.id,
        lat: coords.lat,
        lng: coords.lng,
        title: wash.carWashName || wash.name || 'Car wash',
        subtitle: wash.location,
        rating: wash.rating,
      }));
  }, [washesWithCoords, searchQuery]);

  const selectedWash = useMemo(
    () => carWashes.find((w) => w.id === selectedWashId),
    [carWashes, selectedWashId]
  );

  const selectedCoords = selectedWash ? parseWashCoords(selectedWash) : undefined;
  const selectedDistance =
    userCoords && selectedCoords
      ? `${distanceKm(userCoords, selectedCoords).toFixed(1)} km away`
      : 'Nearby';

  useEffect(() => {
    if (!searchFocused) {
      setSuggestions([]);
      return;
    }
    const q = debouncedQuery.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setLoadingSuggestions(true);
    fetchHomeSearchSuggestions(q, carWashes, userCoords || undefined)
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchFocused, carWashes, userCoords]);

  const suggestionItems: AutocompleteItem[] = useMemo(
    () =>
      suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        icon: s.type === 'carwash' ? 'car-outline' : 'location-outline',
        badge: s.type === 'carwash' ? 'Car wash' : undefined,
      })),
    [suggestions]
  );

  const handleMapCommand = useCallback((cmd: Parameters<CarWashMapViewHandle['sendCommand']>[0]) => {
    mapRef.current?.sendCommand(cmd);
  }, []);

  const openBook = useCallback(
    (wash: CarWashListItem) => {
      navigation.navigate('Booking', { carWashId: wash.id });
    },
    [navigation]
  );

  const handleSuggestionSelect = useCallback(
    (item: AutocompleteItem) => {
      const match = suggestions.find((s) => s.id === item.id);
      if (!match) return;
      setSearchFocused(false);
      setSuggestions([]);

      if (match.type === 'carwash' && match.carWash) {
        setSelectedWashId(match.carWash.id);
        setSearchQuery(match.carWash.carWashName || match.carWash.name || '');
        return;
      }
      if (match.type === 'place') {
        setSearchQuery(match.subtitle || match.title);
      }
    },
    [suggestions]
  );

  const locationLabel = `${mapMarkers.length} location${mapMarkers.length === 1 ? '' : 's'} in Lusaka`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <LinearGradient
        colors={['#0B1220', '#141B2E', '#1A2340']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.title}>Deals map</Text>
        <Text style={styles.subtitle}>
          Browse Lusaka car washes on the map, see routes, and book at a location.
        </Text>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={ClientColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search car washes near you..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
              setSearchFocused(true);
            }}
            onBlur={() => {
              blurTimerRef.current = setTimeout(() => setSearchFocused(false), 200);
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <SearchAutocomplete
          visible={searchFocused && searchQuery.trim().length > 0}
          loading={loadingSuggestions}
          items={suggestionItems}
          onSelect={handleSuggestionSelect}
          emptyMessage="No car washes or places found"
          headerLabel="Suggestions"
          embedded
        />
      </LinearGradient>

      <View style={styles.mapArea}>
        {loading || locationLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={ClientColors.primary} />
            <Text style={styles.loadingText}>
              {locationLoading ? 'Detecting your location…' : 'Loading car washes…'}
            </Text>
            {locationPermission === 'denied' && locationError ? (
              <Text style={styles.loadingHint}>{locationError}</Text>
            ) : null}
          </View>
        ) : (
          <>
            {locationPermission === 'denied' && (
              <View style={styles.permissionBanner}>
                <Ionicons name="location-outline" size={18} color="#FBBF24" />
                <Text style={styles.permissionText}>
                  {locationError || 'Allow location access to center the map on you.'}
                </Text>
                <TouchableOpacity onPress={refreshLocation} style={styles.retryBtn}>
                  <Text style={styles.retryTxt}>Enable</Text>
                </TouchableOpacity>
              </View>
            )}

            {gpsRejected && locationPermission === 'granted' && (
              <View style={styles.gpsHint}>
                <Text style={styles.gpsHintText}>
                  GPS fix outside Lusaka — showing local car washes on the map.
                </Text>
              </View>
            )}

            <CarWashMapView
              ref={mapRef}
              markers={mapMarkers}
              userLocation={userCoords}
              selectedId={selectedWashId}
              onMarkerPress={setSelectedWashId}
              containerStyle={styles.mapFill}
            />

            <View style={styles.countBadge}>
              <Ionicons name="location" size={12} color="#93C5FD" />
              <Text style={styles.countText}>{locationLabel}</Text>
            </View>

            <View style={styles.controls}>
              <MapControlButtons onCommand={handleMapCommand} />
            </View>

            {selectedWash && (
              <SafeAreaView edges={['bottom']} style={styles.bottomCardWrap}>
                <View style={styles.bottomCard}>
                  <View style={styles.cardThumb}>
                    <Ionicons name="water" size={22} color={ClientColors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {selectedWash.carWashName || selectedWash.name}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="star" size={12} color={ClientColors.accent} />
                      <Text style={styles.cardRating}>
                        {selectedWash.rating?.toFixed(1) || '4.8'}
                      </Text>
                      <Text style={styles.cardDist}> · {selectedDistance}</Text>
                    </View>
                    <Text style={styles.cardStatus}>Open · Closes 8:00 PM</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => openBook(selectedWash)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.bookTxt}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1220' },
  header: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingBottom: 14,
    zIndex: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  mapFill: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF4',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: ClientColors.text,
  },
  loadingHint: {
    marginTop: 8,
    fontSize: 12,
    color: ClientColors.textSecondary,
    textAlign: 'center',
  },
  permissionBanner: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  permissionText: { flex: 1, fontSize: 12, color: '#E2E8F0' },
  retryBtn: {
    backgroundColor: ClientColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  gpsHint: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gpsHintText: { fontSize: 11, color: '#CBD5E1', textAlign: 'center' },
  countBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  countText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    right: 14,
    top: '28%',
  },
  bottomCardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: AppLayout.screenPadding,
    paddingBottom: 8,
  },
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141B2E',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: ClientColors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardRating: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 3 },
  cardDist: { fontSize: 12, color: '#94A3B8' },
  cardStatus: { fontSize: 11, color: '#64748B', marginTop: 2 },
  bookBtn: {
    backgroundColor: ClientColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  bookTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});

export default DealsMapScreen;
