import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  dark?: boolean;
}

const SectionHeader = ({ title, actionLabel, onAction, dark }: SectionHeaderProps) => (
  <View style={styles.row}>
    <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  titleDark: { color: '#FFFFFF' },
  action: { fontSize: 14, fontWeight: '600', color: '#0056D2' },
});

export default SectionHeader;
