import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors } from '../../constants/sucarTheme';

interface ServicePackageCardProps {
  title: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress: () => void;
}

const ServicePackageCard = ({
  title,
  description,
  price,
  icon,
  iconColor,
  onPress,
}: ServicePackageCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
    <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
      <Ionicons name={icon} size={26} color={iconColor} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.desc} numberOfLines={2}>
      {description}
    </Text>
    <View style={styles.footer}>
      <Text style={styles.price}>K{price}</Text>
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={18} color="#FFF" />
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: ClientColors.surface,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: ClientColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '700', color: ClientColors.text },
  desc: { fontSize: 11, color: ClientColors.textSecondary, marginTop: 4, minHeight: 32 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 16, fontWeight: '800', color: ClientColors.primary },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ClientColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServicePackageCard;
