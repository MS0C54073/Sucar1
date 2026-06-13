import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import DriverTabs from './DriverTabs';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';

const Drawer = createDrawerNavigator();
const driverHeader = '#1a2332';
const driverAccent = '#3b82f6';

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
            <Ionicons name="car" size={32} color={Colors.white} />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Driver'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${driverAccent}30` }]}>
            <Text style={[styles.roleText, { color: driverAccent }]}>Driver</Text>
          </View>
        </View>
        <View style={styles.navItems}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
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
      headerStyle: { backgroundColor: driverHeader },
      headerTintColor: Colors.white,
      headerTitleStyle: { fontWeight: Typography.bold, fontSize: Typography.lg },
      drawerActiveTintColor: driverAccent,
      drawerInactiveTintColor: Colors.gray400,
      drawerStyle: { backgroundColor: '#0f1419' },
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
        drawerIcon: ({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="About"
      component={AboutScreen}
      options={{
        title: 'About SuCAR Driver',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="information-circle-outline" size={size} color={color} />
        ),
      }}
    />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerSafe: { flex: 1, backgroundColor: '#0f1419' },
  drawerScroll: { flex: 1 },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3544',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: driverAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  profileName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white },
  profileEmail: { fontSize: Typography.sm, color: Colors.gray400, marginBottom: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  roleText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  navItems: { flex: 1, paddingTop: Spacing.xs },
  bottomSection: { borderTopWidth: 1, borderTopColor: '#2a3544', padding: Spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  logoutText: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.error },
});

export default DriverDrawer;
