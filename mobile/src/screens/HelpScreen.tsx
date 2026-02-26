import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface HelpItem {
    icon: string;
    title: string;
    description: string;
    action?: () => void;
}

/**
 * Static help & support screen with FAQ items and contact info.
 */
const HelpScreen = () => {
    const helpItems: HelpItem[] = [
        {
            icon: 'book-outline',
            title: 'How to Book a Wash',
            description: 'Tap the "New Booking" button on the Home screen, select your vehicle, choose a carwash, and confirm the pickup location.',
        },
        {
            icon: 'car-outline',
            title: 'Managing Vehicles',
            description: 'Navigate to "My Vehicles" to add, edit, or remove your registered vehicles from your account.',
        },
        {
            icon: 'time-outline',
            title: 'Tracking Your Order',
            description: 'View real-time status updates in "My Bookings". You will receive notifications at every stage of the process.',
        },
        {
            icon: 'card-outline',
            title: 'Payment & Billing',
            description: 'Payments are processed after the wash is completed. View receipts and transaction history in your profile.',
        },
        {
            icon: 'chatbubble-ellipses-outline',
            title: 'Contact Support',
            description: 'Need help? Reach us via email or phone for immediate assistance.',
            action: () => Linking.openURL('mailto:support@sucar.app'),
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.heroIcon}>
                        <Ionicons name="help-buoy-outline" size={48} color={Colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>How can we help?</Text>
                    <Text style={styles.heroSubtitle}>Find answers to common questions below</Text>
                </View>

                {helpItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        activeOpacity={item.action ? 0.7 : 1}
                        onPress={item.action}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: `${Colors.primary}12` }]}>
                            <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                        </View>
                        <View style={styles.textWrap}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                        {item.action && (
                            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                        )}
                    </TouchableOpacity>
                ))}

                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Still need help?</Text>
                    <View style={styles.contactRow}>
                        <TouchableOpacity
                            style={styles.contactBtn}
                            onPress={() => Linking.openURL('mailto:support@sucar.app')}
                        >
                            <Ionicons name="mail-outline" size={20} color={Colors.white} />
                            <Text style={styles.contactBtnText}>Email Us</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.contactBtn, styles.contactBtnAlt]}
                            onPress={() => Linking.openURL('tel:+260971234567')}
                        >
                            <Ionicons name="call-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.contactBtnText, styles.contactBtnTextAlt]}>Call Us</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    heroSection: { alignItems: 'center', marginBottom: Spacing.xl },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${Colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    heroTitle: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    heroSubtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
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
    title: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    description: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    contactSection: { marginTop: Spacing.xl, alignItems: 'center' },
    contactTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    contactRow: { flexDirection: 'row', gap: Spacing.md },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.sm + 4,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    contactBtnAlt: {
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    contactBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.white,
    },
    contactBtnTextAlt: { color: Colors.primary },
});

export default HelpScreen;
