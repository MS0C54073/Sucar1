import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/api';
import { Colors, Typography } from '../constants/theme';

// Screens
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import CarwashHomeScreen from '../screens/carwash/CarwashHomeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

const Tab = createBottomTabNavigator();

/**
 * Returns the correct Home screen component based on user role.
 */
const getHomeScreen = (role?: string) => {
    switch (role) {
        case 'driver':
            return DriverHomeScreen;
        case 'carwash':
            return CarwashHomeScreen;
        default:
            return ClientHomeScreen;
    }
};

/**
 * Returns the label for the Home tab based on user role.
 */
const getHomeLabel = (role?: string) => {
    switch (role) {
        case 'driver':
            return 'Dashboard';
        case 'carwash':
            return 'Queue';
        default:
            return 'Home';
    }
};

/**
 * Bottom Tab Navigator providing the four primary tabs:
 * Home (role-based), Notifications, Favorites, Profile.
 * Notifications tab shows a red badge when there are unread items.
 */
const MainTabs = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await apiClient.get('/notifications/unread-count');
            setUnreadCount(res.data.data?.count || 0);
        } catch {
            // endpoint may not exist yet
        }
    }, []);

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, [fetchUnread]);

    const HomeScreen = getHomeScreen(user?.role);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string = 'home-outline';

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                        if (user?.role === 'carwash') iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'NotificationsTab') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'FavoritesTab') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.gray400,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{ title: getHomeLabel(user?.role) }}
            />
            <Tab.Screen
                name="NotificationsTab"
                component={NotificationsScreen}
                options={{
                    title: 'Alerts',
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: styles.badge,
                }}
            />
            <Tab.Screen
                name="FavoritesTab"
                component={FavoritesScreen}
                options={{ title: 'Favorites' }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.white,
        borderTopWidth: 0,
        elevation: 12,
        shadowColor: Colors.shadowDark,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        height: 60,
        paddingBottom: 6,
        paddingTop: 4,
    },
    tabLabel: {
        fontSize: Typography.xs,
        fontWeight: Typography.medium,
    },
    badge: {
        backgroundColor: Colors.error,
        fontSize: 10,
        fontWeight: Typography.bold,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
    },
});

export default MainTabs;
