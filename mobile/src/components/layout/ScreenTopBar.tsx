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
}

const ScreenTopBar = ({
  variant,
  notificationCount = 0,
  showMenu = true,
}: ScreenTopBarProps) => {
  const navigation = useNavigation();
  const C = variant === 'driver' ? DriverColors : ClientColors;

  return (
    <View style={[styles.bar, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
      {showMenu ? (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={12}
        >
          <Ionicons name="menu" size={24} color={C.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={[styles.logo, { color: C.primary }]}>SuCAR</Text>
      <TouchableOpacity hitSlop={12} style={styles.notifWrap}>
        <Ionicons name="notifications-outline" size={24} color={C.text} />
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
    borderBottomWidth: 1,
  },
  spacer: { width: 24 },
  logo: { fontSize: 20, fontWeight: '800' },
  notifWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ClientColors.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '700' },
});

export default ScreenTopBar;
