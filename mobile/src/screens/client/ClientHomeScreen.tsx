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
import CarWashCard, { CarWashListItem } from '../../components/ui/CarWashCard';
import { ClientColors } from '../../constants/sucarTheme';

const ClientHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('exterior');
  const [carWashes, setCarWashes] = useState<CarWashListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
      if (category === 'exterior') return true;
      const svc = (w.services || []).map((s) => (s.name || '').toLowerCase()).join(' ');
      if (category === 'full') return svc.includes('full') || svc.includes('detail');
      if (category === 'interior') return svc.includes('interior');
      if (category === 'eco') return svc.includes('eco');
      if (category === 'ev') return svc.includes('ev');
      return true;
    });
  }, [carWashes, searchQuery, category]);

  const openBook = (wash: CarWashListItem) => {
    navigation.navigate('Booking', { carWashId: wash.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          <Text style={styles.hello}>
            {greeting}, {firstName} 👋
          </Text>
          <Text style={styles.tagline}>Find a car wash near you</Text>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={ClientColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services or location..."
              placeholderTextColor={ClientColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </LinearGradient>

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Categories</Text>
        </View>
        <CategoryPills selected={category} onSelect={setCategory} />

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Nearby services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Booking')}>
            <Text style={styles.secLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={ClientColors.primary} style={{ marginVertical: 24 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No car washes found. Pull to refresh.</Text>
        ) : (
          filtered.map((w) => (
            <CarWashCard key={w.id} wash={w} onPress={() => openBook(w)} />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ClientColors.background },
  hero: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 22 },
  hello: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  tagline: { fontSize: 12, color: ClientColors.primaryLight, marginTop: 2, marginBottom: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: ClientColors.text },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  secTitle: { fontSize: 13, fontWeight: '600', color: ClientColors.text },
  secLink: { fontSize: 11, fontWeight: '500', color: ClientColors.primary },
  empty: { textAlign: 'center', color: ClientColors.textSecondary, marginVertical: 20, fontSize: 13 },
});

export default ClientHomeScreen;
