import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { ClientColors, DriverColors, AppLayout } from '../../constants/sucarTheme';

type Variant = 'client' | 'driver';

interface ScreenTopBarProps {
  variant: Variant;
  notificationCount?: number;
  showMenu?: boolean;
  /** Render for a coloured (purple) header: transparent bg, white controls. */
  onGradient?: boolean;
}

const ScreenTopBar = ({
  variant,
  notificationCount = 0,
  showMenu = true,
  onGradient = false,
}: ScreenTopBarProps) => {
  const navigation = useNavigation();
  const C = variant === 'driver' ? DriverColors : ClientColors;

  const iconColor = onGradient ? '#FFFFFF' : C.text;
  const suColor = onGradient ? '#FFFFFF' : C.text;

  return (
    <View
      style={[
        styles.bar,
        onGradient
          ? styles.barTransparent
          : { borderBottomColor: C.border, backgroundColor: C.surface, borderBottomWidth: 1 },
      ]}
    >
      {showMenu ? (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={12}
        >
          <Ionicons name="menu" size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <Text style={[styles.logo, { color: suColor }]}>
        Su<Text style={{ color: C.accent }}>CAR</Text>
      </Text>

      <TouchableOpacity hitSlop={12} style={styles.notifWrap}>
        <Ionicons name="notifications-outline" size={24} color={iconColor} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppLayout.screenPadding,
    paddingVertical: AppLayout.topBarPaddingV,
  },
  barTransparent: { backgroundColor: 'transparent' },
  spacer: { width: 24 },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  notifWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ClientColors.accent,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '700' },
});

export default ScreenTopBar;
