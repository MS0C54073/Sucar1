import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickBookBlockProps {
  onBook: () => void;
  onViewAll?: () => void;
}

/** Map preview placeholder — avoids WebView crash on home scroll */
const QuickBookBlock = ({ onBook }: QuickBookBlockProps) => (
  <View style={styles.wrap}>
    <View style={styles.mapWrap}>
      <View style={styles.mapGrid} />
      <View style={[styles.pin, styles.pinLeft]}>
        <Ionicons name="car-sport" size={14} color="#0056D2" />
      </View>
      <View style={[styles.pin, styles.pinRight]}>
        <Ionicons name="car-sport" size={14} color="#0056D2" />
      </View>
      <View style={styles.userDot} />
    </View>
    <View style={styles.locationCard}>
      <View style={styles.thumb}>
        <Ionicons name="business" size={28} color="#0056D2" />
      </View>
      <View style={styles.locInfo}>
        <Text style={styles.locName}>SuCAR Downtown</Text>
        <Text style={styles.locMeta}>0.6 mi away</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.rating}>4.8 (128)</Text>
          <Text style={styles.hours}> · Open until 8:00 PM</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bookBtn} onPress={onBook} activeOpacity={0.9}>
        <Text style={styles.bookBtnText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E8EDF5' },
  mapWrap: { height: 200, backgroundColor: '#DDE4F0', position: 'relative', overflow: 'hidden' },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    borderWidth: 1,
    borderColor: '#B8C5D9',
  },
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pinLeft: { top: 56, left: 48 },
  pinRight: { top: 88, right: 56 },
  userDot: {
    position: 'absolute',
    bottom: 72,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0056D2',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locInfo: { flex: 1 },
  locName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  locMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  rating: { fontSize: 12, color: '#111827', fontWeight: '600', marginLeft: 4 },
  hours: { fontSize: 12, color: '#6B7280' },
  bookBtn: {
    backgroundColor: '#0056D2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});

export default QuickBookBlock;
