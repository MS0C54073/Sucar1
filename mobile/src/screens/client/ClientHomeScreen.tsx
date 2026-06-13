import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/api';
import CategoryPills from '../../components/ui/CategoryPills';
import ServicePackageCard from '../../components/ui/ServicePackageCard';
import CarWashCard, { CarWashListItem } from '../../components/ui/CarWashCard';
import QuickBookBlock from '../../components/ui/QuickBookBlock';
import ScreenTopBar from '../../components/layout/ScreenTopBar';
import { ClientColors, POPULAR_SERVICES, AppLayout } from '../../constants/sucarTheme';
import { useUserLocation, distanceKm, parseWashCoords } from '../../hooks/useUserLocation';

const ClientHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [carWashes, setCarWashes] = useState<CarWashListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const { coords: userCoords } = useUserLocation();

  const fetchWashes = async () => {
    try {
      const res = await apiClient.get('/carwash/list?includeServices=true');
      setCarWashes(res.data.data || []);
    } catch (e) {
      console.error('Car washes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWashes();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return carWashes.filter((w) => {
      const name = (w.carWashName || w.name || '').toLowerCase();
      const loc = (w.location || '').toLowerCase();
      if (q && !name.includes(q) && !loc.includes(q)) return false;
      if (category === 'all') return true;
      const svc = (w.services || []).map((s) => (s.name || '').toLowerCase()).join(' ');
      if (category === 'exterior') return svc.includes('wash') || svc.includes('exterior');
      if (category === 'full') return svc.includes('full') || svc.includes('detail');
      if (category === 'interior') return svc.includes('interior');
      return true;
    });
  }, [carWashes, searchQuery, category]);

  const featured = filtered[0];
  const featuredCoords = featured ? parseWashCoords(featured) : undefined;
  const featuredDistance =
    userCoords && featuredCoords
      ? `${distanceKm(userCoords, featuredCoords).toFixed(1)} km away`
      : 'Nearby';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTopBar variant="client" notificationCount={3} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWashes();
            }}
            tintColor={ClientColors.primary}
          />
        }
      >
        <LinearGradient colors={[ClientColors.primary, ClientColors.primaryDark]} style={styles.hero}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={ClientColors.primary} />
            </View>
            <View>
              <Text style={styles.hello}>Hello, {firstName}! ✨</Text>
              <Text style={styles.tagline}>Let's get your car sparkling clean!</Text>
            </View>
          </View>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={ClientColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for car wash near you"
              placeholderTextColor={ClientColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="options-outline" size={20} color={ClientColors.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Popular Services</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {POPULAR_SERVICES.map((s) => (
            <ServicePackageCard
              key={s.id}
              title={s.title}
              description={s.desc}
              price={s.price}
              icon={s.icon}
              iconColor={s.color}
              onPress={() => navigation.navigate('Booking')}
            />
          ))}
        </ScrollView>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Quick Book</Text>
          <TouchableOpacity onPress={() => featured && openBook(featured)}>
            <Text style={styles.secLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <QuickBookBlock
          washName={featured?.carWashName || featured?.name}
          distance={featuredDistance}
          rating={featured?.rating ? `${featured.rating.toFixed(1)}` : '4.8'}
          userLocation={userCoords}
          washLocation={featuredCoords}
          onBook={() => (featured ? openBook(featured) : navigation.navigate('Booking'))}
        />

        <View style={[styles.secHead, { marginTop: 8 }]}>
          <Text style={styles.secTitle}>Nearby Car Washes</Text>
        </View>
        <CategoryPills selected={category} onSelect={setCategory} />

        {loading ? (
          <ActivityIndicator color={ClientColors.primary} style={{ marginVertical: 24 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No car washes found. Pull to refresh.</Text>
        ) : (
          filtered.map((w) => <CarWashCard key={w.id} wash={w} onPress={() => openBook(w)} />)
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );

  function openBook(wash: CarWashListItem) {
    navigation.navigate('Booking', { carWashId: wash.id });
  }
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ClientColors.background },
  hero: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: AppLayout.heroAvatarSize,
    height: AppLayout.heroAvatarSize,
    borderRadius: AppLayout.heroAvatarSize / 2,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  tagline: { fontSize: 12, color: ClientColors.primaryLight, marginTop: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: ClientColors.text },
  hScroll: { paddingLeft: 16, paddingBottom: 8 },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  secTitle: { fontSize: AppLayout.sectionTitleSize, fontWeight: '700', color: ClientColors.text },
  secLink: { fontSize: 13, fontWeight: '600', color: ClientColors.primary },
  empty: { textAlign: 'center', color: ClientColors.textSecondary, marginVertical: 20, fontSize: 13 },
});

export default ClientHomeScreen;
