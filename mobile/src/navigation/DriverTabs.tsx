import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/theme';
import { DriverColors } from '../constants/sucarTheme';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const DriverTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const map: Record<string, [string, string]> = {
          JobsTab: ['list', 'list-outline'],
          MapTab: ['map', 'map-outline'],
          EarningsTab: ['cash', 'cash-outline'],
          ProfileTab: ['person', 'person-outline'],
        };
        const [on, off] = map[route.name] || ['ellipse', 'ellipse-outline'];
        return (
          <Ionicons
            name={(focused ? on : off) as keyof typeof Ionicons.glyphMap}
            size={size}
            color={color}
          />
        );
      },
      tabBarActiveTintColor: DriverColors.tabActive,
      tabBarInactiveTintColor: DriverColors.textMuted,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      headerShown: false,
    })}
  >
    <Tab.Screen name="JobsTab" component={DriverHomeScreen} options={{ title: 'Jobs' }} />
    <Tab.Screen name="MapTab" component={DriverBookingsScreen} options={{ title: 'Map' }} />
    <Tab.Screen name="EarningsTab" component={DriverEarningsScreen} options={{ title: 'Earnings' }} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: DriverColors.tabBar,
    borderTopWidth: 1,
    borderTopColor: DriverColors.border,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: { fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase' },
});

export default DriverTabs;
