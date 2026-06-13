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
  onViewAll?: () => void;
}

const QuickBookBlock = ({
  washName = 'SuCAR Premium Wash',
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
          height={160}
          showRoute={!!(userLocation && washLocation)}
        />
      ) : (
        <View style={styles.mapFallback}>
          <Ionicons name="map-outline" size={32} color={ClientColors.primary} />
          <Text style={styles.mapHint}>Enable location for live map</Text>
        </View>
      )}
    </View>
    <View style={styles.card}>
      <View style={styles.thumb}>
        <Ionicons name="business" size={28} color={ClientColors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {washName}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.meta}>{rating}</Text>
        </View>
        <Text style={styles.dist}>{distance} · Open · Closes 8:00 PM</Text>
      </View>
      <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
        <Text style={styles.bookTxt}>Book Now</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: AppLayout.screenPadding,
    borderRadius: AppLayout.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ClientColors.border,
  },
  map: { height: 160, backgroundColor: '#E0F2FE' },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 160 },
  mapHint: { fontSize: 11, color: ClientColors.textSecondary, marginTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: ClientColors.surface,
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: ClientColors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: ClientColors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 12, fontWeight: '600', color: ClientColors.text },
  dist: { fontSize: 11, color: ClientColors.textSecondary, marginTop: 2 },
  bookBtn: {
    backgroundColor: ClientColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookTxt: { color: '#FFF', fontWeight: '700', fontSize: 12 },
});

export default QuickBookBlock;
