import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiClient, API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';
import CustomMapView from '../../components/MapView';
import { Coordinates } from '../../services/locationService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

/**
 * Screen for creating a new car wash booking.
 *
 * Loads car washes, services, drivers, and vehicles from the backend
 * and lets the client choose a pickup location using the LocationPicker.
 */
const BookingScreen = () => {
  const [carWashes, setCarWashes] = useState([]);
  const [services, setServices] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedCarWash, setSelectedCarWash] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | undefined>();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    fetchCarWashes();
    fetchDrivers();
    fetchVehicles();
  }, []);

  // Refetch vehicles when screen is focused (e.g. returning from Add Vehicle)
  useFocusEffect(
    React.useCallback(() => {
      fetchVehicles();
    }, [])
  );

  useEffect(() => {
    if (selectedCarWash) {
      fetchServices();
    }
  }, [selectedCarWash]);

  const fetchCarWashes = async () => {
    try {
      const response = await apiClient.get('/carwash/list');
      setCarWashes(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching car washes:', error);
      Alert.alert('Error', error?.message || 'Failed to load car washes');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await apiClient.get(`/carwash/services?carWashId=${selectedCarWash}`);
      setServices(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', error?.message || 'Failed to load services');
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await apiClient.get('/drivers/available');
      setDrivers(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', error?.message || 'Failed to load drivers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await apiClient.get('/vehicles');
      setVehicles(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', error?.message || 'Failed to load vehicles');
    }
  };

  const handleLocationSelect = (location: string, coordinates: Coordinates) => {
    setPickupLocation(location);
    setPickupCoordinates(coordinates);
    console.log('📍 Location selected:', location, coordinates);
  };

  const handleBooking = async () => {
    if (!selectedCarWash || !selectedService || !selectedVehicle || !pickupLocation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const bookingData: any = {
        carWashId: selectedCarWash,
        serviceId: selectedService,
        vehicleId: selectedVehicle,
        driverId: selectedDriver || undefined,
        pickupLocation,
      };

      // Add coordinates if available
      if (pickupCoordinates) {
        bookingData.pickupLatitude = pickupCoordinates.lat;
        bookingData.pickupLongitude = pickupCoordinates.lng;
      }

      const response = await apiClient.post('/bookings', bookingData);

      if (response.data.success) {
        Alert.alert('Success', 'Booking created successfully!');
        navigation.navigate('MyBookings' as never);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to create booking';
      Alert.alert('Error', errorMessage);
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.form}>
          <Animatable.View animation="fadeInDown" duration={700} useNativeDriver style={styles.header}>
            <Ionicons name="calendar-outline" size={28} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>New Booking</Text>
          </Animatable.View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} /> Select Car Wash *
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCarWash}
                onValueChange={setSelectedCarWash}
                style={styles.picker}
              >
                <Picker.Item label="Select Car Wash" value="" />
                {carWashes.map((wash: any) => (
                  <Picker.Item key={wash.id || wash._id} label={wash.carWashName || wash.name} value={wash.id || wash._id} />
                ))}
              </Picker>
            </View>

            {selectedCarWash && (
              <>
                <Text style={styles.label}>
                  <Ionicons name="sparkles-outline" size={16} color={theme.colors.textSecondary} /> Select Service *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedService}
                    onValueChange={setSelectedService}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Service" value="" />
                    {services.map((service: any) => (
                      <Picker.Item key={service.id || service._id} label={`${service.name} - K${service.price}`} value={service.id || service._id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <Ionicons name="car-sport-outline" size={16} color={theme.colors.textSecondary} /> Select Vehicle *
            </Text>
            {vehicles.length === 0 ? (
              <View style={styles.emptyVehicleCard}>
                <Text style={styles.emptyVehicleTitle}>No vehicles added yet</Text>
                <Text style={styles.emptyVehicleText}>
                  Add at least one vehicle in My Vehicles to create a booking. You can add your car details there and then return here to continue.
                </Text>
                <TouchableOpacity
                  style={styles.addVehicleButton}
                  onPress={() => navigation.navigate('VehicleList' as never)}
                >
                  <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Vehicle" value="" />
                  {vehicles.map((vehicle: any) => (
                    <Picker.Item key={vehicle.id || vehicle._id} label={`${vehicle.make} ${vehicle.model} - ${vehicle.plateNo}`} value={vehicle.id || vehicle._id} />
                  ))}
                </Picker>
              </View>
            )}

            <Text style={styles.label}>
              <Ionicons name="person-outline" size={16} color={Colors.textSecondary} /> Select Driver (Optional)
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDriver}
                onValueChange={setSelectedDriver}
                style={styles.picker}
              >
                <Picker.Item label="Auto Assign" value="" />
                {drivers.map((driver: any) => (
                  <Picker.Item key={driver.id || driver._id} label={driver.name} value={driver.id || driver._id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} /> Pickup Location *
            </Text>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={pickupLocation}
              initialCoordinates={pickupCoordinates}
            />

            {/* Map Preview */}
            {pickupCoordinates && (
              <View style={styles.mapContainer}>
                <Text style={styles.mapLabel}>Location Preview</Text>
                <CustomMapView
                  pickupLocation={pickupCoordinates}
                  height={200}
                />
              </View>
            )}
          </View>

          <Animatable.View animation="fadeInUp" duration={600} useNativeDriver>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }, vehicles.length === 0 && styles.buttonDisabled]}
              onPress={handleBooking}
              disabled={loading || vehicles.length === 0}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
                  <Text style={[styles.buttonText, { color: theme.colors.white }]}>Create Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  form: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  picker: {
    height: 50,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyVehicleCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  emptyVehicleTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyVehicleText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.base * Typography.lineHeight.normal,
    marginBottom: Spacing.md,
  },
  addVehicleButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addVehicleButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  mapContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mapLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
});

export default BookingScreen;
