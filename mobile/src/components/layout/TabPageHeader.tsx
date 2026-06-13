import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClientColors, DriverColors, AppLayout } from '../../constants/sucarTheme';

interface TabPageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'client' | 'driver';
}

const TabPageHeader = ({ title, subtitle, variant = 'client' }: TabPageHeaderProps) => {
  const C = variant === 'driver' ? DriverColors : ClientColors;
  return (
    <View style={[styles.wrap, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: C.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
});

export default TabPageHeader;
