import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import ConfirmDialog from '../ConfirmDialog';
import IncidentModal from './IncidentModal';
import './Incidents.css';

interface Incident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  assignedToName?: string;
  createdByName?: string;
  createdAt: string;
}

const Incidents = () => {
  const { user } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    type?: string;
    severity?: string;
  }>({});
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

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['admin-incidents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.severity) params.append('severity', filters.severity);

      const response = await api.get(`/admin/incidents?${params.toString()}`);
      return response.data.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return api.post(`/admin/incidents/${id}/resolve`, { resolutionNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const handleResolve = (incident: Incident) => {
    const notes = prompt('Enter resolution notes:');
    if (notes) {
      setConfirmDialog({
        open: true,
        title: 'Resolve Incident',
        message: `Mark "${incident.title}" as resolved?`,
        onConfirm: () => {
          resolveMutation.mutate({ id: incident.id, notes });
        },
      });
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'assigned':
        return 'status-assigned';
      case 'in_progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="incidents">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Incident Management</h2>
            <p className="card-subtitle">Monitor, track, and resolve system incidents</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Create Incident
          </button>
        </div>

        {/* Filters */}
        <div className="incident-filters">
          <select
            value={filters.status || 'all'}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value })
            }
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.type || 'all'}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value === 'all' ? undefined : e.target.value })
            }
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="failed_booking">Failed Booking</option>
            <option value="failed_transaction">Failed Transaction</option>
            <option value="suspicious_activity">Suspicious Activity</option>
            <option value="technical_alert">Technical Alert</option>
            <option value="operational_alert">Operational Alert</option>
          </select>

          <select
            value={filters.severity || 'all'}
            onChange={(e) =>
              setFilters({ ...filters, severity: e.target.value === 'all' ? undefined : e.target.value })
            }
            className="filter-select"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Incidents List */}
        {!incidents || incidents.length === 0 ? (
          <div className="empty-state">No incidents found</div>
        ) : (
          <div className="incidents-list">
            {incidents.map((incident: Incident) => (
              <div
                key={incident.id}
                className="incident-card"
                onClick={() => navigate(`/admin/incidents/${incident.id}`)}
              >
                {incident.severity === 'critical' && (
                  <div className="incident-urgent-badge"><Icon name="alertTriangle" size={14} /> URGENT</div>
                )}
                <div className="incident-header">
                  <div className="incident-title-section">
                    <h3 className="incident-title">{incident.title}</h3>
                    <div className="incident-badges">
                      <span className={`severity-badge ${getSeverityClass(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`status-badge ${getStatusClass(incident.status)}`}>
                        {incident.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="incident-type">{incident.type.replace('_', ' ')}</div>
                </div>

                <p className="incident-description">{incident.description}</p>

                <div className="incident-footer">
                  <div className="incident-meta">
                    <span>Created by {incident.createdByName || 'System'}</span>
                    <span>•</span>
                    <span>{new Date(incident.createdAt).toLocaleString()}</span>
                    {incident.assignedToName && (
                      <>
                        <span>•</span>
                        <span>Assigned to {incident.assignedToName}</span>
                      </>
                    )}
                  </div>
                  {incident.status !== 'resolved' && incident.status !== 'closed' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(incident);
                      }}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <IncidentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
};

export default Incidents;
