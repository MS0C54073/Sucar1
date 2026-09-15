import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentPosition,
  getLocationAccessStatus,
  LocationAccessStatus,
  openLocationServicesSettings,
  requestForegroundLocationAccess,
} from '../services/locationService';

type GateState = 'checking' | 'services-off' | 'permission-needed' | 'permission-denied' | 'ready' | 'error';

interface LocationAccessGateProps {
  children: React.ReactNode;
}

const LocationAccessGate: React.FC<LocationAccessGateProps> = ({ children }) => {
  const [state, setState] = useState<GateState>('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const applyStatus = useCallback(async (status: LocationAccessStatus, readPosition: boolean) => {
    setCanAskAgain(status.canAskAgain);

    if (!status.servicesEnabled) {
      setState('services-off');
      return;
    }

    if (status.permission !== 'granted') {
      setState(status.permission === 'blocked' ? 'permission-denied' : 'permission-needed');
      return;
    }

    if (readPosition) {
      try {
        await getCurrentPosition();
      } catch {
        setState('error');
        return;
      }
    }

    setState('ready');
  }, []);

  const checkAccess = useCallback(async (requestPermission: boolean) => {
    try {
      const status = requestPermission
        ? await requestForegroundLocationAccess()
        : await getLocationAccessStatus();
      await applyStatus(status, status.permission === 'granted');
    } catch (error) {
      console.error('Location access check failed:', error);
      setState('error');
    }
  }, [applyStatus]);

  useEffect(() => {
    void checkAccess(true);
  }, [checkAccess]);

  useEffect(() => {
    let previousState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState.match(/inactive|background/) && nextState === 'active') {
        void checkAccess(false);
      }
      previousState = nextState;
    });

    return () => subscription.remove();
  }, [checkAccess]);

  const openSettings = async () => {
    try {
      await openLocationServicesSettings();
    } catch (error) {
      console.error('Could not open location settings:', error);
    }
  };

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Could not open app settings:', error);
    }
  };

  const requestAgain = async () => {
    setRetrying(true);
    try {
      await checkAccess(true);
    } finally {
      setRetrying(false);
    }
  };

  if (state === 'ready') return <>{children}</>;

  if (state === 'checking') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Checking location access…</Text>
      </View>
    );
  }

  const servicesOff = state === 'services-off';
  const needsPermission = state === 'permission-needed';
  const permanentlyDenied = state === 'permission-denied' && !canAskAgain;

  return (
    <View style={styles.centered}>
      <View style={styles.iconCircle}>
        <Ionicons name={servicesOff ? 'navigate-outline' : 'location-outline'} size={38} color="#7C3AED" />
      </View>
      <Text style={styles.title}>
        {servicesOff ? 'Turn on location services' : 'Location access required'}
      </Text>
      <Text style={styles.message}>
        {servicesOff
          ? 'SuCAR needs your device location to find nearby car washes, set pickup points, and provide accurate service details.'
          : 'SuCAR needs location access to find nearby car washes, set pickup points, and provide accurate service details.'}
      </Text>
      {state === 'error' && <Text style={styles.error}>We could not read your current location. Please try again.</Text>}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={servicesOff ? openSettings : permanentlyDenied ? openAppSettings : requestAgain}
        disabled={retrying}
        activeOpacity={0.85}
      >
        {retrying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>
          {servicesOff ? 'Enable Location' : permanentlyDenied ? 'Open Settings' : needsPermission ? 'Allow Location' : 'Try Again'}
        </Text>}
      </TouchableOpacity>
      {!servicesOff && !permanentlyDenied && !canAskAgain && (
        <TouchableOpacity onPress={openSettings} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open App Settings</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.platformHint}>
        {Platform.OS === 'ios' ? 'You can change this later in Settings.' : 'You can change this later in App settings.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8F7FC',
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    marginBottom: 24,
  },
  title: { color: '#201A2B', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  message: { color: '#625A70', fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 24 },
  error: { color: '#B42318', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  loadingText: { color: '#625A70', fontSize: 15, marginTop: 14 },
  primaryButton: {
    minWidth: 210,
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { padding: 14 },
  secondaryButtonText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
  platformHint: { color: '#8B8495', fontSize: 12, textAlign: 'center', marginTop: 10 },
});

export default LocationAccessGate;