import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Icon from '../icons/Icon';
import './IncidentModal.css';

interface IncidentModalProps {
  open: boolean;
  onClose: () => void;
}

const IncidentModal: React.FC<IncidentModalProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other' as string,
    severity: 'medium' as string,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/admin/incidents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      onClose();
      setFormData({
        title: '',
        description: '',
        type: 'other',
        severity: 'medium',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content incident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Incident</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              Title *
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Brief description of the incident"
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Description *
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Detailed description of what happened..."
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Type *
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="failed_booking">Failed Booking</option>
                  <option value="failed_transaction">Failed Transaction</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="technical_alert">Technical Alert</option>
                  <option value="operational_alert">Operational Alert</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className="form-group">
              <label>
                Severity *
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              Create Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentModal;
