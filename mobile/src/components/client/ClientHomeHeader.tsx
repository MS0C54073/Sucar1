import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import SuCarLogo from '../brand/SuCarLogo';
import { BrandGradients, ClientColors, AppLayout } from '../../constants/sucarTheme';

interface ClientHomeHeaderProps {
  firstName: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notificationCount?: number;
}

const ClientHomeHeader = ({
  firstName,
  searchQuery,
  onSearchChange,
  notificationCount = 0,
}: ClientHomeHeaderProps) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...BrandGradients.header]}
      locations={[...BrandGradients.headerLocations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
    >
      {/* Decorative wave accents */}
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <SuCarLogo size={24} />

        <TouchableOpacity hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.profileRow}>
        <LinearGradient
          colors={[...BrandGradients.avatar]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={22} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.profileText}>
          <Text style={styles.hello}>Hello, {firstName}!</Text>
          <Text style={styles.tagline}>Let's get your car sparkling clean</Text>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={ClientColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for car wash near you"
          placeholderTextColor={ClientColors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity hitSlop={8}>
          <Ionicons name="options-outline" size={22} color={ClientColors.accent} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 8,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  decorA: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  decorB: {
    position: 'absolute',
    bottom: 40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconBtn: { padding: 4, position: 'relative' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: AppLayout.heroAvatarSize,
    height: AppLayout.heroAvatarSize,
    borderRadius: AppLayout.heroAvatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1 },
  hello: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: ClientColors.text },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
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

export default ClientHomeHeader;
