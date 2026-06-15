import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';
import Icon, { type IconName } from '../components/icons/Icon';
import './Payment.css';

const MAX_PROOF_BYTES = 2 * 1024 * 1024;

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [methodLabel, setMethodLabel] = useState('Cash Payment');
  const pollTimer = useRef<number | undefined>(undefined);

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data.data;
    },
    enabled: !!bookingId,
  });

  const { data: payment } = useQuery({
    queryKey: ['payment', bookingId],
    queryFn: async () => {
      const response = await api.get(`/payments/booking/${bookingId}`);
      return response.data.data;
    },
    enabled: !!bookingId,
    retry: false,
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (data: {
      bookingId: string;
      method: string;
      transactionId?: string;
      proofUrl?: string;
    }) => {
      const response = await api.post('/payments/initiate', data);
      return response.data;
    },
    onSuccess: () => {
      setAwaitingConfirmation(true);
      const label =
        paymentMethods.find((m) => m.value === paymentMethod)?.label || 'Payment';
      setMethodLabel(label);
      queryClient.invalidateQueries({ queryKey: ['payment', bookingId] });

      if (!pollTimer.current && bookingId) {
        const t = window.setInterval(async () => {
          try {
            const res = await api.get(`/payments/booking/${bookingId}`);
            const p = res.data?.data;
            if (p?.status === 'completed') {
              window.clearInterval(t);
              pollTimer.current = undefined;
              setConfirmed(true);
              setAwaitingConfirmation(false);
              queryClient.invalidateQueries({ queryKey: ['bookings'] });
            }
          } catch {
            /* keep polling */
          }
        }, 2000);
        pollTimer.current = t as unknown as number;
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to submit payment', 'error');
    },
  });

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image (PNG, JPG, or screenshot)', 'error');
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      showToast('Image must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    if (paymentMethod !== 'cash' && !proofPreview && !transactionId.trim()) {
      showToast('Add a transaction reference or upload a payment screenshot', 'error');
      return;
    }

    initiatePaymentMutation.mutate({
      bookingId,
      method: paymentMethod,
      transactionId: transactionId.trim() || undefined,
      proofUrl: proofPreview || undefined,
    });
  };

  useEffect(() => {
    if (payment?.status === 'completed') {
      setConfirmed(true);
      setAwaitingConfirmation(false);
    }
  }, [payment?.status]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = undefined;
      }
    };
  }, []);

  const paymentMethods: { value: string; label: string; icon: IconName; description: string }[] = [
    { value: 'cash', label: 'Cash Payment', icon: 'wallet', description: 'Pay with cash on delivery' },
    { value: 'card', label: 'Card Payment', icon: 'creditCard', description: 'Credit or debit card' },
    {
      value: 'mobile_money',
      label: 'Mobile Money',
      icon: 'smartphone',
      description: 'Pay using Mobile Money (e.g., Airtel, MTN)',
    },
    {
      value: 'bank_transfer',
      label: 'Bank Transfer',
      icon: 'building',
      description: 'Direct bank transfer',
    },
  ];

  if (!booking) {
    return (
      <div className="payment-loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="payment-page">
      <header className="payment-header">
        <button type="button" className="back-button" onClick={() => navigate('/client')}>
          <Icon name="arrowLeft" size={16} /> Back
        </button>
        <div className="header-content">
          <h1>Complete Payment</h1>
          <p className="header-subtitle">Secure payment for your booking</p>
        </div>
      </header>

      <div className="payment-content">
        <div className="booking-summary-card">
          <h2 className="summary-title">Booking Summary</h2>
          <div className="summary-details">
            <div className="summary-row">
              <span className="summary-label">Car Wash:</span>
              <span className="summary-value">
                {booking.carWashId?.carWashName || booking.carWashId?.name}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Service:</span>
              <span className="summary-value">{booking.serviceId?.name}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Vehicle:</span>
              <span className="summary-value">
                {booking.vehicleId?.make} {booking.vehicleId?.model} - {booking.vehicleId?.plateNo}
              </span>
            </div>
            <div className="summary-row total">
              <span className="summary-label">Total Amount:</span>
              <span className="summary-value amount">
                K{parseFloat(booking.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {!awaitingConfirmation && !confirmed && (
          <form onSubmit={handleSubmit} className="payment-form">
            <h3 className="form-title">Select Payment Method</h3>

            <div className="payment-methods">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`payment-method-option ${
                    paymentMethod === method.value ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="method-radio"
                  />
                  <div className="method-icon"><Icon name={method.icon} size={22} /></div>
                  <div className="method-content">
                    <div className="method-label">{method.label}</div>
                    <div className="method-description">{method.description}</div>
                  </div>
                  <div className="method-check"><Icon name="check" size={16} /></div>
                </label>
              ))}
            </div>

            {paymentMethod !== 'cash' && (
              <div className="form-group">
                <label className="form-label">Transaction reference</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. mobile money confirmation code"
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group payment-proof-upload">
              <label className="form-label">
                Payment receipt / screenshot
                {paymentMethod !== 'cash' && <span className="required"> *</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleProofChange}
                className="form-input"
              />
              <p className="form-hint">
                Upload a screenshot of your payment (max 2MB). Required for mobile money and bank
                transfer.
              </p>
              {proofPreview && (
                <img src={proofPreview} alt="Payment proof preview" className="payment-proof-preview" />
              )}
            </div>

            {paymentMethod === 'cash' && (
              <div className="payment-info">
                <div className="info-icon"><Icon name="info" size={18} /></div>
                <div className="info-content">
                  <strong>Cash Payment</strong>
                  <p>Pay the driver or car wash in cash. You can optionally upload proof below.</p>
                </div>
              </div>
            )}

            {/* Inline submit — visible without scrolling on short screens */}
            <div className="form-actions form-actions--inline">
              <button
                type="submit"
                className="payment-submit-btn"
                disabled={initiatePaymentMutation.isPending}
              >
                {initiatePaymentMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <span>Submit payment & receipt</span>
                    <span className="btn-arrow" aria-hidden>
                      <Icon name="arrowRight" size={16} />
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {awaitingConfirmation && !confirmed && (
          <div className="payment-wait">
            <h3>Awaiting {methodLabel} confirmation</h3>
            <p>The driver or car wash will review your payment and confirm shortly.</p>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
            <p className="hint">This page updates automatically once confirmed.</p>
          </div>
        )}

        {confirmed && (
          <div className="payment-success">
            <div className="success-icon"><Icon name="checkCircle" size={28} /></div>
            <h3>Payment confirmed</h3>
            <p>Your payment has been confirmed. Thank you.</p>
            <div className="post-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/client')}>
                Go to Home
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/client/book')}
              >
                Make new booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
