import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import './QueueManagement.css';

const QueueManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [newDuration, setNewDuration] = useState<number>(30);

  // Get queue for this car wash
  const { data: queue, isLoading } = useQuery({
    queryKey: ['queue', user?.id],
    queryFn: async () => {
      const response = await api.get(`/queue/carwash/${user?.id}`);
      return response.data.data || [];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Start service mutation
  const startServiceMutation = useMutation({
    mutationFn: async (queueId: string) => {
      await api.put(`/queue/${queueId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  // Complete service mutation
  const completeServiceMutation = useMutation({
    mutationFn: async (queueId: string) => {
      await api.put(`/queue/${queueId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  // Update duration mutation
  const updateDurationMutation = useMutation({
    mutationFn: async ({ queueId, duration }: { queueId: string; duration: number }) => {
      await api.put(`/queue/${queueId}/duration`, { durationMinutes: duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', user?.id] });
      setEditingDuration(null);
    },
  });

  const handleStartService = (queueId: string) => {
    if (confirm('Start service for this vehicle?')) {
      startServiceMutation.mutate(queueId);
    }
  };

  const handleCompleteService = (queueId: string) => {
    if (confirm('Mark this service as completed?')) {
      completeServiceMutation.mutate(queueId);
    }
  };

  const handleUpdateDuration = (queueId: string) => {
    if (newDuration < 1 || newDuration > 300) {
      alert('Duration must be between 1 and 300 minutes');
      return;
    }
    updateDurationMutation.mutate({ queueId, duration: newDuration });
  };

  if (isLoading) {
    return (
      <div className="queue-loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeQueue = (queue || []).filter((q: { status: string }) => q.status !== 'completed');

  if (!activeQueue.length) {
    return (
      <div className="queue-empty operator-queue-empty">
        <p className="operator-queue-empty__title">No vehicles in the service queue</p>
        <p className="operator-queue-empty__hint">
          Open the <strong>Bookings</strong> tab, confirm arrival for drive-in customers, or tap{' '}
          <strong>Add to queue</strong> on a booking card.
        </p>
      </div>
    );
  }

  return (
    <div className="queue-management">
      <div className="queue-header">
        <h3>Service Queue</h3>
        <div className="queue-stats">
          <span className="stat-item">
            Total: <strong>{activeQueue.length}</strong>
          </span>
          <span className="stat-item">
            Waiting: <strong>{activeQueue.filter((q: any) => q.status === 'waiting').length}</strong>
          </span>
          <span className="stat-item">
            In Progress:{' '}
            <strong>{activeQueue.filter((q: any) => q.status === 'in_progress').length}</strong>
          </span>
        </div>
      </div>

      <div className="queue-list">
        {activeQueue.map((queueEntry: any) => {
          const booking = queueEntry.booking;
          const estimatedStart = queueEntry.estimated_start_time
            ? new Date(queueEntry.estimated_start_time)
            : null;
          const estimatedCompletion = queueEntry.estimated_completion_time
            ? new Date(queueEntry.estimated_completion_time)
            : null;

          return (
            <div
              key={queueEntry.id}
              className={`queue-item ${queueEntry.status === 'in_progress' ? 'active' : ''} ${queueEntry.status === 'completed' ? 'completed' : ''}`}
            >
              <div className="queue-item-header">
                <div className="queue-position">
                  <span className="position-number">{queueEntry.position}</span>
                  <span className="position-label">Position</span>
                </div>
                <div className="queue-status-badge">
                  <span className={`status-badge status-${queueEntry.status}`}>
                    {queueEntry.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="queue-item-body">
                <div className="queue-vehicle-info">
                  <h4>
                    {booking?.vehicle?.make} {booking?.vehicle?.model} - {booking?.vehicle?.plateNo}
                  </h4>
                  <p className="client-name">Client: {booking?.client?.name}</p>
                  <p className="service-name">Service: {booking?.serviceId?.name || 'N/A'}</p>
                </div>

                <div className="queue-timing">
                  {estimatedStart && (
                    <div className="time-item">
                      <span className="time-label">Start Time</span>
                      <span className="time-value">
                        {estimatedStart.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  {estimatedCompletion && queueEntry.status === 'in_progress' && (
                    <div className="time-item">
                      <span className="time-label">Completion</span>
                      <span className="time-value">
                        {estimatedCompletion.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="time-item">
                    <span className="time-label">Duration</span>
                    {editingDuration === queueEntry.id ? (
                      <div className="duration-edit">
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={newDuration}
                          onChange={(e) => setNewDuration(parseInt(e.target.value) || 30)}
                          className="duration-input"
                        />
                        <button
                          className="duration-save"
                          onClick={() => handleUpdateDuration(queueEntry.id)}
                        >
                          Save
                        </button>
                        <button
                          className="duration-cancel"
                          onClick={() => {
                            setEditingDuration(null);
                            setNewDuration(30);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className="time-value duration-value"
                        onClick={() => {
                          setEditingDuration(queueEntry.id);
                          setNewDuration(queueEntry.service_duration_minutes || 30);
                        }}
                      >
                        {queueEntry.service_duration_minutes || 30} min
                        <span className="edit-hint"> (click to edit)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="queue-item-actions">
                {queueEntry.status === 'waiting' && (
                  <button
                    className="action-btn start-btn"
                    onClick={() => handleStartService(queueEntry.id)}
                    disabled={startServiceMutation.isPending}
                  >
                    Start Service
                  </button>
                )}
                {queueEntry.status === 'in_progress' && (
                  <button
                    className="action-btn complete-btn"
                    onClick={() => handleCompleteService(queueEntry.id)}
                    disabled={completeServiceMutation.isPending}
                  >
                    Complete Service
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QueueManagement;
