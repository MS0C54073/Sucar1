import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import ConfirmDialog from '../ConfirmDialog';
import './IncidentDetail.css';

interface Incident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  createdByName?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  affectedUsers?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  resolvedAt?: string;
  updates?: any[];
}

const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [statusChange, setStatusChange] = useState<string>('');
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const { data: incident, isLoading } = useQuery({
    queryKey: ['admin-incident', id],
    queryFn: async () => {
      const response = await api.get(`/admin/incidents/${id}`);
      return response.data.data;
    },
  });

  const { data: admins } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data.data.filter((u: any) => u.role === 'admin');
    },
  });

  const addUpdateMutation = useMutation({
    mutationFn: async ({ comment, statusChange }: { comment: string; statusChange?: string }) => {
      return api.post(`/admin/incidents/${id}/updates`, { comment, statusChange });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incident', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setNewComment('');
      setStatusChange('');
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (assignedTo: string) => {
      return api.post(`/admin/incidents/${id}/assign`, { assignedTo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incident', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setShowAssignDialog(false);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      // Escalate by changing severity to critical and assigning to super admin
      const superAdmin = admins?.find((a: any) => a.adminLevel === 'super_admin');
      if (superAdmin) {
        await api.put(`/admin/incidents/${id}`, {
          severity: 'critical',
          assignedTo: superAdmin.id,
          status: 'assigned',
        });
        await api.post(`/admin/incidents/${id}/updates`, {
          comment: `Incident escalated to super admin by ${user?.name}`,
          statusChange: 'assigned',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incident', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      setShowEscalateDialog(false);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (notes: string) => {
      return api.post(`/admin/incidents/${id}/resolve`, { resolutionNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incident', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
    },
  });

  const handleAddUpdate = () => {
    if (!newComment.trim()) return;
    addUpdateMutation.mutate({
      comment: newComment,
      statusChange: statusChange || undefined,
    });
  };

  const handleAssign = () => {
    if (selectedAssignee) {
      assignMutation.mutate(selectedAssignee);
    }
  };

  const handleEscalate = () => {
    setShowEscalateDialog(true);
  };

  const handleResolve = () => {
    const notes = prompt('Enter resolution notes:');
    if (notes) {
      resolveMutation.mutate(notes);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="empty-state">
        <p>Incident not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/incidents')}>
          Back to Incidents
        </button>
      </div>
    );
  }

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

  const canEscalate =
    (incident.severity !== 'critical' || incident.status === 'open' || incident.status === 'assigned') &&
    user?.adminLevel !== 'super_admin';

  const canResolve = incident.status !== 'resolved' && incident.status !== 'closed';

  return (
    <div className="incident-detail">
      <div className="incident-detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/admin/incidents')}>
          <Icon name="arrowLeft" size={16} /> Back to Incidents
        </button>
        <div className="header-actions">
          {canEscalate && (
            <button className="btn btn-warning" onClick={handleEscalate}>
              <Icon name="alertTriangle" size={15} /> Escalate
            </button>
          )}
          {canResolve && (
            <button className="btn btn-success" onClick={handleResolve}>
              <Icon name="check" size={15} /> Resolve
            </button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="incident-header-section">
          <div>
            <h1 className="incident-title">{incident.title}</h1>
            <div className="incident-meta-badges">
              <span className={`severity-badge ${getSeverityClass(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className={`status-badge status-${incident.status}`}>
                {incident.status.replace('_', ' ')}
              </span>
              <span className="type-badge">{incident.type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="incident-description-section">
          <h3>Description</h3>
          <p>{incident.description}</p>
        </div>

        <div className="incident-info-grid">
          <div className="info-item">
            <span className="info-label">Created By</span>
            <span className="info-value">{incident.createdByName || 'System'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created At</span>
            <span className="info-value">{new Date(incident.createdAt).toLocaleString()}</span>
          </div>
          {incident.assignedToName && (
            <div className="info-item">
              <span className="info-label">Assigned To</span>
              <span className="info-value">{incident.assignedToName}</span>
            </div>
          )}
          {incident.resolvedAt && (
            <>
              <div className="info-item">
                <span className="info-label">Resolved At</span>
                <span className="info-value">{new Date(incident.resolvedAt).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Resolved By</span>
                <span className="info-value">{incident.resolvedByName || 'Unknown'}</span>
              </div>
            </>
          )}
        </div>

        {incident.resolutionNotes && (
          <div className="resolution-section">
            <h3>Resolution Notes</h3>
            <p>{incident.resolutionNotes}</p>
          </div>
        )}

        {/* Assignment Section */}
        {!incident.assignedTo && (
          <div className="assignment-section">
            <h3>Assign Incident</h3>
            <div className="assign-controls">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="assign-select"
              >
                <option value="">Select admin...</option>
                {admins?.map((admin: any) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.adminLevel || 'admin'})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => setShowAssignDialog(true)}
                disabled={!selectedAssignee}
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {/* Updates/Comments Section */}
        <div className="updates-section">
          <h3>Updates & Comments</h3>
          <div className="updates-list">
            {incident.updates && incident.updates.length > 0 ? (
              incident.updates.map((update: any) => (
                <div key={update.id} className="update-item">
                  <div className="update-header">
                    <span className="update-author">{update.userName || 'System'}</span>
                    <span className="update-time">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="update-content">{update.comment}</div>
                  {update.statusChange && (
                    <div className="update-status-change">
                      Status changed to: {update.statusChange.replace('_', ' ')}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-updates">No updates yet</p>
            )}
          </div>

          <div className="add-update-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or update..."
              rows={3}
              className="comment-input"
            />
            <div className="update-actions">
              <select
                value={statusChange}
                onChange={(e) => setStatusChange(e.target.value)}
                className="status-select"
              >
                <option value="">No status change</option>
                <option value="assigned">Mark as Assigned</option>
                <option value="in_progress">Mark as In Progress</option>
                <option value="resolved">Mark as Resolved</option>
                <option value="closed">Mark as Closed</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={handleAddUpdate}
                disabled={!newComment.trim() || addUpdateMutation.isPending}
              >
                {addUpdateMutation.isPending ? 'Adding...' : 'Add Update'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Escalate Confirmation */}
      <ConfirmDialog
        open={showEscalateDialog}
        title="Escalate Incident"
        message="This will escalate the incident to critical severity and assign it to a super admin. Continue?"
        onConfirm={() => escalateMutation.mutate()}
        onCancel={() => setShowEscalateDialog(false)}
        variant="warning"
      />

      {/* Assign Confirmation */}
      <ConfirmDialog
        open={showAssignDialog}
        title="Assign Incident"
        message={`Assign this incident to ${admins?.find((a: any) => a.id === selectedAssignee)?.name || 'selected admin'}?`}
        onConfirm={handleAssign}
        onCancel={() => setShowAssignDialog(false)}
      />
    </div>
  );
};

export default IncidentDetail;
