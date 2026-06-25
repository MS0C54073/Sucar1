import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import ConfirmDialog from '../ConfirmDialog';
import FeatureFlagModal from './FeatureFlagModal';
import Icon from '../icons/Icon';
import './FeatureFlags.css';

interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'limited';
  rolloutPercentage: number;
  enabledRoles: string[];
  enabledRegions: string[];
  updatedAt: string;
  updatedBy?: string;
}

const FeatureFlags = () => {
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const response = await api.get('/admin/feature-flags');
      return response.data.data;
    },
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/admin/feature-flags/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const deleteFlagMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/feature-flags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const handleToggleStatus = (flag: FeatureFlag, newStatus: 'active' | 'inactive' | 'limited') => {
    const impactMessage =
      newStatus === 'inactive'
        ? 'This will immediately disable this feature for all users.'
        : newStatus === 'active'
        ? 'This will enable this feature for all eligible users.'
        : 'This will enable limited rollout.';

    setConfirmDialog({
      open: true,
      title: `Change Feature Status to ${newStatus.toUpperCase()}`,
      message: `Change "${flag.name}" status to ${newStatus}? ${impactMessage}`,
      variant: newStatus === 'inactive' ? 'warning' : 'info',
      onConfirm: () => {
        updateFlagMutation.mutate({
          id: flag.id,
          data: { status: newStatus },
        });
      },
    });
  };

  const handleDelete = (flag: FeatureFlag) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Feature Flag',
      message: `Are you sure you want to delete "${flag.name}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: () => {
        deleteFlagMutation.mutate(flag.id);
      },
    });
  };

  const handleEdit = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedFlag(null);
    setIsModalOpen(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'limited':
        return 'status-limited';
      case 'inactive':
        return 'status-inactive';
      default:
        return '';
    }
  };

  const getImpactScope = (flag: FeatureFlag): string => {
    if (flag.status === 'inactive') return 'No users';
    if (flag.status === 'active' && flag.rolloutPercentage === 100) {
      if (flag.enabledRoles.length === 0) return 'All users';
      return `${flag.enabledRoles.join(', ')} roles`;
    }
    if (flag.status === 'limited') {
      const roleText = flag.enabledRoles.length > 0 ? flag.enabledRoles.join(', ') : 'All roles';
      return `${flag.rolloutPercentage}% of ${roleText}`;
    }
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="feature-flags">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Feature Flags & Rollouts</h2>
            <p className="card-subtitle">
              Manage system features without redeployment. Changes take effect immediately.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            + Create Feature Flag
          </button>
        </div>

        {!flags || flags.length === 0 ? (
          <EmptyState
            icon={<Icon name="flag" size={28} />}
            title="No feature flags"
            description="Create your first feature flag to start managing features"
          />
        ) : (
          <div className="flags-grid">
            {flags.map((flag: FeatureFlag) => (
              <div key={flag.id} className="flag-card">
                <div className="flag-header">
                  <div className="flag-name-section">
                    <h3 className="flag-name">{flag.name}</h3>
                    <span className={`status-badge ${getStatusBadgeClass(flag.status)}`}>
                      {flag.status}
                    </span>
                  </div>
                  <div className="flag-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(flag)}
                      title="Edit Feature Flag"
                      aria-label="Edit"
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDelete(flag)}
                      title="Delete Feature Flag"
                      aria-label="Delete"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>

                {flag.description && (
                  <p className="flag-description">{flag.description}</p>
                )}

                <div className="flag-details">
                  <div className="flag-detail-item">
                    <span className="detail-label">Impact Scope:</span>
                    <span className="detail-value">{getImpactScope(flag)}</span>
                  </div>
                  {flag.status === 'limited' && (
                    <div className="flag-detail-item">
                      <span className="detail-label">Rollout:</span>
                      <span className="detail-value">{flag.rolloutPercentage}%</span>
                    </div>
                  )}
                  {flag.enabledRoles.length > 0 && (
                    <div className="flag-detail-item">
                      <span className="detail-label">Roles:</span>
                      <span className="detail-value">{flag.enabledRoles.join(', ')}</span>
                    </div>
                  )}
                  <div className="flag-detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">
                      {new Date(flag.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flag-actions-bar">
                  {flag.status !== 'active' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleToggleStatus(flag, 'active')}
                    >
                      Activate
                    </button>
                  )}
                  {flag.status !== 'limited' && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleToggleStatus(flag, 'limited')}
                    >
                      Limited Rollout
                    </button>
                  )}
                  {flag.status !== 'inactive' && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleToggleStatus(flag, 'inactive')}
                    >
                      Disable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FeatureFlagModal
        flag={selectedFlag}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFlag(null);
        }}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        variant={confirmDialog.variant}
      />
    </div>
  );
};

export default FeatureFlags;
