import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/common/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const C = theme.colors;
  const styles = createStyles(C);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
      onPress: () => Alert.alert('Coming Soon', 'Password change feature will be available soon'),
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
  });
}

export default ProfileScreen;
