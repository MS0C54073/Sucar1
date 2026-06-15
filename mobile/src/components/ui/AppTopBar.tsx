import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

type Variant = 'client' | 'driver';

interface AppTopBarProps {
  variant: Variant;
  notificationCount?: number;
  showMenu?: boolean;
  style?: ViewStyle;
  light?: boolean;
}

const AppTopBar = ({
  variant,
  notificationCount = 0,
  showMenu = variant === 'driver',
  style,
  light = variant === 'client',
}: AppTopBarProps) => {
  const navigation = useNavigation();
  const textColor = light ? '#FFFFFF' : '#FFFFFF';
  const iconColor = light ? '#FFFFFF' : '#FFFFFF';

  return (
    <View style={[styles.row, style]}>
      {showMenu ? (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.iconBtn}
          hitSlop={12}
        >
          <Ionicons name="menu" size={26} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={light ? '#7C3AED' : '#6D28D9'} />
        </View>
      )}

      <View style={styles.brand}>
        <Image source={require('../../../assets/Sucarcar.jpeg')} style={styles.logo} />
        <Text style={[styles.brandText, { color: textColor }]}>
          SuCAR{variant === 'driver' ? '' : ''}
        </Text>
        {variant === 'client' && (
          <Ionicons name="sparkles" size={14} color="#C4B5FD" style={styles.sparkle} />
        )}
      </View>

      <TouchableOpacity style={styles.iconBtn} hitSlop={12}>
        <Ionicons name="notifications-outline" size={24} color={iconColor} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: { width: 28, height: 28, borderRadius: 6, marginRight: 6 },
  brandText: { fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
  sparkle: { marginLeft: 2, marginTop: -8 },
  iconBtn: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});

export default AppTopBar;
