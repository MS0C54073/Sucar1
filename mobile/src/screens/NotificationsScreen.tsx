import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'booking' | 'system' | 'promo';
    read: boolean;
    created_at: string;
}

/**
 * Notifications list screen with read/unread states and pull-to-refresh.
 */
const NotificationsScreen = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await apiClient.get('/notifications');
            setNotifications(res.data.data || []);
        } catch {
            // If no endpoint yet, show empty state
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: string) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
            );
        } catch {
            // silent
        }
    };

    const iconForType = (type: string) => {
        switch (type) {
            case 'booking':
                return 'calendar-outline';
            case 'promo':
                return 'pricetag-outline';
            default:
                return 'notifications-outline';
        }
    };

    const colorForType = (type: string) => {
        switch (type) {
            case 'booking':
                return Colors.primary;
            case 'promo':
                return Colors.warning;
            default:
                return Colors.info;
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconWrap, { backgroundColor: `${colorForType(item.type)}15` }]}>
                <Ionicons name={iconForType(item.type) as any} size={22} color={colorForType(item.type)} />
            </View>
            <View style={styles.textWrap}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.read && styles.unreadText]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={styles.time}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    list: { padding: Spacing.md },
    emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    textWrap: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    title: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.textPrimary,
        flex: 1,
    },
    unreadText: { fontWeight: Typography.bold },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        marginLeft: Spacing.sm,
    },
    message: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    time: {
        fontSize: Typography.xs,
        color: Colors.textTertiary,
    },
    emptyContainer: { alignItems: 'center' },
    emptyTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
    },
    emptySubtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
});

export default NotificationsScreen;
