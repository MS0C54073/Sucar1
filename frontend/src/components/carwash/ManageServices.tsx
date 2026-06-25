import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../ToastContainer';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import { servicePackages, ServicePackage } from '../../data/servicePackages';
import './ManageServices.css';

const ManageServices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [inputMode, setInputMode] = useState<'manual' | 'package'>('manual');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isActive: true,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['carwash-services', user?.id],
    queryFn: async () => {
      const response = await api.get(`/carwash/services?carWashId=${user?.id}`);
      return response.data.data;
    },
    enabled: !!user?.id,
  });

  // Check if service limit reached
  const serviceLimit = 20;
  const canAddMore = !services || services.length < serviceLimit;

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingService) {
        return api.put(`/carwash/services/${editingService.id || editingService._id}`, data);
      } else {
        return api.post(`/carwash/services`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carwash-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setEditingService(null);
      setSelectedPackage('');
      setInputMode('manual');
      setFormData({ name: '', description: '', price: '', isActive: true });
      showToast(
        editingService ? 'Service updated successfully!' : 'Service created successfully!',
        'success'
      );
    },
    onError: (error: any) => {
      let errorMessage = error.response?.data?.message || 'Failed to save service. Please try again.';
      
      // Check if it's a constraint error
      if (error.response?.data?.fixRequired || 
          errorMessage.includes('check constraint') || 
          errorMessage.includes('services_name_check')) {
        errorMessage = 'Database constraint error: Please run the SQL fix in FIX_NOW.sql file in your Supabase SQL Editor. The constraint needs to be removed to allow custom service names.';
      }
      
      showToast(errorMessage, 'error', 8000); // Show for 8 seconds so user can read it
    },
  });

  const handleGenerateFromPackage = () => {
    if (!selectedPackage) {
      showToast('Please select a service package first', 'error');
      return;
    }

    const pkg = servicePackages.find(p => p.id === selectedPackage);
    if (!pkg) {
      showToast('Selected package not found', 'error');
      return;
    }

    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      isActive: true,
    });
    showToast('Service details generated from package! Review and click Add to save.', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast('Service name is required', 'error');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      showToast('Please enter a valid price greater than 0', 'error');
      return;
    }

    // Check service limit before creating
    if (!editingService && services && services.length >= serviceLimit) {
      showToast(`Maximum limit of ${serviceLimit} services reached. Please delete or deactivate existing services.`, 'error');
      return;
    }

    createOrUpdateMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      isActive: service.isActive,
    });
    setInputMode('manual');
    setSelectedPackage('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setSelectedPackage('');
    setInputMode('manual');
    setFormData({ name: '', description: '', price: '', isActive: true });
  };

  const handleAddNew = () => {
    setEditingService(null);
    setSelectedPackage('');
    setInputMode('manual');
    setFormData({ name: '', description: '', price: '', isActive: true });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="manage-services-loading">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="manage-services">
      <div className="manage-services-header">
        <div>
          <h1 className="page-title">Manage Services</h1>
          {services && (
            <p className="service-count">
              {services.length} of {serviceLimit} services
              {!canAddMore && (
                <span className="limit-reached"> (Limit reached)</span>
              )}
            </p>
          )}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleAddNew}
          disabled={!canAddMore}
          title={!canAddMore ? 'Maximum 20 services limit reached. Delete or deactivate existing services to add new ones.' : ''}
        >
          + Add Service
        </button>
      </div>

      <div className="services-card">
        {showForm && (
          <div className="service-form-container">
            <div className="form-header">
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className="close-btn" onClick={handleCancel} type="button" aria-label="Close">
                <Icon name="x" size={16} />
              </button>
            </div>

            {!editingService && (
              <div className="input-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
                  onClick={() => {
                    setInputMode('manual');
                    setSelectedPackage('');
                    setFormData({ name: '', description: '', price: '', isActive: true });
                  }}
                >
                  <Icon name="pencil" size={15} /> Manual Entry
                </button>
                <button
                  type="button"
                  className={`mode-btn ${inputMode === 'package' ? 'active' : ''}`}
                  onClick={() => {
                    setInputMode('package');
                    setFormData({ name: '', description: '', price: '', isActive: true });
                  }}
                >
                  <Icon name="package" size={15} /> From Package
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="service-form">
              {inputMode === 'package' && !editingService && (
                <div className="form-group">
                  <label className="form-label">Select Service Package</label>
                  <select
                    className="form-select"
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                  >
                    <option value="">Choose a package...</option>
                    {servicePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — K{pkg.price}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary generate-btn"
                    onClick={handleGenerateFromPackage}
                    disabled={!selectedPackage}
                  >
                    <Icon name="refresh" size={15} /> Generate
                  </button>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Service Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service name"
                  required
                  disabled={!!editingService && editingService.name}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Price (K) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Service is active and available for booking</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary add-btn"
                  disabled={createOrUpdateMutation.isPending || !formData.name || !formData.price}
                >
                  {createOrUpdateMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={16} />
                      <span>{editingService ? 'Update Service' : 'Add Service'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary cancel-btn"
                  onClick={handleCancel}
                  disabled={createOrUpdateMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="services-table-container">
          <h2 className="table-title">Your Services</h2>
          {services && services.length > 0 ? (
            <div className="table-wrapper">
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: any) => (
                    <tr key={service.id || service._id}>
                      <td className="service-name-cell">
                        <strong>{service.name}</strong>
                      </td>
                      <td className="service-description-cell">
                        {service.description || <span className="no-description">No description</span>}
                      </td>
                      <td className="service-price-cell">
                        <span className="price-amount">K{service.price}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            service.isActive ? 'status-active' : 'status-inactive'
                          }`}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary edit-btn"
                          onClick={() => handleEdit(service)}
                          disabled={createOrUpdateMutation.isPending}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden />
              <h3>No services yet</h3>
              <p>Create your first service to start accepting bookings</p>
              <button className="btn btn-primary" onClick={handleAddNew}>
                Add Your First Service
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageServices;
