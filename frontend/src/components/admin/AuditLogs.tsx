import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import Icon, { type IconName } from '../icons/Icon';
import './AuditLogs.css';

interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  adminEmail?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
}

const AuditLogs = () => {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', actionFilter, entityFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('actionType', actionFilter);
      if (entityFilter !== 'all') params.append('entityType', entityFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('limit', '500');

      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      return response.data.data;
    },
  });

  const filteredLogs = useMemo(() => {
    return logs || [];
  }, [logs]);

  const actionTypes = [
    'all',
    'user_created',
    'user_updated',
    'user_deleted',
    'user_suspended',
    'user_reactivated',
    'role_changed',
    'admin_level_changed',
    'booking_created',
    'booking_updated',
    'booking_cancelled',
    'payment_processed',
  ];

  const formatActionType = (action: string): string => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionIcon = (action: string): IconName => {
    if (action.includes('suspended')) return 'pause';
    if (action.includes('reactivated')) return 'play';
    if (action.includes('deleted')) return 'trash';
    if (action.includes('created')) return 'plus';
    if (action.includes('updated')) return 'pencil';
    if (action.includes('role') || action.includes('level')) return 'crown';
    if (action.includes('payment')) return 'creditCard';
    return 'fileText';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="audit-logs">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Activity & Audit Logs</h2>
          <p className="card-subtitle">Read-only audit trail of all admin actions</p>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Actions</option>
            {actionTypes
              .filter((t) => t !== 'all')
              .map((type) => (
                <option key={type} value={type}>
                  {formatActionType(type)}
                </option>
              ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Entities</option>
            <option value="user">Users</option>
            <option value="booking">Bookings</option>
            <option value="payment">Payments</option>
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
            placeholder="End Date"
          />
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={<Icon name="clipboard" size={28} />}
            title="No audit logs found"
            description="No activity matches your filters"
          />
        ) : (
          <div className="logs-container">
            <div className="logs-list">
              {filteredLogs.map((log: AuditLog) => (
                <div key={log.id} className="log-entry">
                  <div className="log-header">
                    <div className="log-icon"><Icon name={getActionIcon(log.actionType)} size={18} /></div>
                    <div className="log-info">
                      <div className="log-action">{formatActionType(log.actionType)}</div>
                      <div className="log-meta">
                        <span className="log-admin">
                          {log.adminName || log.adminEmail || 'System'}
                        </span>
                        <span className="log-separator">•</span>
                        <span className="log-time">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="log-description">{log.description}</div>
                  {log.entityType && (
                    <div className="log-entity">
                      <span className="entity-type">{log.entityType}</span>
                      {log.entityId && (
                        <span className="entity-id">ID: {log.entityId.substring(0, 8)}...</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-footer">
          <span className="results-count">
            Showing {filteredLogs.length} log entries
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
