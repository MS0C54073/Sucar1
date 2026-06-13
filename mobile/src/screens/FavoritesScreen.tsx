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
import { apiClient } from '../utils/api';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { ClientColors, AppLayout } from '../constants/sucarTheme';
import TabPageHeader from '../components/layout/TabPageHeader';

interface FavoriteItem {
    id: string;
    name: string;
    address: string;
    rating: number;
    services: string[];
}

/**
 * Displays the user's saved/favourite carwash locations.
 */
const FavoritesScreen = () => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = useCallback(async () => {
        try {
            const res = await apiClient.get('/favorites');
            setFavorites(res.data.data || []);
        } catch {
            setFavorites([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFavorites();
    };

    const removeFavorite = async (id: string) => {
        try {
            await apiClient.delete(`/favorites/${id}`);
            setFavorites((prev) => prev.filter((f) => f.id !== id));
        } catch {
            // silent
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={14}
                    color={ClientColors.accent}
                />,
            );
        }
        return <View style={styles.starsRow}>{stars}</View>;
    };

    const renderItem = ({ item }: { item: FavoriteItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: ClientColors.purpleLight }]}>
                    <Ionicons name="car-sport-outline" size={24} color={ClientColors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {renderStars(item.rating)}
                </View>
                <TouchableOpacity onPress={() => removeFavorite(item.id)} activeOpacity={0.6}>
                    <Ionicons name="heart" size={24} color={ClientColors.error} />
                </TouchableOpacity>
            </View>
            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={ClientColors.textSecondary} />
                <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
            </View>
            {item.services?.length > 0 && (
                <View style={styles.tagsRow}>
                    {item.services.slice(0, 3).map((s, i) => (
                        <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{s}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={ClientColors.textMuted} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>Save your go-to carwash locations here</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <TabPageHeader title="Deals" subtitle="Your saved car wash locations" />
            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ClientColors.primary} />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: ClientColors.background },
    list: { padding: AppLayout.screenPadding },
    emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    card: {
        backgroundColor: ClientColors.surface,
        padding: Spacing.md,
        borderRadius: AppLayout.cardRadius,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: ClientColors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    headerText: { flex: 1 },
    name: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: ClientColors.text,
        marginBottom: 2,
    },
    starsRow: { flexDirection: 'row', gap: 2 },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    address: { fontSize: Typography.sm, color: ClientColors.textSecondary, flex: 1 },
    tagsRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    tag: {
        backgroundColor: ClientColors.greenLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    tagText: { fontSize: Typography.xs, color: ClientColors.primary, fontWeight: Typography.medium },
    emptyContainer: { alignItems: 'center' },
    emptyTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: ClientColors.text,
        marginTop: Spacing.md,
    },
    emptySubtitle: {
        fontSize: Typography.base,
        color: ClientColors.textSecondary,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
});

export default FavoritesScreen;
