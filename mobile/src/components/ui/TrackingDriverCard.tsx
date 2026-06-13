import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors } from '../../constants/sucarTheme';

interface TrackingDriverCardProps {
  driverName?: string;
  vehicle?: string;
  plate?: string;
  rating?: number;
  status?: string;
  onChat?: () => void;
}

const ACTIVE = ['accepted', 'picked_up', 'at_wash', 'washing_bay', 'drying_bay'];

export const isActiveBooking = (status?: string) =>
  status ? ACTIVE.includes(status) : false;

const TrackingDriverCard = ({
  driverName,
  vehicle,
  plate,
  rating = 4.8,
  status,
  onChat,
}: TrackingDriverCardProps) => {
  const label = status
    ?.split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'En route';

  return (
    <View style={styles.sheet}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={ClientColors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{driverName || 'Your driver'}</Text>
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={14} color={ClientColors.primary} />
            <Text style={styles.verifiedText}>Verified operator</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={ClientColors.accent} />
            <Text style={styles.rating}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      </View>
      {(vehicle || plate) && (
        <Text style={styles.vehicle}>
          {[vehicle, plate].filter(Boolean).join(' • ')}
        </Text>
      )}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLbl}>ETA</Text>
          <Text style={styles.statVal}>~15 min</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLbl}>Status</Text>
          <Text style={[styles.statVal, styles.statTeal]}>{label}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLbl}>Service</Text>
          <Text style={styles.statVal}>On the way</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.85}>
          <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
          <Text style={styles.chatText}>Chat with driver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => Linking.openURL('https://maps.google.com')}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={18} color={ClientColors.primary} />
          <Text style={styles.shareText}>Share trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: ClientColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -16,
    borderWidth: 1,
    borderColor: ClientColors.border,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ClientColors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: ClientColors.text },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  verifiedText: { fontSize: 12, color: ClientColors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontSize: 12, fontWeight: '600', color: ClientColors.text },
  badge: {
    backgroundColor: ClientColors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: ClientColors.primaryDark },
  vehicle: { fontSize: 13, color: ClientColors.textSecondary, marginTop: 12 },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ClientColors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLbl: { fontSize: 10, color: ClientColors.textMuted, marginBottom: 4 },
  statVal: { fontSize: 13, fontWeight: '700', color: ClientColors.text },
  statTeal: { color: ClientColors.primary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClientColors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  chatText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: ClientColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ClientColors.surface,
  },
  shareText: { color: ClientColors.primary, fontWeight: '700', fontSize: 14 },
});

export default TrackingDriverCard;
