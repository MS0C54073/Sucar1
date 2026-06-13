import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}

interface EarningsRowProps {
  stats: StatItem[];
}

const EarningsRow = ({ stats }: EarningsRowProps) => (
  <View style={styles.row}>
    {stats.map((s, i) => (
      <View key={i} style={[styles.stat, i < stats.length - 1 && styles.statBorder]}>
        <Ionicons name={s.icon} size={22} color={s.iconColor} />
        <Text style={styles.value}>{s.value}</Text>
        <Text style={styles.label}>{s.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#141F33',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3548',
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#2A3548' },
  value: { fontSize: 18, fontWeight: '800', color: '#FFF', marginTop: 8 },
  label: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});

export default EarningsRow;
