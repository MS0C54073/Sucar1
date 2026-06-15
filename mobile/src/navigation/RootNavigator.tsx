import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { isDriverApp, getRequiredRole } from '../config/appVariant';
import BootSplash from '../components/BootSplash';
import WrongRoleScreen from '../components/WrongRoleScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ClientDrawer from './ClientDrawer';
import DriverDrawer from './DriverDrawer';
import BookingScreen from '../screens/client/BookingScreen';
import ConfirmBookingScreen from '../screens/client/ConfirmBookingScreen';
import MyBookingsScreen from '../screens/client/MyBookingsScreen';
import VehicleListScreen from '../screens/client/VehicleListScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Colors, Typography } from '../constants/theme';
import { ClientColors, DriverColors } from '../constants/sucarTheme';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const driverApp = isDriverApp();
  const requiredRole = getRequiredRole();

  if (loading) {
    return <BootSplash />;
  }

  const headerBg = driverApp ? DriverColors.primary : ClientColors.primary;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: Typography.bold },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      ) : user.role !== requiredRole ? (
        <Stack.Screen name="WrongRole" options={{ headerShown: false }}>
          {() => <WrongRoleScreen actualRole={user.role} />}
        </Stack.Screen>
      ) : driverApp ? (
        <>
          <Stack.Screen name="Main" component={DriverDrawer} options={{ headerShown: false }} />
          <Stack.Screen
            name="BookingDetail"
            component={BookingDetailScreen}
            options={{ title: 'Job details', headerBackTitle: 'Back' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={ClientDrawer} options={{ headerShown: false }} />
          <Stack.Screen
            name="Booking"
            component={BookingScreen}
            options={{ title: 'New Booking', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="ConfirmBooking"
            component={ConfirmBookingScreen}
            options={{
              title: 'Confirm Booking',
              headerBackTitle: 'Back',
              headerStyle: { backgroundColor: ClientColors.primary },
            }}
          />
          <Stack.Screen
            name="MyBookings"
            component={MyBookingsScreen}
            options={{ title: 'My Bookings', headerBackTitle: 'Home' }}
          />
          <Stack.Screen
            name="VehicleList"
            component={VehicleListScreen}
            options={{ title: 'My Vehicles', headerBackTitle: 'Home' }}
          />
          <Stack.Screen
            name="BookingDetail"
            component={BookingDetailScreen}
            options={({ route }: any) => ({
              title: route.params?.tracking ? 'Track Your Service' : 'Booking Details',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: route.params?.tracking ? ClientColors.primary : ClientColors.primary,
              },
            })}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
