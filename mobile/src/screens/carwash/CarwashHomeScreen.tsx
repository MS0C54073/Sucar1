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
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../utils/api';
import GradientBackground from '../../components/common/GradientBackground';
import StatCard from '../../components/common/StatCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

type TabKey = 'pending' | 'in_progress' | 'done';

interface QueueItem {
    id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_plate: string;
    client_name: string;
    status: string;
    created_at: string;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'in_progress', label: 'In Progress', icon: 'water-outline' },
    { key: 'done', label: 'Done', icon: 'checkmark-circle-outline' },
];

const statusGroupMap: Record<TabKey, string[]> = {
    pending: ['pending', 'accepted', 'picked_up'],
    in_progress: ['at_wash', 'washing_bay', 'drying_bay'],
    done: ['wash_completed', 'completed', 'delivered'],
};

/**
 * Carwash owner dashboard with queue management tabs.
 */
const CarwashHomeScreen = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('pending');
    const [allBookings, setAllBookings] = useState<QueueItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        try {
            const res = await apiClient.get('/bookings');
            const bookings = (res.data.data || []).map((b: any) => ({
                id: b._id || b.id,
                vehicle_make: b.vehicle?.make || 'Unknown',
                vehicle_model: b.vehicle?.model || '',
                vehicle_plate: b.vehicle?.plate_number || '',
                client_name: b.client?.name || 'Client',
                status: b.status,
                created_at: b.created_at,
            }));
            setAllBookings(bookings);
        } catch {
            setAllBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const filtered = allBookings.filter((b) =>
        statusGroupMap[activeTab].includes(b.status),
    );

    const counts = {
        pending: allBookings.filter((b) => statusGroupMap.pending.includes(b.status)).length,
        in_progress: allBookings.filter((b) => statusGroupMap.in_progress.includes(b.status)).length,
        done: allBookings.filter((b) => statusGroupMap.done.includes(b.status)).length,
    };

    const statusColor = (tab: TabKey) => {
        switch (tab) {
            case 'pending': return Colors.warning;
            case 'in_progress': return Colors.info;
            case 'done': return Colors.success;
        }
    };

    const renderItem = ({ item }: { item: QueueItem }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(activeTab) }]} />
                <View style={styles.cardContent}>
                    <Text style={styles.vehicleText}>
                        {item.vehicle_make} {item.vehicle_model}
                    </Text>
                    <Text style={styles.plateText}>{item.vehicle_plate}</Text>
                    <Text style={styles.clientText}>{item.client_name}</Text>
                </View>
                <Text style={styles.timeText}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name={activeTab === 'done' ? 'checkmark-done-circle-outline' : 'car-outline'}
                size={64}
                color={Colors.gray300}
            />
            <Text style={styles.emptyTitle}>
                {activeTab === 'done' ? 'No completed jobs' : 'Queue is empty'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                    ? 'New bookings will appear here'
                    : activeTab === 'in_progress'
                        ? 'Move pending bookings to start washing'
                        : 'Completed jobs will show here'}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <GradientBackground style={styles.header}>
                <Animatable.View animation="fadeInDown" duration={700} useNativeDriver>
                    <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
                        Welcome back,
                    </Text>
                    <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                        {user?.name?.split(' ')[0] || 'Carwash'}
                    </Text>
                </Animatable.View>
            </GradientBackground>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <StatCard title="Pending" value={counts.pending} icon="time-outline" iconColor={Colors.warning} />
                <StatCard title="Active" value={counts.in_progress} icon="water-outline" iconColor={Colors.info} />
                <StatCard title="Done" value={counts.done} icon="checkmark-circle-outline" iconColor={Colors.success} />
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={18}
                            color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
                        />
                        <Text
                            style={[
                                styles.tabLabel,
                                activeTab === tab.key && styles.activeTabLabel,
                            ]}
                        >
                            {tab.label}
                        </Text>
                        {counts[tab.key] > 0 && (
                            <View style={[styles.tabBadge, { backgroundColor: statusColor(tab.key) }]}>
                                <Text style={styles.tabBadgeText}>{counts[tab.key]}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Queue List */}
            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
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
    header: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg,
        borderBottomLeftRadius: BorderRadius['2xl'],
        borderBottomRightRadius: BorderRadius['2xl'],
    },
    greeting: { fontSize: Typography.base, color: Colors.white, opacity: 0.9 },
    userName: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.white },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginTop: -Spacing.md,
        marginBottom: Spacing.md,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xs,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.md,
        gap: 4,
    },
    activeTab: { backgroundColor: `${Colors.primary}12` },
    tabLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
    activeTabLabel: { color: Colors.primary, fontWeight: Typography.bold },
    tabBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        marginLeft: 2,
    },
    tabBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
    list: { padding: Spacing.md },
    emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    card: {
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
    cardContent: { flex: 1 },
    vehicleText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
    plateText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
    clientText: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
    timeText: { fontSize: Typography.sm, color: Colors.textSecondary },
    emptyContainer: { alignItems: 'center' },
    emptyTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: Spacing.md },
    emptySubtitle: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
});

export default CarwashHomeScreen;
