import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../ToastContainer';
import StarRating from './StarRating';
import './ReviewModal.css';

interface ExistingReview {
  carWashRating?: number | null;
  driverRating?: number | null;
  comment?: string | null;
}

interface ReviewModalProps {
  bookingId: string;
  carWashName?: string;
  driverName?: string;
  hasDriver?: boolean;
  existingReview?: ExistingReview | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

const ReviewModal = ({
  bookingId,
  carWashName,
  driverName,
  hasDriver,
  existingReview,
  onClose,
  onSubmitted,
}: ReviewModalProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [carWashRating, setCarWashRating] = useState<number>(existingReview?.carWashRating || 0);
  const [driverRating, setDriverRating] = useState<number>(existingReview?.driverRating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');

  const isEditing = !!existingReview;

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/reviews', {
        bookingId,
        carWashRating: carWashRating || undefined,
        driverRating: hasDriver && driverRating ? driverRating : undefined,
        comment: comment.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-review', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast(isEditing ? 'Review updated. Thank you!' : 'Thanks for your feedback!', 'success');
      onSubmitted?.();
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Could not submit your review', 'error');
    },
  });

  const canSubmit = carWashRating > 0 || (hasDriver && driverRating > 0);

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="review-modal__header">
          <h3>{isEditing ? 'Edit your review' : 'Rate your wash'}</h3>
          <button type="button" className="review-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="review-modal__body">
          <div className="review-field">
            <span className="review-field__label">
              {carWashName ? `How was ${carWashName}?` : 'How was the car wash?'}
            </span>
            <StarRating value={carWashRating} onChange={setCarWashRating} size={32} />
          </div>

          {hasDriver && (
            <div className="review-field">
              <span className="review-field__label">
                {driverName ? `How was your driver, ${driverName}?` : 'How was your driver?'}
              </span>
              <StarRating value={driverRating} onChange={setDriverRating} size={32} />
            </div>
          )}

          <div className="review-field">
            <label className="review-field__label" htmlFor="review-comment">
              Add a comment (optional)
            </label>
            <textarea
              id="review-comment"
              className="review-modal__textarea"
              value={comment}
              maxLength={500}
              placeholder="Tell others what stood out — clean finish, fast service, friendly staff…"
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <span className="review-modal__counter">{comment.length}/500</span>
          </div>
        </div>

        <div className="review-modal__actions">
          <button type="button" className="review-btn review-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="review-btn review-btn--primary"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Submitting…' : isEditing ? 'Update review' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
