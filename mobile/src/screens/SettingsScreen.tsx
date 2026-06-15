import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ClientColors, DriverColors } from '../constants/sucarTheme';

/**
 * Settings — ride-hailing style preferences screen.
 * Toggles for trip preferences, language, notifications. Role-aware accent and copy.
 */
const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { appearance, setAppearance } = useTheme();
  const insets = useSafeAreaInsets();

  const isDriver = user?.role === 'driver';
  const accent = isDriver ? DriverColors.primary : ClientColors.accent;
  const styles = useMemo(() => createStyles(accent), [accent]);

  const [displayTraffic, setDisplayTraffic] = useState(false);
  const [dontCall, setDontCall] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const trackColor = { false: '#E2E8F0', true: accent };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }}
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>

        {/* Preferences group */}
        <View style={styles.group}>
          <ToggleRow
            label="Display traffic"
            value={displayTraffic}
            onChange={setDisplayTraffic}
            trackColor={trackColor}
            styles={styles}
            divider
          />
          <NavRow
            label="App language"
            value="English"
            onPress={() => Alert.alert('App language', 'More languages are coming soon.')}
            styles={styles}
            divider
          />
          <ToggleRow
            label="Don't call me"
            description="We'll ask the driver not to call unless it's an emergency"
            value={dontCall}
            onChange={setDontCall}
            trackColor={trackColor}
            styles={styles}
            divider
          />
          <ToggleRow
            label={isDriver ? 'Share my location with clients' : 'Share my location with driver'}
            description={
              isDriver
                ? 'Clients can see your location while you are on the way'
                : 'The driver will be able to see your location until you get in the car'
            }
            value={shareLocation}
            onChange={setShareLocation}
            trackColor={trackColor}
            styles={styles}
          />
        </View>

        {/* Notifications */}
        <Text style={styles.section}>Notifications</Text>
        <View style={styles.group}>
          <ToggleRow
            label="Push notifications"
            value={pushNotifications}
            onChange={setPushNotifications}
            trackColor={trackColor}
            styles={styles}
            divider
          />
          <ToggleRow
            label="Dark mode"
            value={appearance === 'dark'}
            onChange={(dark: boolean) => setAppearance(dark ? 'dark' : 'light')}
            trackColor={trackColor}
            styles={styles}
            divider
          />
          <NavRow
            label="More"
            onPress={() => Alert.alert('Notifications', 'Detailed notification settings are coming soon.')}
            styles={styles}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ToggleRow = ({ label, description, value, onChange, trackColor, styles, divider }: any) => (
  <View style={[styles.row, divider && styles.rowDivider]}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      {!!description && <Text style={styles.rowDesc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={trackColor}
      thumbColor="#FFFFFF"
      ios_backgroundColor={trackColor.false}
    />
  </View>
);

const NavRow = ({ label, value, onPress, styles, divider }: any) => (
  <TouchableOpacity style={[styles.row, divider && styles.rowDivider]} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      {!!value && <Text style={styles.rowDesc}>{value}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color="#C4CBD6" />
  </TouchableOpacity>
);

const createStyles = (_accent: string) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FFFFFF' },
    back: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, alignSelf: 'flex-start' },
    title: { fontSize: 34, fontWeight: '800', color: '#0F172A', paddingHorizontal: 16, marginTop: 18, marginBottom: 14 },
    section: { fontSize: 24, fontWeight: '800', color: '#0F172A', paddingHorizontal: 16, marginTop: 14, marginBottom: 12 },
    group: {
      marginHorizontal: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#EEF1F5',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 18,
      gap: 14,
      minHeight: 60,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F4F8' },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
    rowDesc: { fontSize: 14, color: '#94A3B8', marginTop: 4, lineHeight: 20 },
  });

export default SettingsScreen;
