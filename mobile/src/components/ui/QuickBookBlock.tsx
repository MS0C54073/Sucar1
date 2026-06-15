import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors, AppLayout } from '../../constants/sucarTheme';
import CustomMapView from '../MapView';
import { Coordinates } from '../../services/locationService';

interface QuickBookBlockProps {
  washName?: string;
  distance?: string;
  rating?: string;
  userLocation?: Coordinates;
  washLocation?: Coordinates;
  onBook: () => void;
}

const QuickBookBlock = ({
  washName = 'Ultra Clean Services',
  distance = 'Nearby',
  rating = '4.8',
  userLocation,
  washLocation,
  onBook,
}: QuickBookBlockProps) => (
  <View style={styles.wrap}>
    <View style={styles.map}>
      {userLocation || washLocation ? (
        <CustomMapView
          pickupLocation={userLocation || washLocation}
          destinationLocation={washLocation && userLocation ? washLocation : undefined}
          height={170}
          showRoute={!!(userLocation && washLocation)}
        />
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
    </View>
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
