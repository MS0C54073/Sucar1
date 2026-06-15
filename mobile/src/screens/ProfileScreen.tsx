import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ClientColors, DriverColors, BrandGradients } from '../constants/sucarTheme';
import { apiClient } from '../utils/api';

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type ListRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const isDriver = user?.role === 'driver';
  const C = isDriver ? DriverColors : ClientColors;
  const accent = isDriver ? DriverColors.primary : ClientColors.accent;
  const avatarGradient = isDriver ? BrandGradients.avatarDriver : BrandGradients.avatar;
  const styles = useMemo(() => createStyles(accent), [accent]);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Change password modal
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const firstName = user?.name?.split(' ')[0] || (isDriver ? 'Driver' : 'there');
  const displayName = user?.name || (isDriver ? 'Driver' : 'Your account');
  const phone = user?.phone || user?.email || '';

  // Complete-profile progress (name + phone)
  const steps = [Boolean(user?.name?.trim()), Boolean(user?.phone?.trim())];
  const done = steps.filter(Boolean).length;
  const profileComplete = done === steps.length;

  const openEditModal = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    Alert.alert('Saved', 'Profile updated.');
    setEditModalVisible(false);
  };

  const openChangePassword = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setPwModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Too short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwModalVisible(false);
      Alert.alert('Success', 'Your password has been updated.');
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not change password. Check your current password.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const go = (route: string, params?: object) => {
    try {
      navigation.navigate(route, params);
    } catch {
      Alert.alert('Coming soon', 'This section is on the way.');
    }
  };

  const quickActions: QuickAction[] = [
    {
      icon: 'time-outline',
      label: 'History',
      onPress: () => go(isDriver ? 'JobsTab' : 'MyBookings'),
    },
    {
      icon: 'headset-outline',
      label: 'Support',
      onPress: () => go('Help'),
    },
    isDriver
      ? { icon: 'car-sport-outline', label: 'Vehicle', onPress: () => go('VehicleList') }
      : { icon: 'location-outline', label: 'Addresses', onPress: () => Alert.alert('Addresses', 'Saved addresses are coming soon.') },
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => go('Settings'),
    },
  ];

  const walletRows: ListRow[] = [
    {
      icon: 'gift-outline',
      label: 'Discounts and gifts',
      value: 'Enter promo code',
      onPress: () => Alert.alert('Promo code', 'Promo codes are coming soon.'),
    },
    {
      icon: 'card-outline',
      label: 'Payment methods',
      value: 'Cash',
      onPress: () => Alert.alert('Payment methods', 'Cash is the only method for now.'),
    },
  ];

  const moreRows: ListRow[] = [
    { icon: 'lock-closed-outline', label: 'Change password', onPress: openChangePassword },
    { icon: 'help-circle-outline', label: 'Help and support', onPress: () => go('Help') },
    { icon: 'information-circle-outline', label: 'About SuCAR', value: 'v1.0.0', onPress: () => go('About') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
      >
        {/* Identity */}
        <View style={styles.identity}>
          <LinearGradient
            colors={[...avatarGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{(firstName[0] || 'U').toUpperCase()}</Text>
          </LinearGradient>

          <TouchableOpacity
            style={styles.nameRow}
            activeOpacity={0.7}
            onPress={() => openEditModal('name', user?.name || '')}
          >
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <View style={styles.editDot}>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          {!!phone && <Text style={styles.subId}>{phone}</Text>}
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          {quickActions.map((q) => (
            <TouchableOpacity key={q.label} style={styles.quick} onPress={q.onPress} activeOpacity={0.7}>
              <View style={styles.quickCircle}>
                <Ionicons name={q.icon} size={24} color="#1F2937" />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Complete profile */}
        {!profileComplete && (
          <TouchableOpacity
            style={styles.completeCard}
            activeOpacity={0.85}
            onPress={() => openEditModal('name', user?.name || '')}
          >
            <View style={styles.completeHead}>
              <Text style={[styles.completeTitle, { color: accent }]}>COMPLETE PROFILE</Text>
              <Text style={styles.completeCount}>{done} of {steps.length}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(done / steps.length) * 100}%`, backgroundColor: accent }]} />
            </View>
            <View style={styles.completeInner}>
              <Ionicons name="person-circle-outline" size={22} color="#1F2937" />
              <Text style={styles.completeInnerText}>
                {user?.name?.trim() ? 'Add your phone number' : 'Confirm your name'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Wallet group */}
        <View style={styles.group}>
          {walletRows.map((r, i) => (
            <Row key={r.label} row={r} accent={accent} divider={i < walletRows.length - 1} styles={styles} />
          ))}
        </View>

        {/* Role CTA */}
        {isDriver ? (
          <TouchableOpacity style={styles.ctaCard} activeOpacity={0.9} onPress={() => go('EarningsTab')}>
            <View style={[styles.ctaIcon, { backgroundColor: accent }]}>
              <Ionicons name="wallet" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.ctaText}>Your earnings today</Text>
            <Ionicons name="chevron-forward" size={20} color={accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ctaCard}
            activeOpacity={0.9}
            onPress={() => Alert.alert('Earn as a driver', 'Want to earn with SuCAR? Driver signups are opening soon.')}
          >
            <View style={[styles.ctaIcon, { backgroundColor: '#FACC15' }]}>
              <Ionicons name="star" size={18} color="#1F2937" />
            </View>
            <Text style={styles.ctaText}>Earn as a driver</Text>
            <Ionicons name="chevron-forward" size={20} color="#FACC15" />
          </TouchableOpacity>
        )}

        {/* More group */}
        <View style={styles.group}>
          {moreRows.map((r, i) => (
            <Row key={r.label} row={r} accent={accent} divider={i < moreRows.length - 1} styles={styles} />
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={ClientColors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change password modal */}
      <Modal visible={pwModalVisible} transparent animationType="slide" onRequestClose={() => setPwModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change password</Text>
              <TouchableOpacity onPress={() => setPwModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <PwField label="Current password" value={currentPw} onChange={setCurrentPw} show={showCurrentPw} toggle={() => setShowCurrentPw((v) => !v)} placeholder="Enter current password" styles={styles} />
            <PwField label="New password" value={newPw} onChange={setNewPw} show={showNewPw} toggle={() => setShowNewPw((v) => !v)} placeholder="At least 6 characters" styles={styles} />
            <PwField label="Confirm new password" value={confirmPw} onChange={setConfirmPw} show={showConfirmPw} toggle={() => setShowConfirmPw((v) => !v)} placeholder="Repeat new password" styles={styles} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setPwModalVisible(false)} disabled={pwSaving}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: accent }, pwSaving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={pwSaving}>
                {pwSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveButtonText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editField ? editField.charAt(0).toUpperCase() + editField.slice(1) : ''}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editField}`}
              placeholderTextColor="#9CA3AF"
              autoCapitalize={editField === 'email' ? 'none' : 'words'}
              keyboardType={editField === 'email' ? 'email-address' : editField === 'phone' ? 'phone-pad' : 'default'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: accent }]} onPress={handleSaveEdit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Row = ({ row, accent, divider, styles }: { row: ListRow; accent: string; divider: boolean; styles: any }) => (
  <TouchableOpacity style={[styles.row, divider && styles.rowDivider]} onPress={row.onPress} activeOpacity={0.7}>
    <View style={[styles.rowIcon, { backgroundColor: `${accent}14` }]}>
      <Ionicons name={row.icon} size={20} color={accent} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{row.label}</Text>
      {!!row.value && <Text style={styles.rowValue}>{row.value}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#C4CBD6" />
  </TouchableOpacity>
);

const PwField = ({ label, value, onChange, show, toggle, placeholder, styles }: any) => (
  <>
    <Text style={styles.pwLabel}>{label}</Text>
    <View style={styles.pwRow}>
      <TextInput
        style={styles.pwInput}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={toggle} hitSlop={8}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  </>
);

const createStyles = (accent: string) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FFFFFF' },
    identity: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 22 },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    avatarText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
    name: { fontSize: 24, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
    editDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    subId: { fontSize: 15, color: '#9CA3AF', marginTop: 4 },

    quickRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 22,
    },
    quick: { alignItems: 'center', flex: 1 },
    quickCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    quickLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

    completeCard: {
      marginHorizontal: 16,
      marginBottom: 18,
      backgroundColor: `${accent}10`,
      borderRadius: 18,
      padding: 16,
    },
    completeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    completeTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    completeCount: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(15,23,42,0.10)', marginBottom: 14, overflow: 'hidden' },
    progressFill: { height: 5, borderRadius: 3 },
    completeInner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 10,
    },
    completeInnerText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },

    group: {
      marginHorizontal: 16,
      marginBottom: 18,
      backgroundColor: '#F8FAFC',
      borderRadius: 18,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 15, gap: 12 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: '#EEF1F5' },
    rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
    rowValue: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

    ctaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 18,
      backgroundColor: '#1F2937',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    ctaIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    ctaText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    logout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 16,
      marginTop: 4,
      paddingVertical: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#FECACA',
      gap: 8,
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: ClientColors.error },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '90%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    modalInput: { borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 12, fontSize: 15, color: '#0F172A', marginBottom: 18 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F1F5F9' },
    cancelButtonText: { color: '#0F172A', fontWeight: '700' },
    saveButtonText: { color: '#FFFFFF', fontWeight: '700' },
    pwLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 8 },
    pwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 6, backgroundColor: '#F8FAFC' },
    pwInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#0F172A' },
  });

export default ProfileScreen;
