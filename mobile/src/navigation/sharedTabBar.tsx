import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/theme';
import { ClientColors, DriverColors, AppLayout } from '../constants/sucarTheme';

type TabVariant = 'client' | 'driver';

export const tabBarScreenOptions = (variant: TabVariant) => {
  const C = variant === 'driver' ? DriverColors : ClientColors;
  return {
    tabBarActiveTintColor: C.tabActive,
    tabBarInactiveTintColor: C.tabInactive,
    tabBarStyle: {
      backgroundColor: C.surface,
      borderTopWidth: 1,
      borderTopColor: C.border,
      height: AppLayout.tabBarHeight,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: Typography.xs, fontWeight: '600' as const },
    headerShown: false,
  };
};

export const TabBarIcon = ({
  routeName,
  iconMap,
  focused,
  color,
  size,
  variant,
}: {
  routeName: string;
  iconMap: Record<string, [string, string]>;
  focused: boolean;
  color: string;
  size: number;
  variant: TabVariant;
}) => {
  const [on, off] = iconMap[routeName] || ['ellipse', 'ellipse-outline'];
  return (
    <View style={focused ? styles.activeWrap : undefined}>
      <Ionicons
        name={(focused ? on : off) as keyof typeof Ionicons.glyphMap}
        size={size}
        color={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  activeWrap: { alignItems: 'center' },
});
