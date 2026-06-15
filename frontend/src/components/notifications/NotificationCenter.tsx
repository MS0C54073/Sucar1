import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import Icon, { type IconName } from '../icons/Icon';
import { getChatPath } from '../../utils/chatPaths';
import './NotificationCenter.css';

interface Notification {
  id: string;
  type: 'booking_update' | 'payment' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  createdAt: string;
  metadata?: any;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, filter],
    queryFn: async () => {
      // Fetch real notifications from the new endpoint
      const response = await api.get('/notifications', { params: { filter } });
      const rawNotifs = response.data.data || [];

      // Map backend notifications to UI format
      return rawNotifs.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.is_read || false,
        priority: n.priority || 'medium',
        actionUrl:
          n.type === 'message' && n.data?.bookingId
            ? getChatPath(user?.role, n.data.bookingId)
            : n.type === 'payment' && n.data?.bookingId
              ? user?.role === 'client'
                ? `/client/payment/${n.data.bookingId}`
                : user?.role === 'driver'
                  ? '/driver'
                  : user?.role === 'carwash'
                    ? '/carwash'
                    : '/client'
              : user?.role === 'admin'
                ? '/admin'
                : user?.role === 'driver'
                  ? '/driver'
                  : user?.role === 'carwash'
                    ? '/carwash'
                    : '/client',
        createdAt: n.created_at,
        metadata: n.data,
      })).sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // Use the new backend endpoint
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Use the new backend endpoint
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const unreadCount = notifications?.filter((n: Notification) => !n.read).length || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getPriorityClass = (priority: string) => {
    return `priority-${priority}`;
  };

  const getTypeIcon = (type: string): IconName => {
    switch (type) {
      case 'booking_update':
        return 'clipboard';
      case 'payment':
        return 'creditCard';
      case 'system':
        return 'settings';
      case 'promotion':
        return 'partyPopper';
      case 'message':
        return 'messageCircle';
      default:
        return 'bell';
    }
  };

  return (
    <>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className="bell-icon"><Icon name="bell" size={20} /></span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="btn btn-text btn-sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                >
                  Mark all as read
                </button>
              )}
              <button
                className="notification-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="notification-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>

            <div className="notification-list">
              {isLoading ? (
                <div className="notification-loading">
                  <LoadingSpinner size="sm" />
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <EmptyState
                  icon={<Icon name="bell" size={28} />}
                  title="No notifications"
                  description={
                    filter === 'unread'
                      ? 'You\'re all caught up!'
                      : 'You don\'t have any notifications yet'
                  }
                />
              ) : (
                notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${getPriorityClass(notification.priority)} ${!notification.read ? 'unread' : ''
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon"><Icon name={getTypeIcon(notification.type)} size={18} /></div>
                    <div className="notification-content">
                      <div className="notification-title-row">
                        <h4 className="notification-title">{notification.title}</h4>
                        {!notification.read && <span className="unread-dot" />}
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {notification.priority === 'urgent' && (
                      <span className="priority-indicator">!</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NotificationCenter;
