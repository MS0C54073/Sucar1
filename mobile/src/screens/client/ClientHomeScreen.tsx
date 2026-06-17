import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/api';
import CategoryPills from '../../components/ui/CategoryPills';
import ServicePackageCard from '../../components/ui/ServicePackageCard';
import CarWashCard, { CarWashListItem } from '../../components/ui/CarWashCard';
import QuickBookBlock from '../../components/ui/QuickBookBlock';
import ClientHomeHeader from '../../components/client/ClientHomeHeader';
import { ClientColors, POPULAR_SERVICES, AppLayout } from '../../constants/sucarTheme';
import { useUserLocation, distanceKm, parseWashCoords } from '../../hooks/useUserLocation';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

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
  const unreadCount = useUnreadNotifications();

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
      const svcText = (w.services || [])
        .map((s) => (s.name || '').toLowerCase())
        .join(' ');
      if (q && !name.includes(q) && !loc.includes(q) && !svcText.includes(q)) return false;
      if (category === 'all') return true;
      const svc = (w.services || []).map((s) => (s.name || '').toLowerCase()).join(' ');
      if (category === 'exterior') return svc.includes('wash') || svc.includes('exterior');
      if (category === 'interior') return svc.includes('interior');
      if (category === 'premium') return svc.includes('premium') || svc.includes('detail');
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
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
        <ClientHomeHeader
          firstName={firstName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notificationCount={unreadCount}
        />

        <View style={styles.body}>
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
                iconBg={s.bg}
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

          <View style={[styles.secHead, { marginTop: 12 }]}>
            <Text style={styles.secTitle}>Nearby Car Washes</Text>
          </View>
          <CategoryPills selected={category} onSelect={setCategory} />

          {loading ? (
            <ActivityIndicator color={ClientColors.primary} style={{ marginVertical: 24 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>
              {searchQuery.trim()
                ? `No car washes match "${searchQuery.trim()}".`
                : 'No car washes found. Pull to refresh.'}
            </Text>
          ) : (
            filtered.map((w) => <CarWashCard key={w.id} wash={w} onPress={() => openBook(w)} />)
          )}
        </View>
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
  body: { backgroundColor: ClientColors.background },
  hScroll: { paddingLeft: AppLayout.screenPadding, paddingBottom: 4 },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 20,
    paddingBottom: 12,
  },
  secTitle: { fontSize: 17, fontWeight: '700', color: ClientColors.text },
  secLink: { fontSize: 14, fontWeight: '600', color: ClientColors.accent },
  empty: { textAlign: 'center', color: ClientColors.textSecondary, marginVertical: 20, fontSize: 13 },
});

export default ClientHomeScreen;
