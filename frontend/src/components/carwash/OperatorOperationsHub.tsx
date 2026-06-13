import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import PaymentReviewModal from '../payment/PaymentReviewModal';
import {
  useOperatorDashboard,
  type BayPanelItem,
  type QueuePanelItem,
  type PendingPaymentItem,
} from '../../hooks/useOperatorDashboard';
import './OperatorOperationsHub.css';

function formatWaitMinutes(iso?: string): string {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.max(0, Math.ceil(diff / 60000));
  if (mins < 60) return `~${mins} min`;
  return `~${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function bookingLabel(booking?: Record<string, unknown>): string {
  if (!booking) return 'Vehicle';
  const vehicle = booking.vehicle as Record<string, unknown> | undefined;
  const client = booking.client as Record<string, unknown> | undefined;
  const plate = vehicle?.plate_no || vehicle?.plateNo;
  const make = vehicle?.make;
  const model = vehicle?.model;
  const name = client?.name;
  if (plate) return `${plate}${name ? ` · ${name}` : ''}`;
  if (make || model) return `${make || ''} ${model || ''}`.trim();
  return name ? String(name) : 'Booking';
}

function serviceLabel(booking?: Record<string, unknown>): string {
  const service = booking?.service as Record<string, unknown> | undefined;
  return (service?.name as string) || 'Standard wash';
}

const OperatorOperationsHub = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useOperatorDashboard();
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['operations-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['queue'] });
  };

  const startBay = useMutation({
    mutationFn: (bayId: string) => api.post(`/operations/bays/${bayId}/start`),
    onSuccess: invalidate,
  });

  const completeBay = useMutation({
    mutationFn: (bayId: string) => api.post(`/operations/bays/${bayId}/complete`),
    onSuccess: invalidate,
  });

  const assignNext = useMutation({
    mutationFn: () => api.post('/operations/assign-next'),
    onSuccess: invalidate,
  });

  const approvePayment = useMutation({
    mutationFn: (bookingId: string) =>
      api.post(`/operations/payments/${bookingId}/approve`),
    onSuccess: () => {
      setReviewBookingId(null);
      invalidate();
    },
  });

  const rejectPayment = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      api.post(`/operations/payments/${bookingId}/reject`, { reason }),
    onSuccess: () => {
      setReviewBookingId(null);
      invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="ops-hub-loading">
        <LoadingSpinner size="lg" />
        <p>Loading operations dashboard…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ops-hub-error">
        <p>Could not load dashboard.</p>
        <p className="ops-hub-error__detail">{(error as Error)?.message}</p>
        <button type="button" className="btn btn-primary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const metrics = data?.activity?.metrics;
  const waitingQueue = (data?.queue || []).filter(
    (q) => q.operationalStatus === 'WAITING' || !q.operationalStatus
  );

  return (
    <div className="ops-hub">
      {data?.legacyMode && (
        <div className="ops-hub__banner" role="status">
          <strong>Limited mode:</strong>{' '}
          {data.setupHint ||
            'Apply the operator database migration for full bay assignment and realtime queue.'}
        </div>
      )}

      <header className="ops-hub__header">
        <div>
          <h2>Live operations</h2>
          <p className="ops-hub__sub">
            Bays, queue, and payments update automatically
            {isFetching ? ' · syncing…' : ''}
          </p>
        </div>
        <div className="ops-hub__metrics">
          <span className="ops-metric">
            <strong>{metrics?.availableBays ?? 0}</strong> bays free
          </span>
          <span className="ops-metric">
            <strong>{metrics?.waiting ?? 0}</strong> waiting
          </span>
          <span className="ops-metric">
            <strong>{metrics?.inWash ?? 0}</strong> in wash
          </span>
          {metrics?.delayed ? (
            <span className="ops-metric ops-metric--warn">
              <strong>{metrics.delayed}</strong> delayed
            </span>
          ) : null}
        </div>
        {!data?.legacyMode && (
          <button
            type="button"
            className="btn btn-secondary ops-hub__assign-btn"
            onClick={() => assignNext.mutate()}
            disabled={assignNext.isPending}
          >
            Assign next to bay
          </button>
        )}
      </header>

      <div className="ops-hub__grid">
        <section className="ops-panel" aria-labelledby="ops-bays-title">
          <h3 id="ops-bays-title">Washing bays</h3>
          {!data?.bays?.length ? (
            <p className="ops-panel__empty">No bays configured.</p>
          ) : (
            <ul className="ops-bay-list">
              {data.bays.map((bay: BayPanelItem) => (
                <li key={bay.id} className={`ops-bay-card ops-bay-card--${bay.status}`}>
                  <div className="ops-bay-card__head">
                    <span className="ops-bay-card__name">{bay.name || `Bay ${bay.bayNumber}`}</span>
                    <span className={`ops-bay-card__status ops-status--${bay.status}`}>
                      {bay.status}
                    </span>
                  </div>
                  {bay.operationalStatus && bay.status === 'occupied' ? (
                    <>
                      <p className="ops-bay-card__vehicle">
                        {bay.plateNo || bay.clientName || 'Assigned vehicle'}
                      </p>
                      <p className="ops-bay-card__meta">
                        {bay.operationalStatus.replace(/_/g, ' ')}
                        {bay.remainingMinutes != null ? ` · ${bay.remainingMinutes} min left` : ''}
                      </p>
                      <p className="ops-bay-card__payment">
                        Payment: {bay.paymentStatus || 'pending'}
                      </p>
                      <div className="ops-bay-card__actions">
                        {bay.operationalStatus === 'ASSIGNED_TO_BAY' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => startBay.mutate(bay.id)}
                            disabled={startBay.isPending}
                          >
                            Start wash
                          </button>
                        )}
                        {!data?.legacyMode &&
                          ['WASH_IN_PROGRESS', 'ASSIGNED_TO_BAY'].includes(
                            bay.operationalStatus || ''
                          ) && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (confirm('Mark wash complete on this bay?')) {
                                completeBay.mutate(bay.id);
                              }
                            }}
                            disabled={completeBay.isPending}
                          >
                            Complete wash
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="ops-bay-card__idle">Ready for next vehicle</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ops-panel" aria-labelledby="ops-queue-title">
          <h3 id="ops-queue-title">Live queue</h3>
          {!waitingQueue.length ? (
            <p className="ops-panel__empty">No vehicles waiting. Check in from Bookings.</p>
          ) : (
            <ol className="ops-queue-list">
              {waitingQueue.map((entry: QueuePanelItem) => (
                <li key={entry.id} className="ops-queue-item">
                  <span className="ops-queue-item__pos">#{entry.position}</span>
                  <div className="ops-queue-item__body">
                    <strong>{bookingLabel(entry.booking)}</strong>
                    <span className="ops-queue-item__service">{serviceLabel(entry.booking)}</span>
                    <span className="ops-queue-item__wait">
                      Est. wait: {formatWaitMinutes(entry.estimatedStart)}
                    </span>
                  </div>
                  <div className="ops-queue-item__tags">
                    {entry.isExpress && <span className="ops-tag ops-tag--express">Express</span>}
                    {entry.priority > 0 && (
                      <span className="ops-tag ops-tag--vip">Priority {entry.priority}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="ops-panel" aria-labelledby="ops-payments-title">
          <h3 id="ops-payments-title">Payment verification</h3>
          {!data?.pendingPayments?.length ? (
            <p className="ops-panel__empty">No pending payments to review.</p>
          ) : (
            <ul className="ops-payment-list">
              {data.pendingPayments.map((p: PendingPaymentItem) => {
                const bookingId = p.bookingId || p.booking_id || '';
                const proof = p.proofUrl || p.proof_url;
                return (
                  <li key={p.id} className="ops-payment-item">
                    <div>
                      <strong>{bookingLabel(p.booking as Record<string, unknown>)}</strong>
                      <p>
                        K{parseFloat(String(p.amount || 0)).toFixed(2)} · {p.method} ·{' '}
                        {proof ? 'Receipt uploaded' : 'No receipt'}
                      </p>
                      <p className="ops-payment-item__time">
                        {p.createdAt || p.created_at
                          ? new Date(String(p.createdAt || p.created_at)).toLocaleString()
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setReviewBookingId(bookingId)}
                    >
                      Review
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ops-panel" aria-labelledby="ops-activity-title">
          <h3 id="ops-activity-title">Operator activity</h3>
          <ul className="ops-activity-stats">
            <li>
              <span>Active sessions</span>
              <strong>{data?.activity?.activeSessions?.length ?? 0}</strong>
            </li>
            <li>
              <span>Completed today</span>
              <strong>{data?.activity?.completedToday ?? 0}</strong>
            </li>
            <li>
              <span>Bay utilization</span>
              <strong>{Math.round((metrics?.utilization ?? 0) * 100)}%</strong>
            </li>
          </ul>
          {(data?.activity?.activeSessions?.length ?? 0) > 0 && (
            <ul className="ops-session-list">
              {data!.activity.activeSessions.map((s) => (
                <li key={String(s.id)} className="ops-session-item">
                  <span>{String(s.operational_status || '').replace(/_/g, ' ')}</span>
                  <span className="ops-session-item__id">Session {String(s.id).slice(0, 8)}…</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {reviewBookingId && (
        <PaymentReviewModal
          bookingId={reviewBookingId}
          onClose={() => setReviewBookingId(null)}
          isConfirming={approvePayment.isPending || rejectPayment.isPending}
          onConfirm={() => approvePayment.mutate(reviewBookingId)}
          onReject={(reason) => rejectPayment.mutate({ bookingId: reviewBookingId, reason })}
        />
      )}
    </div>
  );
};

export default OperatorOperationsHub;
