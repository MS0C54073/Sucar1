import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';

import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';

import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';

import DriverRatingsScreen from '../screens/driver/DriverRatingsScreen';

import ProfileScreen from '../screens/ProfileScreen';

import { tabBarScreenOptions, TabBarIcon } from './sharedTabBar';



const Tab = createBottomTabNavigator();



const DRIVER_ICONS: Record<string, [string, string]> = {

  DashboardTab: ['home', 'home-outline'],

  JobsTab: ['car-sport', 'car-sport-outline'],

  EarningsTab: ['cash', 'cash-outline'],

  RatingsTab: ['star', 'star-outline'],

  ProfileTab: ['person', 'person-outline'],

};



const DriverTabs = () => (

  <Tab.Navigator

    screenOptions={({ route }) => ({

      ...tabBarScreenOptions('driver'),

      tabBarIcon: ({ focused, color, size }) => (

        <TabBarIcon

          routeName={route.name}

          iconMap={DRIVER_ICONS}

          focused={focused}

          color={color}

          size={size}

          variant="driver"

        />

      ),

    })}

  >

    <Tab.Screen name="DashboardTab" component={DriverHomeScreen} options={{ title: 'Home' }} />

    <Tab.Screen name="JobsTab" component={DriverBookingsScreen} options={{ title: 'Jobs' }} />

    <Tab.Screen name="EarningsTab" component={DriverEarningsScreen} options={{ title: 'Earnings' }} />

    <Tab.Screen name="RatingsTab" component={DriverRatingsScreen} options={{ title: 'Ratings' }} />

    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />

  </Tab.Navigator>

);



export default DriverTabs;

