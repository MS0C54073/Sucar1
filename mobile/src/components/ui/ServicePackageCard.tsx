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
  iconBg?: string;
  onPress: () => void;
}

const ServicePackageCard = ({
  title,
  description,
  price,
  icon,
  iconColor,
  iconBg,
  onPress,
}: ServicePackageCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
    <View style={[styles.iconWrap, { backgroundColor: iconBg || `${iconColor}18` }]}>
      <Ionicons name={icon} size={28} color={iconColor} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.desc} numberOfLines={2}>
      {description}
    </Text>
    <View style={styles.footer}>
      <Text style={styles.price}>K{price}</Text>
      <View style={styles.arrow}>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: 158,
    backgroundColor: ClientColors.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginRight: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: ClientColors.text,
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: ClientColors.textSecondary,
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: ClientColors.accent,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ClientColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServicePackageCard;
