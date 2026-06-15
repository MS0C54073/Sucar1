import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import Icon from '../icons/Icon';
import ConfirmDialog from '../ConfirmDialog';
import './PendingApprovals.css';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  nrc: string;
  role: 'client' | 'driver' | 'carwash' | 'admin';
  approval_status: 'pending';
  approval_requested_at: string;
  created_by: string;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
    admin_level?: string;
  };
  [key: string]: any;
}

const PendingApprovals = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | null;
    user: PendingUser | null;
  }>({
    open: false,
    type: null,
    user: null,
  });

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await api.get('/admin/users/approvals/pending');
      return response.data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes?: string }) => {
      return api.post(`/admin/users/${userId}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setActionDialog({ open: false, type: null, user: null });
      setApprovalNotes('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return api.post(`/admin/users/${userId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      setActionDialog({ open: false, type: null, user: null });
      setRejectionReason('');
    },
  });

  const handleApprove = (user: PendingUser) => {
    setSelectedUser(user);
    setActionDialog({ open: true, type: 'approve', user });
  };

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user);
    setActionDialog({ open: true, type: 'reject', user });
  };

  const confirmApprove = () => {
    if (actionDialog.user) {
      approveMutation.mutate({
        userId: actionDialog.user.id,
        notes: approvalNotes.trim() || undefined,
      });
    }
  };

  const confirmReject = () => {
    if (actionDialog.user && rejectionReason.trim()) {
      rejectMutation.mutate({
        userId: actionDialog.user.id,
        reason: rejectionReason.trim(),
      });
    }
  };

  const getRoleBadgeClass = (role: string) => {
    return `role-badge role-${role}`;
  };

  const getAdminLevelLabel = (level?: string) => {
    if (!level) return '—';
    return level.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pending-approvals">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Pending User Approvals</h2>
          <div className="pending-count-badge">
            {pendingUsers?.length || 0}
          </div>
        </div>

        {!pendingUsers || pendingUsers.length === 0 ? (
          <EmptyState
            icon={<Icon name="checkCircle" size={28} />}
            title="No pending approvals"
            description="All user creation requests have been processed"
          />
        ) : (
          <div className="approvals-list">
            {pendingUsers.map((user: PendingUser) => (
              <div key={user.id} className="approval-card">
                <div className="approval-card-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <h3>{user.name}</h3>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>
                  <span className={getRoleBadgeClass(user.role)}>
                    {user.role}
                  </span>
                </div>

                <div className="approval-card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{user.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">NRC:</span>
                      <span className="info-value">{user.nrc}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Requested:</span>
                      <span className="info-value">
                        {formatDate(user.approval_requested_at)}
                      </span>
                    </div>
                    {user.created_by_user && (
                      <div className="info-item">
                        <span className="info-label">Created by:</span>
                        <span className="info-value">
                          {user.created_by_user.name}
                          {user.created_by_user.admin_level && (
                            <span className="creator-level">
                              {' '}({getAdminLevelLabel(user.created_by_user.admin_level)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {user.role === 'driver' && (
                      <>
                        {user.license_no && (
                          <div className="info-item">
                            <span className="info-label">License:</span>
                            <span className="info-value">{user.license_no}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className="info-item full-width">
                            <span className="info-label">Address:</span>
                            <span className="info-value">{user.address}</span>
                          </div>
                        )}
                      </>
                    )}
                    {user.role === 'carwash' && (
                      <>
                        {user.car_wash_name && (
                          <div className="info-item">
                            <span className="info-label">Car Wash Name:</span>
                            <span className="info-value">{user.car_wash_name}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="info-item full-width">
                            <span className="info-label">Location:</span>
                            <span className="info-value">{user.location}</span>
                          </div>
                        )}
                      </>
                    )}
                    {user.role === 'admin' && user.admin_level && (
                      <div className="info-item">
                        <span className="info-label">Admin Level:</span>
                        <span className="info-value">
                          {getAdminLevelLabel(user.admin_level)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="approval-card-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(user)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <Icon name="check" size={15} /> Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(user)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <Icon name="x" size={15} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      <ConfirmDialog
        open={actionDialog.open && actionDialog.type === 'approve'}
        title="Approve User"
        message={
          actionDialog.user
            ? `Approve ${actionDialog.user.name}? They will be able to access the system immediately.`
            : ''
        }
        onConfirm={confirmApprove}
        onCancel={() => {
          setActionDialog({ open: false, type: null, user: null });
          setApprovalNotes('');
        }}
        showReasonInput={true}
        reasonLabel="Approval Notes (Optional)"
        reasonValue={approvalNotes}
        onReasonChange={setApprovalNotes}
        confirmText="Approve"
        cancelText="Cancel"
      />

      {/* Rejection Dialog */}
      <ConfirmDialog
        open={actionDialog.open && actionDialog.type === 'reject'}
        title="Reject User"
        message={
          actionDialog.user
            ? `Reject ${actionDialog.user.name}? They will not be able to access the system.`
            : ''
        }
        onConfirm={confirmReject}
        onCancel={() => {
          setActionDialog({ open: false, type: null, user: null });
          setRejectionReason('');
        }}
        showReasonInput={true}
        reasonLabel="Rejection Reason *"
        reasonValue={rejectionReason}
        onReasonChange={setRejectionReason}
        confirmText="Reject"
        cancelText="Cancel"
        confirmDisabled={!rejectionReason.trim()}
      />
    </div>
  );
};

export default PendingApprovals;
