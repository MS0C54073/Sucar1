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

/**
 * About screen showing app version, legal links, and credits.
 */
const AboutScreen = () => {
    const links = [
        { icon: 'document-text-outline', label: 'Terms of Service', url: 'https://sucar.app/terms' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', url: 'https://sucar.app/privacy' },
        { icon: 'star-outline', label: 'Rate Us', url: 'market://details?id=com.sucar.app' },
        { icon: 'logo-github', label: 'Open Source Licenses', url: 'https://sucar.app/licenses' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* App Logo / Identity */}
                <View style={styles.logoSection}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="car-sport" size={48} color={Colors.white} />
                    </View>
                    <Text style={styles.appName}>SuCAR</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                    <Text style={styles.tagline}>Your reliable car wash partner</Text>
                </View>

                {/* Links */}
                <View style={styles.linksSection}>
                    {links.map((link, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.linkCard}
                            activeOpacity={0.7}
                            onPress={() => Linking.openURL(link.url).catch(() => { })}
                        >
                            <View style={styles.linkIcon}>
                                <Ionicons name={link.icon as any} size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.linkLabel}>{link.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Credits */}
                <View style={styles.credits}>
                    <Text style={styles.creditsText}>Made with ❤️ in Zambia</Text>
                    <Text style={styles.copyright}>© {new Date().getFullYear()} SuCAR. All rights reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    logoSection: { alignItems: 'center', marginBottom: Spacing.xl, paddingTop: Spacing.lg },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    appName: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
    },
    version: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    tagline: {
        fontSize: Typography.sm,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
    },
    linksSection: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    linkIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        backgroundColor: `${Colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    linkLabel: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.textPrimary,
    },
    credits: { alignItems: 'center', marginTop: Spacing.xl },
    creditsText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    copyright: {
        fontSize: Typography.sm,
        color: Colors.textTertiary,
    },
});

export default AboutScreen;
