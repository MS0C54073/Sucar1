import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAppDisplayName, getOtherAppName, getRequiredRole } from '../config/appVariant';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface WrongRoleScreenProps {
  actualRole: string;
}

const WrongRoleScreen = ({ actualRole }: WrongRoleScreenProps) => {
  const { logout } = useAuth();
  const required = getRequiredRole();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Use a different account or the correct app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Ionicons name="swap-horizontal" size={56} color={Colors.warning} />
      <Text style={styles.title}>Wrong app</Text>
      <Text style={styles.body}>
        This account is registered as a <Text style={styles.bold}>{actualRole}</Text>, but you are
        using <Text style={styles.bold}>{getAppDisplayName()}</Text> (for {required}s only).
      </Text>
      <Text style={styles.hint}>Please sign in with a {required} account, or install {getOtherAppName()}.</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.gray50,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  bold: {
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.base,
  },
});

export default WrongRoleScreen;
