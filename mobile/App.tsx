import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import ClientHomeScreen from './src/screens/client/ClientHomeScreen';
import DriverHomeScreen from './src/screens/driver/DriverHomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BookingScreen from './src/screens/client/BookingScreen';
import MyBookingsScreen from './src/screens/client/MyBookingsScreen';
import VehicleListScreen from './src/screens/client/VehicleListScreen';
import DriverBookingsScreen from './src/screens/driver/DriverBookingsScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

/**
 * Root mobile application component.
 *
 * Wraps the app in the authentication provider and sets up the main
 * stack navigator for all auth, client, and driver screens.
 */
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#667eea',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {/* Auth screens - no header */}
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
          
          {/* Home screens - no header (custom header in component) */}
          <Stack.Screen 
            name="ClientHome" 
            component={ClientHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="DriverHome" 
            component={DriverHomeScreen}
            options={{ headerShown: false }}
          />
          
          {/* Other screens - with header and back button */}
          <Stack.Screen 
            name="Booking" 
            component={BookingScreen}
            options={{ 
              title: 'New Booking',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen 
            name="MyBookings" 
            component={MyBookingsScreen}
            options={{ 
              title: 'My Bookings',
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen 
            name="VehicleList" 
            component={VehicleListScreen}
            options={{ 
              title: 'My Vehicles',
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen 
            name="DriverBookings" 
            component={DriverBookingsScreen}
            options={{ 
              title: 'My Bookings',
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen 
            name="BookingDetail" 
            component={BookingDetailScreen}
            options={{ 
              title: 'Booking Details',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ 
              title: 'Profile',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
