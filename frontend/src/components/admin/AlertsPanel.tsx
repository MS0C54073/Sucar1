import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Icon, { type IconName } from '../icons/Icon';
import './AlertsPanel.css';

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  count: number;
  message: string;
  action: string;
}

const AlertsPanel = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const response = await api.get('/admin/alerts');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (alert: Alert) => {
      return api.post('/admin/incidents', {
        title: alert.message,
        description: `${alert.message}. This incident was auto-created from a system alert.`,
        type: alert.type === 'stuck_bookings' ? 'failed_booking' : 'failed_transaction',
        severity: alert.severity === 'error' ? 'high' : 'medium',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      navigate(`/admin/incidents/${data.data.data.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="alerts-panel-loading">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-panel empty">
        <div className="alert-icon"><Icon name="checkCircle" size={26} /></div>
        <div className="alert-message">All systems operational</div>
      </div>
    );
  }

  const getSeverityClass = (severity: string) => {
    return `alert-severity-${severity}`;
  };

  const getSeverityIcon = (severity: string): IconName => {
    if (severity === 'error') return 'alertCircle';
    if (severity === 'warning') return 'alertTriangle';
    return 'info';
  };



  const handleCreateIncidentFromAlert = (alert: Alert) => {
    if (window.confirm(`Create an incident for: ${alert.message}?`)) {
      createIncidentMutation.mutate(alert);
    }
  };

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h3>System Alerts</h3>
        <span className="alerts-count">{alerts.length}</span>
      </div>
      <div className="alerts-list">
        {alerts.map((alert: Alert, index: number) => (
          <div
            key={index}
            className={`alert-item ${getSeverityClass(alert.severity)}`}
            onClick={() => {
              if (alert.action) {
                navigate(alert.action);
              } else if (alert.type === 'stuck_bookings' || alert.type === 'failed_payments') {
                // Auto-create incident for critical alerts
                handleCreateIncidentFromAlert(alert);
              }
            }}
          >
            <div className="alert-icon-small"><Icon name={getSeverityIcon(alert.severity)} size={18} /></div>
            <div className="alert-content">
              <div className="alert-message">{alert.message}</div>
              {alert.action && (
                <div className="alert-action-hint">Click to view <Icon name="arrowRight" size={13} /></div>
              )}
            </div>
            {alert.count > 1 && (
              <div className="alert-badge">{alert.count}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;
