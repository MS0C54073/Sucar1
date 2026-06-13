import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import './PaymentReviewModal.css';

interface PaymentReviewModalProps {
  bookingId: string;
  onConfirm: () => void;
  onClose: () => void;
  isConfirming?: boolean;
  onReject?: (reason: string) => void;
}

const PaymentReviewModal = ({
  bookingId,
  onConfirm,
  onClose,
  isConfirming = false,
  onReject,
}: PaymentReviewModalProps) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', bookingId],
    queryFn: async () => {
      const response = await api.get(`/payments/booking/${bookingId}`);
      return response.data.data;
    },
  });

  const proofUrl = payment?.proofUrl || payment?.proof_url;

  return (
    <div className="payment-review-overlay" onClick={onClose}>
      <div className="payment-review-modal" onClick={(e) => e.stopPropagation()}>
        <header className="payment-review-modal__header">
          <h2>Review payment</h2>
          <button type="button" className="payment-review-modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="payment-review-modal__body">
            <div className="payment-review-row">
              <span>Method</span>
              <strong>{payment?.method?.replace(/_/g, ' ') || '—'}</strong>
            </div>
            <div className="payment-review-row">
              <span>Amount</span>
              <strong>
                {payment?.amount != null
                  ? `K${parseFloat(String(payment.amount)).toFixed(2)}`
                  : '—'}
              </strong>
            </div>
            <div className="payment-review-row">
              <span>Status</span>
              <strong>{payment?.status || 'pending'}</strong>
            </div>
            {(payment?.transactionId || payment?.transaction_id) && (
              <div className="payment-review-row">
                <span>Transaction ID</span>
                <strong>{payment.transactionId || payment.transaction_id}</strong>
              </div>
            )}

            <div className="payment-review-proof">
              <span>Payment proof</span>
              {proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer">
                  <img src={proofUrl} alt="Payment receipt" className="payment-review-proof__img" />
                </a>
              ) : (
                <p className="payment-review-proof__empty">
                  No receipt uploaded. You can still confirm cash or in-person payments.
                </p>
              )}
            </div>
          </div>
        )}

        {showReject && onReject && (
          <div className="payment-review-reject">
            <label htmlFor="reject-reason">Reason for rejection</label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Receipt does not match amount"
            />
          </div>
        )}

        <footer className="payment-review-modal__footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {onReject && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (!showReject) {
                  setShowReject(true);
                  return;
                }
                if (!rejectReason.trim()) return;
                onReject(rejectReason.trim());
              }}
              disabled={isConfirming || isLoading}
            >
              {showReject ? (isConfirming ? 'Rejecting…' : 'Submit rejection') : 'Reject'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isConfirming || isLoading}
          >
            {isConfirming ? 'Confirming…' : 'Confirm payment'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PaymentReviewModal;
