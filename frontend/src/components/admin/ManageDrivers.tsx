import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import Icon from '../icons/Icon';
import ConfirmDialog from '../ConfirmDialog';
import './ManageDrivers.css';

const ManageDrivers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=driver');
      return response.data.data;
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return api.put(`/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const filteredDrivers = drivers?.filter(
    (driver: any) =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm)
  );

  const handleToggleActive = (driver: any) => {
    setConfirmDialog({
      open: true,
      title: driver.isActive ? 'Deactivate Driver' : 'Activate Driver',
      message: `Are you sure you want to ${driver.isActive ? 'deactivate' : 'activate'} ${driver.name}?`,
      onConfirm: () => {
        updateDriverMutation.mutate({
          userId: driver.id,
          data: { isActive: !driver.isActive },
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="manage-drivers">
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="header-content">
            <h2 className="admin-card-title">Manage Drivers</h2>
            <p className="card-subtitle">View and manage all registered drivers</p>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <span className="search-icon"><Icon name="search" size={16} /></span>
            <input
              type="text"
              placeholder="Search drivers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {!filteredDrivers || filteredDrivers.length === 0 ? (
          <EmptyState
            icon={<Icon name="car" size={28} />}
            title="No drivers found"
            description={searchTerm ? 'Try adjusting your search' : 'No drivers registered yet'}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>License No</th>
                  <th>License Type</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver: any) => (
                  <tr key={driver.id} className={!driver.isActive ? 'inactive-row' : ''}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {driver.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{driver.name}</span>
                      </div>
                    </td>
                    <td>{driver.email}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.licenseNo || 'N/A'}</td>
                    <td>{driver.licenseType || 'N/A'}</td>
                    <td>
                      <span className={`availability-badge ${driver.availability ? 'available' : 'unavailable'}`}>
                        {driver.availability ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${driver.isActive ? 'status-active' : 'status-inactive'}`}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${driver.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleActive(driver)}
                      >
                        {driver.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        variant="warning"
      />
    </div>
  );
};

export default ManageDrivers;
