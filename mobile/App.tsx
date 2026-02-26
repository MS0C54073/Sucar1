import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Auth screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Main app (Drawer + Tabs)
import MainDrawer from './src/navigation/MainDrawer';

// Detail screens (pushed on top of tabs)
import BookingScreen from './src/screens/client/BookingScreen';
import MyBookingsScreen from './src/screens/client/MyBookingsScreen';
import VehicleListScreen from './src/screens/client/VehicleListScreen';
import DriverBookingsScreen from './src/screens/driver/DriverBookingsScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';

import { Colors, Typography } from './src/constants/theme';

const Stack = createNativeStackNavigator();

/**
 * Inner navigator – switches between auth screens and the main app
 * depending on whether a user token is present.
 */
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Could show a splash screen here
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: Typography.bold },
      }}
    >
      {!user ? (
        // ---- Auth Stack ----
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // ---- App Stack (Drawer wraps Tabs) ----
        <>
          <Stack.Screen
            name="Main"
            component={MainDrawer}
            options={{ headerShown: false }}
          />
          {/* Detail screens pushed on top of the Tabs/Drawer */}
          <Stack.Screen
            name="Booking"
            component={BookingScreen}
            options={{ title: 'New Booking', headerBackTitle: 'Back' }}
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
            name="DriverBookings"
            component={DriverBookingsScreen}
            options={{ title: 'My Bookings', headerBackTitle: 'Home' }}
          />
          <Stack.Screen
            name="BookingDetail"
            component={BookingDetailScreen}
            options={{ title: 'Booking Details', headerBackTitle: 'Back' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

/**
 * Root mobile application component.
 * Provides authentication, theming, and the navigation container.
 */
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
