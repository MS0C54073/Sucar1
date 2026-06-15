import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/common/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { apiClient } from '../utils/api';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme, appearance, setAppearance } = useTheme();
  const C = theme.colors;
  const styles = createStyles(C);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Change password modal state
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    // In a real app, you would call an API to update the user profile
    Alert.alert('Success', 'Profile updated successfully');
    setEditModalVisible(false);
  };

  const menuItems = [
    {
      icon: 'person-outline' as const,
      label: 'Edit Profile',
      onPress: () => openEditModal('name', user?.name || ''),
      showArrow: true,
    },
    {
      icon: 'mail-outline' as const,
      label: 'Email',
      value: user?.email,
      onPress: () => openEditModal('email', user?.email || ''),
      showArrow: true,
    },
    {
      icon: 'call-outline' as const,
      label: 'Phone',
      value: user?.phone,
      onPress: () => openEditModal('phone', user?.phone || ''),
      showArrow: true,
    },
    {
      icon: 'moon-outline' as const,
      label: 'Appearance',
      value: appearance === 'dark' ? 'Dark' : 'Light',
      onPress: () => {},
      showArrow: false,
      rightComponent: (
        <Switch
          value={appearance === 'dark'}
          onValueChange={(dark) => setAppearance(dark ? 'dark' : 'light')}
          trackColor={{ false: C.gray300, true: C.primary }}
          thumbColor={C.white}
        />
      ),
    },
    {
      icon: 'notifications-outline' as const,
      label: 'Notifications',
      value: notificationsEnabled ? 'Enabled' : 'Disabled',
      onPress: () => {},
      showArrow: false,
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: C.gray300, true: C.primary }}
          thumbColor={C.white}
        />
      ),
    },
    {
      icon: 'lock-closed-outline' as const,
      label: 'Change Password',
      onPress: openChangePassword,
      showArrow: true,
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Help & Support',
      onPress: () => Alert.alert('Help', 'Contact support at support@sucar.com'),
      showArrow: true,
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Terms & Conditions',
      onPress: () => Alert.alert('Terms', 'Terms and conditions will be displayed here'),
      showArrow: true,
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Privacy Policy',
      onPress: () => Alert.alert('Privacy', 'Privacy policy will be displayed here'),
      showArrow: true,
    },
    {
      icon: 'information-circle-outline' as const,
      label: 'About',
      value: 'Version 1.0.0',
      onPress: () => Alert.alert('About', 'SuCAR Car Wash Booking App\nVersion 1.0.0'),
      showArrow: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GradientBackground style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color={C.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userRole}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </Text>
          </View>
        </GradientBackground>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={22} color={C.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  {item.value && <Text style={styles.menuItemValue}>{item.value}</Text>}
                </View>
              </View>
              {item.rightComponent || (item.showArrow && (
                <Ionicons name="chevron-forward" size={20} color={C.gray400} />
              ))}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={C.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Change Password Modal */}
        <Modal
          visible={pwModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPwModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setPwModalVisible(false)}>
                  <Ionicons name="close" size={24} color={C.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Current password */}
              <Text style={styles.pwLabel}>Current password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry={!showCurrentPw}
                  placeholder="Enter current password"
                  placeholderTextColor={C.gray400}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrentPw((v) => !v)} hitSlop={8}>
                  <Ionicons name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.gray400} />
                </TouchableOpacity>
              </View>

              {/* New password */}
              <Text style={styles.pwLabel}>New password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={styles.pwInput}
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry={!showNewPw}
                  placeholder="At least 6 characters"
                  placeholderTextColor={C.gray400}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPw((v) => !v)} hitSlop={8}>
                  <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.gray400} />
                </TouchableOpacity>
              </View>

              {/* Confirm new password */}
              <Text style={styles.pwLabel}>Confirm new password</Text>
              <View style={[styles.pwRow, { marginBottom: Spacing.lg }]}>
                <TextInput
                  style={styles.pwInput}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showConfirmPw}
                  placeholder="Repeat new password"
                  placeholderTextColor={C.gray400}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPw((v) => !v)} hitSlop={8}>
                  <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.gray400} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setPwModalVisible(false)}
                  disabled={pwSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, pwSaving && { opacity: 0.6 }]}
                  onPress={handleChangePassword}
                  disabled={pwSaving}
                >
                  {pwSaving
                    ? <ActivityIndicator size="small" color={C.white} />
                    : <Text style={styles.saveButtonText}>Update</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Edit {editField ? editField.charAt(0).toUpperCase() + editField.slice(1) : ''}
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={C.textPrimary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Enter ${editField}`}
                autoCapitalize={editField === 'email' ? 'none' : 'words'}
                keyboardType={editField === 'email' ? 'email-address' : editField === 'phone' ? 'phone-pad' : 'default'}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(Colors: any) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.base,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  userRole: {
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  menuContainer: {
    padding: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  menuItemValue: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  logoutContainer: {
    padding: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    
    ...Shadows.sm,
  },
  logoutText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    width: '90%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: Typography.base,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray200,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: Typography.semibold,
  },
  pwLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  pwInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  });
}

export default ProfileScreen;
