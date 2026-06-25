import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import UserModal from './UserModal';
import CreateUserModal from './CreateUserModal';
import ConfirmDialog from '../ConfirmDialog';
import ContextualHelp from './ContextualHelp';
import Icon from '../icons/Icon';
import { useToast } from '../ToastContainer';
import './UserManagement.css';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'driver' | 'carwash' | 'admin' | 'subadmin';
  adminLevel?: 'super_admin' | 'admin' | 'support';
  isActive: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  createdAt: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  created_by?: string;
  profilePictureUrl?: string;
  bio?: string;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    showReasonInput?: boolean;
    onConfirmWithReason?: (reason: string) => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data.data;
    },
    refetchOnMount: true, // Always refetch when component mounts
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return api.put(`/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setIsModalOpen(false);
      setSelectedUser(null);
      showToast('User updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update user', 'error');
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return api.post(`/admin/users/${userId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      setConfirmDialog({ ...confirmDialog, open: false });
      setSuspensionReason('');
      showToast('User suspended successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to suspend user', 'error');
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post(`/admin/users/${userId}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      setConfirmDialog({ ...confirmDialog, open: false });
      showToast('User reactivated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to reactivate user', 'error');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setConfirmDialog({ ...confirmDialog, open: false });
      showToast('User deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete user', 'error');
    },
  });

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phone?.includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((user) => user.isActive && !user.isSuspended);
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter((user) => user.isSuspended);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((user) => !user.isActive);
      }
    }

    // Approval status filter
    if (approvalFilter !== 'all') {
      filtered = filtered.filter((user) => {
        const approvalStatus = user.approval_status || 'approved';
        return approvalStatus === approvalFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleToggleActive = (user: User) => {
    setConfirmDialog({
      open: true,
      title: user.isActive ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`,
      onConfirm: () => {
        updateUserMutation.mutate({
          userId: user.id,
          data: { isActive: !user.isActive },
        });
      },
    });
  };

  const handleDelete = (user: User) => {
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      onConfirm: () => {
        deleteUserMutation.mutate(user.id);
      },
    });
  };

  const handleSuspend = (user: User) => {
    setConfirmDialog({
      open: true,
      title: 'Suspend User',
      message: `Suspend ${user.name}? They will not be able to access the system.`,
      showReasonInput: true,
      onConfirm: () => {
        if (suspensionReason.trim()) {
          suspendUserMutation.mutate({
            userId: user.id,
            reason: suspensionReason,
          });
        }
      },
    });
  };

  const handleReactivate = (user: User) => {
    setConfirmDialog({
      open: true,
      title: 'Reactivate User',
      message: `Reactivate ${user.name}? They will regain access to the system.`,
      onConfirm: () => {
        reactivateUserMutation.mutate(user.id);
      },
    });
  };

  const handleRoleChange = (user: User, newRole: string) => {
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      message: `Change ${user.name}'s role from ${user.role} to ${newRole}?`,
      onConfirm: () => {
        updateUserMutation.mutate({
          userId: user.id,
          data: { role: newRole },
        });
      },
    });
  };

  const handleAdminLevelChange = (user: User, newLevel: string) => {
    setConfirmDialog({
      open: true,
      title: 'Change Admin Level',
      message: `Change ${user.name}'s admin level to ${newLevel}?`,
      onConfirm: () => {
        updateUserMutation.mutate({
          userId: user.id,
          data: { adminLevel: newLevel },
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
    <div className="user-management">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">User Management</h2>
          <ContextualHelp sectionId="user-management" />
          <div className="admin-card-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsCreateModalOpen(true);
              }}
            >
              + Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="client">Clients</option>
            <option value="driver">Drivers</option>
            <option value="carwash">Car Washes</option>
            <option value="subadmin">Subadmins</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={<Icon name="user" size={28} />}
            title="No users found"
            description={searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No users in the system yet'}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable">
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Phone</th>
                  <th onClick={() => handleSort('role')} className="sortable">
                    Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Admin Level</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={!user.isActive ? 'inactive-row' : ''}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="" className="avatar-img" />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      {user.role === 'admin' && user.adminLevel ? (
                        <span className={`admin-level-badge level-${user.adminLevel}`}>
                          {user.adminLevel.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-tertiary">—</span>
                      )}
                    </td>
                    <td>
                      <div className="status-group">
                        <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {user.isSuspended && (
                          <span className="status-badge status-suspended" title={user.suspensionReason}>
                            Suspended
                          </span>
                        )}
                        {user.approval_status === 'pending' && (
                          <span className="status-badge status-pending" title="Awaiting approval">
                            Pending Approval
                          </span>
                        )}
                        {user.approval_status === 'rejected' && (
                          <span className="status-badge status-rejected" title="User was rejected">
                            Rejected
                          </span>
                        )}
                      </div>
                      {user.suspensionReason && (
                        <div className="suspension-reason" title={user.suspensionReason}>
                          {user.suspensionReason}
                        </div>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                          aria-label="Edit User"
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        {!user.isSuspended ? (
                          <button
                            className="btn-icon"
                            onClick={() => handleSuspend(user)}
                            title="Suspend User"
                            aria-label="Suspend User"
                          >
                            <Icon name="pause" size={16} />
                          </button>
                        ) : (
                          <button
                            className="btn-icon"
                            onClick={() => handleReactivate(user)}
                            title="Reactivate User"
                            aria-label="Reactivate User"
                          >
                            <Icon name="play" size={16} />
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          onClick={() => handleToggleActive(user)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          aria-label={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Icon name={user.isActive ? 'alertCircle' : 'checkCircle'} size={16} />
                        </button>
                        {user.role !== 'admin' && user.role !== 'subadmin' && (
                          <button
                            className="btn-icon"
                            onClick={() => handleRoleChange(user, 'subadmin')}
                            title="Make Subadmin"
                            aria-label="Make Subadmin"
                          >
                            <Icon name="shieldCheck" size={16} />
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            className="btn-icon"
                            onClick={() => handleRoleChange(user, 'admin')}
                            title="Make Admin"
                            aria-label="Make Admin"
                          >
                            <Icon name="crown" size={16} />
                          </button>
                        )}
                        {user.role === 'admin' && user.adminLevel !== 'super_admin' && (
                          <button
                            className="btn-icon"
                            onClick={() => handleAdminLevelChange(user, 'super_admin')}
                            title="Make Super Admin"
                            aria-label="Make Super Admin"
                          >
                            <Icon name="star" size={16} />
                          </button>
                        )}
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDelete(user)}
                          title="Delete User"
                          aria-label="Delete User"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="results-count">
            Showing {filteredUsers.length} of {users?.length || 0} users
          </span>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={async (requiresApproval) => {
            setIsCreateModalOpen(false);
            // Invalidate and immediately refetch user list to show new user
            await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            await queryClient.refetchQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
            // Also manually refetch to ensure immediate update
            refetch();
          }}
        />
      )}

      {/* Edit User Modal */}
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={(data) => {
            if (selectedUser) {
              updateUserMutation.mutate({ userId: selectedUser.id, data });
            }
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => {
          setConfirmDialog({ ...confirmDialog, open: false });
          setSuspensionReason('');
        }}
        showReasonInput={confirmDialog.showReasonInput}
        reasonValue={suspensionReason}
        onReasonChange={setSuspensionReason}
      />
    </div>
  );
};

export default UserManagement;
