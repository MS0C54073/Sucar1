import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/theme';
import { ClientColors } from '../constants/sucarTheme';
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import MyBookingsScreen from '../screens/client/MyBookingsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ClientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const map: Record<string, [string, string]> = {
          HomeTab: ['home', 'home-outline'],
          ExploreTab: ['search', 'search-outline'],
          BookingsTab: ['calendar', 'calendar-outline'],
          ProfileTab: ['person', 'person-outline'],
        };
        const [on, off] = map[route.name] || ['ellipse', 'ellipse-outline'];
        return (
          <View style={focused ? styles.activeWrap : undefined}>
            {focused && <View style={styles.activeBar} />}
            <Ionicons
              name={(focused ? on : off) as keyof typeof Ionicons.glyphMap}
              size={size}
              color={color}
            />
          </View>
        );
      },
      tabBarActiveTintColor: ClientColors.tabActive,
      tabBarInactiveTintColor: ClientColors.tabInactive,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      headerShown: false,
    })}
  >
    <Tab.Screen name="HomeTab" component={ClientHomeScreen} options={{ title: 'Home' }} />
    <Tab.Screen name="ExploreTab" component={FavoritesScreen} options={{ title: 'Explore' }} />
    <Tab.Screen name="BookingsTab" component={MyBookingsScreen} options={{ title: 'Bookings' }} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: ClientColors.border,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: { fontSize: Typography.xs, fontWeight: '600' },
  activeWrap: { alignItems: 'center' },
  activeBar: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: ClientColors.primary,
  },
});

export default ClientTabs;
