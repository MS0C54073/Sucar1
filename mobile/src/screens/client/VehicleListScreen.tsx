import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

/**
 * Screen for managing the client's saved vehicles.
 *
 * Fetches vehicles from the backend and allows the user to add,
 * edit, and delete vehicles that can be used when creating bookings.
 */
const VehicleListScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    plateNo: '',
    color: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await apiClient.get('/vehicles');
      setVehicles(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', error?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({ make: '', model: '', plateNo: '', color: '' });
    setModalVisible(true);
  };

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make || '',
      model: vehicle.model || '',
      plateNo: vehicle.plateNo || '',
      color: vehicle.color || '',
    });
    setModalVisible(true);
  };

  const handleSaveVehicle = async () => {
    if (!formData.make || !formData.model || !formData.plateNo || !formData.color) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (editingVehicle) {
        // Update vehicle
        const response = await apiClient.put(
          `/vehicles/${editingVehicle.id || editingVehicle._id}`,
          formData
        );
        if (response.data.success) {
          Alert.alert('Success', 'Vehicle updated successfully');
          setModalVisible(false);
          fetchVehicles();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to update vehicle');
        }
      } else {
        // Add new vehicle
        const response = await apiClient.post('/vehicles', formData);
        if (response.data.success) {
          Alert.alert('Success', 'Vehicle added successfully');
          setModalVisible(false);
          setFormData({ make: '', model: '', plateNo: '', color: '' });
          fetchVehicles();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to add vehicle');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to save vehicle';
      Alert.alert('Error', errorMessage);
      console.error('Save vehicle error:', error);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/vehicles/${vehicleId}`);
              Alert.alert('Success', 'Vehicle deleted successfully');
              fetchVehicles();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  const renderVehicle = ({ item }: any) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleIconContainer}>
        <Ionicons name="car-sport" size={32} color={Colors.primary} />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>
          {item.make} {item.model}
        </Text>
        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.vehicleDetailText}>{item.plateNo}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="color-palette-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.vehicleDetailText}>{item.color}</Text>
          </View>
        </View>
      </View>
      <View style={styles.vehicleActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={18} color={Colors.info} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVehicle(item.id || item._id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.7}>
          <Ionicons name="add-circle" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Vehicle</Text>
        </TouchableOpacity>

        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item: any) => item.id || item._id || String(Math.random())}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color={Colors.gray400} />
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyText}>
                Add your first vehicle to start booking car wash services
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={vehicles.length === 0 ? styles.emptyContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Make *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., TOYOTA"
                    value={formData.make}
                    onChangeText={(text) => setFormData({ ...formData, make: text.toUpperCase() })}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Model *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., MARK X"
                    value={formData.model}
                    onChangeText={(text) => setFormData({ ...formData, model: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Plate Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., BLB57"
                    value={formData.plateNo}
                    onChangeText={(text) => setFormData({ ...formData, plateNo: text.toUpperCase() })}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Color *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., BLACK"
                    value={formData.color}
                    onChangeText={(text) => setFormData({ ...formData, color: text.toUpperCase() })}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveVehicle}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingVehicle ? 'Update' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginLeft: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  vehicleDetails: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetailText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  vehicleActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.errorLight,
    marginLeft: Spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  form: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: Typography.base,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray200,
    marginRight: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
    fontSize: Typography.base,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: Typography.semibold,
    fontSize: Typography.base,
  },
});

export default VehicleListScreen;
