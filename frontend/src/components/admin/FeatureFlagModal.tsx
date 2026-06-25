import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Icon from '../icons/Icon';
import './FeatureFlagModal.css';

interface FeatureFlag {
  id?: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'limited';
  rolloutPercentage: number;
  enabledRoles: string[];
  enabledRegions: string[];
}

interface FeatureFlagModalProps {
  flag: FeatureFlag | null;
  open: boolean;
  onClose: () => void;
}

const FeatureFlagModal: React.FC<FeatureFlagModalProps> = ({ flag, open, onClose }) => {
  const [formData, setFormData] = useState<FeatureFlag>({
    name: '',
    description: '',
    status: 'inactive',
    rolloutPercentage: 0,
    enabledRoles: [],
    enabledRegions: [],
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (flag) {
      setFormData(flag);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'inactive',
        rolloutPercentage: 0,
        enabledRoles: [],
        enabledRegions: [],
      });
    }
  }, [flag, open]);

  const createMutation = useMutation({
    mutationFn: async (data: FeatureFlag) => {
      return api.post('/admin/feature-flags', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FeatureFlag }) => {
      return api.put(`/admin/feature-flags/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (flag?.id) {
      updateMutation.mutate({ id: flag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      enabledRoles: prev.enabledRoles.includes(role)
        ? prev.enabledRoles.filter((r) => r !== role)
        : [...prev.enabledRoles, role],
    }));
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feature-flag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{flag ? 'Edit Feature Flag' : 'Create Feature Flag'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              Feature Name *
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., live_tracking"
                disabled={!!flag}
              />
            </label>
            <small>Unique identifier (cannot be changed after creation)</small>
          </div>

          <div className="form-group">
            <label>
              Description
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what this feature does..."
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Status *
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'inactive' | 'limited',
                  })
                }
                required
              >
                <option value="inactive">Inactive</option>
                <option value="limited">Limited Rollout</option>
                <option value="active">Active</option>
              </select>
            </label>
          </div>

          {formData.status === 'limited' && (
            <div className="form-group">
              <label>
                Rollout Percentage *
                <input
                  type="number"
                  value={formData.rolloutPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rolloutPercentage: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  required
                />
              </label>
              <small>Percentage of eligible users who will see this feature (0-100)</small>
            </div>
          )}

          <div className="form-group">
            <label>Enabled Roles</label>
            <div className="role-checkboxes">
              {['client', 'driver', 'carwash', 'admin'].map((role) => (
                <label key={role} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.enabledRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </label>
              ))}
            </div>
            <small>Leave empty to enable for all roles</small>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {flag ? 'Update' : 'Create'} Feature Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeatureFlagModal;
