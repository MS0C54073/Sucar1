import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors, AppLayout } from '../../constants/sucarTheme';
import CarWashMapView from '../CarWashMapView';
import MapControlButtons from './MapControlButtons';
import { Coordinates } from '../../services/locationService';

interface QuickBookBlockProps {
  washId?: string;
  washName?: string;
  distance?: string;
  rating?: string;
  userLocation?: Coordinates;
  washLocation?: Coordinates;
  onBook: () => void;
  onMapPress?: () => void;
}

const QuickBookBlock = ({
  washId = 'preview',
  washName = 'Ultra Clean Services',
  distance = 'Nearby',
  rating = '4.8',
  userLocation,
  washLocation,
  onBook,
  onMapPress,
}: QuickBookBlockProps) => {
  const mapMarkers =
    washLocation
      ? [
          {
            id: washId,
            lat: washLocation.lat,
            lng: washLocation.lng,
            title: washName,
          },
        ]
      : [];

  return (
  <View style={styles.wrap}>
    <TouchableOpacity
      style={styles.map}
      activeOpacity={onMapPress ? 0.92 : 1}
      onPress={onMapPress}
      disabled={!onMapPress}
    >
      {washLocation ? (
        <View style={styles.mapInner}>
          <CarWashMapView
            markers={mapMarkers}
            userLocation={userLocation}
            height={170}
            interactive={false}
            containerStyle={styles.mapView}
          />
          <View style={styles.miniControls} pointerEvents="none">
            <MapControlButtons onCommand={() => {}} />
          </View>
        </View>
      ) : (
        <View style={styles.mapFallback}>
          <View style={styles.mapGrid} />
          <View style={styles.pin}>
            <View style={styles.pinHead}>
              <Ionicons name="car-sport" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.pinTail} />
          </View>
        </View>
      )}
    </TouchableOpacity>
    <View style={styles.card}>
      <View style={styles.thumb}>
        <Ionicons name="car-sport" size={26} color={ClientColors.accent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {washName}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={ClientColors.accent} />
          <Text style={styles.meta}>{rating}</Text>
        </View>
        <Text style={styles.dist}>
          {distance} · <Text style={styles.open}>Open</Text> · Closes 8:00 PM
        </Text>
      </View>
      <TouchableOpacity style={styles.bookBtn} onPress={onBook} activeOpacity={0.9}>
        <Text style={styles.bookTxt}>Book Now</Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: AppLayout.screenPadding,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: ClientColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  map: { height: 170, backgroundColor: '#E8EEF4' },
  mapInner: { flex: 1, height: 170, position: 'relative' },
  mapView: { flex: undefined, height: 170, marginVertical: 0, borderRadius: 0 },
  miniControls: {
    position: 'absolute',
    right: 10,
    top: 12,
    transform: [{ scale: 0.82 }],
    opacity: 0.95,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 170,
    backgroundColor: '#E8EEF4',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EAF0F6',
    borderColor: '#DDE6EF',
    borderTopWidth: 28,
    borderBottomWidth: 36,
    borderLeftWidth: 60,
    borderRightWidth: 44,
  },
  pin: { alignItems: 'center' },
  pinHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ClientColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ClientColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pinTail: {
    width: 12,
    height: 12,
    backgroundColor: ClientColors.primary,
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
    borderRadius: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: ClientColors.surface,
    gap: 10,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: ClientColors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: ClientColors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 13, fontWeight: '700', color: ClientColors.text },
  dist: { fontSize: 11, color: ClientColors.textSecondary, marginTop: 3 },
  open: { color: ClientColors.success, fontWeight: '600' },
  bookBtn: {
    backgroundColor: ClientColors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 88,
    alignItems: 'center',
  },
  bookTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});

export default QuickBookBlock;
