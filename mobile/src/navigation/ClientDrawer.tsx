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
import ClientTabs from './ClientTabs';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';

const Drawer = createDrawerNavigator();

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
            <Ionicons name="person" size={32} color={Colors.white} />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Client'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${Colors.primary}20` }]}>
            <Text style={[styles.roleText, { color: Colors.primary }]}>Client</Text>
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

const ClientDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: Colors.white,
      headerTitleStyle: { fontWeight: Typography.bold, fontSize: Typography.lg },
      drawerActiveTintColor: Colors.primary,
      drawerInactiveTintColor: Colors.textSecondary,
    }}
  >
    <Drawer.Screen
      name="Dashboard"
      component={ClientTabs}
      options={{
        title: 'SuCAR',
        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
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
        title: 'About SuCAR',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="information-circle-outline" size={size} color={color} />
        ),
      }}
    />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerSafe: { flex: 1 },
  drawerScroll: { flex: 1 },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  profileName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  profileEmail: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  roleText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  navItems: { flex: 1, paddingTop: Spacing.xs },
  bottomSection: { borderTopWidth: 1, borderTopColor: Colors.borderLight, padding: Spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  logoutText: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.error },
});

export default ClientDrawer;
