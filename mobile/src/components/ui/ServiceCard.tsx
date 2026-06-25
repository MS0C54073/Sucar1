import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress: () => void;
}

const ServiceCard = ({ title, description, price, icon, iconColor, onPress }: ServiceCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.top}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.desc} numberOfLines={2}>
      {description}
    </Text>
    <Text style={styles.price}>{price}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 10, minHeight: 36 },
  price: { fontSize: 15, fontWeight: '700', color: '#EC4899' },
});

export default ServiceCard;
