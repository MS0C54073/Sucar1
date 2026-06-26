import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../utils/api';
import GradientBackground from '../../components/common/GradientBackground';
import StatCard from '../../components/common/StatCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows, StatusColors } from '../../constants/theme';

type TabKey = 'pending' | 'in_progress' | 'done';

interface QueueItem {
    id: string;
    vehicleId?: { make?: string; model?: string; plateNo?: string };
    clientId?: { name?: string };
    carWashId?: { carWashName?: string; name?: string };
    status: string;
    bookingType?: string;
    paymentStatus?: string;
    totalAmount?: number;
    createdAt?: string;
    created_at?: string;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'in_progress', label: 'In Progress', icon: 'water-outline' },
    { key: 'done', label: 'Done', icon: 'checkmark-circle-outline' },
];

const statusGroupMap: Record<TabKey, string[]> = {
    pending: ['pending', 'accepted', 'picked_up', 'picked_up_pending_confirmation', 'delivered_to_wash', 'waiting_bay'],
    in_progress: ['at_wash', 'washing_bay', 'drying_bay'],
    done: ['wash_completed', 'delivered', 'delivered_to_client', 'completed'],
};

/**
 * Carwash owner dashboard with queue management tabs and action buttons.
 * Implements full car wash workflow: confirm arrival, start washing, move to drying,
 * complete service, and confirm payment.
 */
const CarwashHomeScreen = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('pending');
    const [allBookings, setAllBookings] = useState<QueueItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        try {
            const res = await apiClient.get('/bookings');
            const bookings = (res.data.data || []).map((b: any) => ({
                id: b._id || b.id,
                vehicleId: b.vehicleId || b.vehicle,
                clientId: b.clientId || b.client,
                carWashId: b.carWashId || b.carWash,
                status: b.status,
                bookingType: b.bookingType || b.booking_type,
                paymentStatus: b.paymentStatus || b.payment_status,
                totalAmount: b.totalAmount || b.total_amount,
                createdAt: b.createdAt || b.created_at,
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

    const handleStatusUpdate = (bookingId: string, status: string, confirmMsg: string) => {
        Alert.alert('Confirm', confirmMsg, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                onPress: async () => {
                    setActionLoading(bookingId);
                    try {
                        const response = await apiClient.put(`/bookings/${bookingId}/status`, { status });
                        if (response.data.success !== false) {
                            Alert.alert('Success', 'Status updated');
                            fetchBookings();
                        } else {
                            Alert.alert('Error', response.data.message || 'Failed to update');
                        }
                    } catch (error: any) {
                        Alert.alert('Error', error?.message || 'Failed to update status');
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const handleConfirmPayment = (bookingId: string) => {
        Alert.alert('Confirm Payment', 'Confirm that payment has been received?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                onPress: async () => {
                    setActionLoading(bookingId);
                    try {
                        const response = await apiClient.post('/payments/confirm', { bookingId });
                        if (response.data.success !== false) {
                            Alert.alert('Success', 'Payment confirmed');
                            fetchBookings();
                        } else {
                            Alert.alert('Error', response.data.message || 'Failed to confirm payment');
                        }
                    } catch (error: any) {
                        Alert.alert('Error', error?.message || 'Failed to confirm payment');
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
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

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pending',
            accepted: 'Accepted',
            picked_up: 'Picked Up',
            picked_up_pending_confirmation: 'Awaiting Confirmation',
            delivered_to_wash: 'Delivered to Wash',
            waiting_bay: 'Waiting',
            at_wash: 'At Wash',
            washing_bay: 'Washing',
            drying_bay: 'Drying',
            wash_completed: 'Completed',
            delivered: 'Delivered',
            delivered_to_client: 'Delivered',
            completed: 'Completed',
        };
        return labels[status] || status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const renderActions = (item: QueueItem) => {
        const status = item.status;
        const isLoading = actionLoading === item.id;

        if (isLoading) {
            return <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.sm }} />;
        }

        const actions: JSX.Element[] = [];

        // Confirm arrival (delivered_to_wash or waiting_bay)
        if (['delivered_to_wash', 'waiting_bay'].includes(status)) {
            actions.push(
                <TouchableOpacity
                    key="arrival"
                    style={[styles.actionBtn, { backgroundColor: Colors.info }]}
                    onPress={() => handleStatusUpdate(item.id, 'at_wash', 'Confirm vehicle arrival at car wash?')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="enter-outline" size={14} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Confirm Arrival</Text>
                </TouchableOpacity>
            );
        }

        // Start washing (delivered_to_wash, waiting_bay, or at_wash)
        if (['delivered_to_wash', 'waiting_bay', 'at_wash'].includes(status)) {
            actions.push(
                <TouchableOpacity
                    key="wash"
                    style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => handleStatusUpdate(item.id, 'washing_bay', 'Move to washing bay?')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="water-outline" size={14} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Start Washing</Text>
                </TouchableOpacity>
            );
        }

        // Move to drying
        if (status === 'washing_bay') {
            actions.push(
                <TouchableOpacity
                    key="dry"
                    style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => handleStatusUpdate(item.id, 'drying_bay', 'Move to drying bay?')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="sunny-outline" size={14} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Move to Drying</Text>
                </TouchableOpacity>
            );
        }

        // Complete service
        if (status === 'drying_bay') {
            actions.push(
                <TouchableOpacity
                    key="complete"
                    style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => handleStatusUpdate(item.id, 'wash_completed', 'Mark service as completed?')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="checkmark-done-circle-outline" size={14} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Complete</Text>
                </TouchableOpacity>
            );
        }

        // Confirm payment
        if (['wash_completed', 'delivered_to_client', 'delivered'].includes(status) && item.paymentStatus === 'pending') {
            actions.push(
                <TouchableOpacity
                    key="payment"
                    style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => handleConfirmPayment(item.id)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="card-outline" size={14} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Confirm Payment</Text>
                </TouchableOpacity>
            );
        }

        if (actions.length === 0) return null;

        return <View style={styles.actionsRow}>{actions}</View>;
    };

    const renderItem = ({ item }: { item: QueueItem }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={[styles.statusDot, { backgroundColor: StatusColors[item.status] || Colors.gray400 }]} />
                <View style={styles.cardContent}>
                    <Text style={styles.vehicleText}>
                        {item.vehicleId?.make || 'Unknown'} {item.vehicleId?.model || ''}
                    </Text>
                    <Text style={styles.plateText}>{item.vehicleId?.plateNo || ''}</Text>
                    <Text style={styles.clientText}>{item.clientId?.name || 'Client'}</Text>
                </View>
                <View style={styles.cardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: StatusColors[item.status] || Colors.gray400 }]}>
                        <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
                    </View>
                    <Text style={styles.timeText}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                </View>
            </View>
            {renderActions(item)}
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
    cardRight: { alignItems: 'flex-end', gap: Spacing.xs },
    vehicleText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
    plateText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
    clientText: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    statusBadgeText: { fontSize: Typography.xs, color: Colors.white, fontWeight: Typography.semibold },
    timeText: { fontSize: Typography.xs, color: Colors.textTertiary },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.md,
        gap: 4,
    },
    actionBtnText: { fontSize: Typography.xs, color: Colors.white, fontWeight: Typography.semibold },
    emptyContainer: { alignItems: 'center' },
    emptyTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: Spacing.md },
    emptySubtitle: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
});

export default CarwashHomeScreen;
