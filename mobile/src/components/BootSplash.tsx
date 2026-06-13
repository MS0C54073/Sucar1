import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getAppDisplayName, isDriverApp } from '../config/appVariant';
import { Colors, Typography } from '../constants/theme';

const BootSplash = () => (
  <View style={[styles.container, isDriverApp() && styles.containerDriver]}>
    <ActivityIndicator size="large" color={isDriverApp() ? Colors.info : Colors.white} />
    <Text style={[styles.text, isDriverApp() && styles.textDriver]}>Loading {getAppDisplayName()}…</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    gap: 16,
  },
  containerDriver: {
    backgroundColor: '#0f1419',
  },
  text: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  textDriver: {
    color: Colors.gray300,
  },
});

export default BootSplash;
