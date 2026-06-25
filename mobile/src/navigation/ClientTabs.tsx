import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ClientHomeScreen from '../screens/client/ClientHomeScreen';

import MyBookingsScreen from '../screens/client/MyBookingsScreen';

import VehicleListScreen from '../screens/client/VehicleListScreen';

import DealsMapScreen from '../screens/client/DealsMapScreen';

import ProfileScreen from '../screens/ProfileScreen';

import { tabBarScreenOptions, TabBarIcon } from './sharedTabBar';



const Tab = createBottomTabNavigator();



const CLIENT_ICONS: Record<string, [string, string]> = {

  HomeTab: ['home', 'home-outline'],

  BookingsTab: ['calendar', 'calendar-outline'],

  MyCarTab: ['car-sport', 'car-sport-outline'],

  DealsTab: ['shield-checkmark', 'shield-checkmark-outline'],

  ProfileTab: ['person', 'person-outline'],

};



const ClientTabs = () => (

  <Tab.Navigator

    screenOptions={({ route }) => ({

      ...tabBarScreenOptions('client'),

      tabBarIcon: ({ focused, color, size }) => (

        <TabBarIcon

          routeName={route.name}

          iconMap={CLIENT_ICONS}

          focused={focused}

          color={color}

          size={size}

          variant="client"

        />

      ),

    })}

  >

    <Tab.Screen name="HomeTab" component={ClientHomeScreen} options={{ title: 'Home' }} />

    <Tab.Screen name="BookingsTab" component={MyBookingsScreen} options={{ title: 'Bookings' }} />

    <Tab.Screen name="MyCarTab" component={VehicleListScreen} options={{ title: 'My Car' }} />

    <Tab.Screen name="DealsTab" component={DealsMapScreen} options={{ title: 'Nearby' }} />

    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />

  </Tab.Navigator>

);



export default ClientTabs;

