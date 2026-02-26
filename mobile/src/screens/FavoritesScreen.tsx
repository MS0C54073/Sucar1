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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

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
                    color={Colors.warning}
                />,
            );
        }
        return <View style={styles.starsRow}>{stars}</View>;
    };

    const renderItem = ({ item }: { item: FavoriteItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: `${Colors.warning}15` }]}>
                    <Ionicons name="car-sport-outline" size={24} color={Colors.warning} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {renderStars(item.rating)}
                </View>
                <TouchableOpacity onPress={() => removeFavorite(item.id)} activeOpacity={0.6}>
                    <Ionicons name="heart" size={24} color={Colors.error} />
                </TouchableOpacity>
            </View>
            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
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
            <Ionicons name="heart-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>Save your go-to carwash locations here</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
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
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
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
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    starsRow: { flexDirection: 'row', gap: 2 },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    address: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
    tagsRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    tag: {
        backgroundColor: `${Colors.primary}15`,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    tagText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },
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
        textAlign: 'center',
    },
});

export default FavoritesScreen;
