import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../../utils/api';
import { ClientColors } from '../../constants/sucarTheme';

export type ConfirmBookingParams = {
  carWashId: string;
  carWashName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  vehicleId: string;
  vehicleLabel: string;
  driverId?: string;
  driverName?: string;
  pickupLocation: string;
  pickupCoordinates?: { lat: number; lng: number };
};

const ConfirmBookingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params as ConfirmBookingParams;
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      const bookingData: Record<string, unknown> = {
        carWashId: params.carWashId,
        serviceId: params.serviceId,
        vehicleId: params.vehicleId,
        pickupLocation: params.pickupLocation,
        bookingType: 'pickup_delivery',
      };
      if (params.driverId) bookingData.driverId = params.driverId;
      if (params.pickupCoordinates) bookingData.pickupCoordinates = params.pickupCoordinates;

      const response = await apiClient.post('/bookings', bookingData);
      if (response.data.success) {
        Alert.alert('Booking confirmed', 'Your appointment has been scheduled.', [
          { text: 'View bookings', onPress: () => navigation.navigate('MyBookings') },
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || error?.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    { icon: 'car-sport-outline' as const, title: params.serviceName, sub: params.vehicleLabel, right: `K${params.servicePrice}` },
    { icon: 'business-outline' as const, title: params.carWashName, sub: 'Car wash location' },
    { icon: 'location-outline' as const, title: 'Pickup', sub: params.pickupLocation },
    ...(params.driverName
      ? [{ icon: 'person-outline' as const, title: params.driverName, sub: 'Assigned driver' }]
      : [{ icon: 'person-outline' as const, title: 'Auto assign', sub: 'Nearest available driver' }]),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Confirm Your Booking</Text>
        <Text style={styles.sub}>Please review your booking details and confirm</Text>

        {rows.map((r, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={r.icon} size={22} color={ClientColors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              {r.sub ? <Text style={styles.cardSub}>{r.sub}</Text> : null}
            </View>
            {'right' in r && r.right ? <Text style={styles.price}>{r.right}</Text> : null}
          </View>
        ))}

        <View style={styles.secure}>
          <Ionicons name="shield-checkmark-outline" size={20} color={ClientColors.primary} />
          <Text style={styles.secureText}>
            Your booking is secure. You can reschedule or cancel up to 2 hours before pickup.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.disabled]}
          onPress={confirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.confirmTxt}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ClientColors.background },
  content: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 22, fontWeight: '800', color: ClientColors.text },
  sub: { fontSize: 14, color: ClientColors.textSecondary, marginTop: 4, marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClientColors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ClientColors.border,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ClientColors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: ClientColors.primary },
  cardSub: { fontSize: 12, color: ClientColors.textSecondary, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '800', color: ClientColors.accent },
  secure: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: ClientColors.greenLight,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  secureText: { flex: 1, fontSize: 12, color: ClientColors.primaryDark, lineHeight: 18 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClientColors.accent,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmTxt: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});

export default ConfirmBookingScreen;
