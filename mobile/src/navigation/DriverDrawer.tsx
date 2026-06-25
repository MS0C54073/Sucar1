import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {

  createDrawerNavigator,

  DrawerContentScrollView,

  DrawerItemList,

  DrawerContentComponentProps,

} from '@react-navigation/drawer';

import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

import { Typography, Spacing, BorderRadius } from '../constants/theme';

import { ClientColors, DriverColors } from '../constants/sucarTheme';

import DriverTabs from './DriverTabs';

import HelpScreen from '../screens/HelpScreen';

import AboutScreen from '../screens/AboutScreen';



const Drawer = createDrawerNavigator();

const C = DriverColors;



const CustomDrawerContent = (props: DrawerContentComponentProps) => {

  const { user, logout } = useAuth();



  const handleLogout = () => {

    Alert.alert('Logout', 'Are you sure you want to logout?', [

      { text: 'Cancel', style: 'cancel' },

      { text: 'Logout', style: 'destructive', onPress: () => logout() },

    ]);

  };



  return (

    <SafeAreaView style={styles.drawerSafe}>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>

        <View style={styles.profileSection}>

          <View style={styles.avatarCircle}>

            <Ionicons name="car" size={32} color="#FFF" />

          </View>

          <Text style={styles.profileName}>{user?.name || 'Driver'}</Text>

          <Text style={styles.profileEmail}>{user?.email}</Text>

          <View style={styles.roleBadge}>

            <Text style={styles.roleText}>Driver</Text>

          </View>

        </View>

        <View style={styles.navItems}>

          <DrawerItemList {...props} />

        </View>

      </DrawerContentScrollView>

      <View style={styles.bottomSection}>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>

          <Ionicons name="log-out-outline" size={20} color={C.error} />

          <Text style={styles.logoutText}>Logout</Text>

        </TouchableOpacity>

      </View>

    </SafeAreaView>

  );

};



const DriverDrawer = () => (

  <Drawer.Navigator

    drawerContent={(props) => <CustomDrawerContent {...props} />}

    screenOptions={{

      headerShown: false,

      drawerActiveTintColor: C.primary,

      drawerInactiveTintColor: C.textSecondary,

      drawerStyle: { backgroundColor: C.surface },

    }}

  >

    <Drawer.Screen

      name="Dashboard"

      component={DriverTabs}

      options={{

        title: 'SuCAR Driver',

        drawerIcon: ({ color, size }) => <Ionicons name="speedometer-outline" size={size} color={color} />,

      }}

    />

    <Drawer.Screen

      name="Help"

      component={HelpScreen}

      options={{

        title: 'Help & Support',

        headerShown: true,

        headerStyle: { backgroundColor: C.primary },

        headerTintColor: '#FFF',

        drawerIcon: ({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />,

      }}

    />

    <Drawer.Screen

      name="About"

      component={AboutScreen}

      options={{

        title: 'About SuCAR',

        headerShown: true,

        headerStyle: { backgroundColor: C.primary },

        headerTintColor: '#FFF',

        drawerIcon: ({ color, size }) => (

          <Ionicons name="information-circle-outline" size={size} color={color} />

        ),

      }}

    />

  </Drawer.Navigator>

);



const styles = StyleSheet.create({

  drawerSafe: { flex: 1, backgroundColor: C.surface },

  drawerScroll: { flex: 1 },

  profileSection: {

    alignItems: 'center',

    paddingVertical: Spacing.xl,

    paddingHorizontal: Spacing.lg,

    borderBottomWidth: 1,

    borderBottomColor: C.border,

    marginBottom: Spacing.sm,

  },

  avatarCircle: {

    width: 72,

    height: 72,

    borderRadius: 36,

    backgroundColor: C.primary,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: Spacing.md,

  },

  profileName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: C.text },

  profileEmail: { fontSize: Typography.sm, color: C.textSecondary, marginBottom: Spacing.sm },

  roleBadge: {

    paddingHorizontal: Spacing.md,

    paddingVertical: 4,

    borderRadius: BorderRadius.full,

    backgroundColor: `${C.primary}18`,

  },

  roleText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: C.primary },

  navItems: { flex: 1, paddingTop: Spacing.xs },

  bottomSection: { borderTopWidth: 1, borderTopColor: C.border, padding: Spacing.md },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },

  logoutText: { fontSize: Typography.base, fontWeight: Typography.medium, color: C.error },

});



export default DriverDrawer;

