import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors, AppLayout } from '../../constants/sucarTheme';

export interface CarWashListItem {
  id: string;
  carWashName?: string;
  name?: string;
  location?: string;
  services?: { price?: number; name?: string }[];
  rating?: number;
}

interface CarWashCardProps {
  wash: CarWashListItem;
  onPress: () => void;
}

const CarWashCard = ({ wash, onPress }: CarWashCardProps) => {
  const title = wash.carWashName || wash.name || 'Car wash';
  const minPrice = wash.services?.length
    ? Math.min(...wash.services.map((s) => Number(s.price) || 9999).filter((p) => p < 9999))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.img}>
        <Ionicons name="water" size={34} color={ClientColors.primary} />
        <View style={styles.badge}>
          <Ionicons name="star" size={9} color="#FFF" />
          <Text style={styles.badgeText}>{wash.rating?.toFixed(1) || '4.8'}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={12} color={ClientColors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {wash.location || 'Nearby'}
          </Text>
        </View>
        <Text style={styles.price}>
          {minPrice != null && !Number.isNaN(minPrice) ? `From K${minPrice} / wash` : 'View services'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: AppLayout.screenPadding,
    marginBottom: 10,
    borderRadius: AppLayout.cardRadius,
    borderWidth: 1,
    borderColor: ClientColors.border,
    backgroundColor: ClientColors.surface,
    overflow: 'hidden',
  },
  img: {
    height: 80,
    backgroundColor: ClientColors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ClientColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  body: { paddingVertical: 10, paddingHorizontal: 12 },
  title: { fontSize: 13, fontWeight: '600', color: ClientColors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 10, color: ClientColors.textSecondary, flex: 1 },
  price: { fontSize: 12, fontWeight: '600', color: ClientColors.primary, marginTop: 6 },
});

export default CarWashCard;
