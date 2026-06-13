import { useState } from 'react';
import './StarRating.css';

interface StarRatingProps {
  value: number;
  /** When provided, the stars become interactive */
  onChange?: (value: number) => void;
  /** Star size in pixels */
  size?: number;
  /** Show the numeric value next to the stars */
  showValue?: boolean;
  /** Optional count of reviews, rendered as "(N)" */
  count?: number;
  className?: string;
  ariaLabel?: string;
}

const Star = ({ fill, size }: { fill: number; size: number }) => {
  // fill is 0..1 for partial stars
  const clip = `inset(0 ${100 - Math.round(fill * 100)}% 0 0)`;
  return (
    <span className="star" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="star__bg" aria-hidden="true">
        <path d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57L2.46 9.44l6.6-.96L12 2.5z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="star__fg"
        style={{ clipPath: clip, WebkitClipPath: clip }}
        aria-hidden="true"
      >
        <path d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57L2.46 9.44l6.6-.96L12 2.5z" />
      </svg>
    </span>
  );
};

const StarRating = ({
  value,
  onChange,
  size = 18,
  showValue = false,
  count,
  className,
  ariaLabel,
}: StarRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = typeof onChange === 'function';
  const display = hover ?? value;

  return (
    <span
      className={`star-rating${interactive ? ' star-rating--interactive' : ''}${className ? ` ${className}` : ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={ariaLabel || `Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, display - (star - 1)));
        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              className="star-rating__btn"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange!(star)}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              aria-pressed={value === star}
            >
              <Star fill={fill} size={size} />
            </button>
          );
        }
        return <Star key={star} fill={fill} size={size} />;
      })}
      {showValue && value > 0 && <span className="star-rating__value">{value.toFixed(1)}</span>}
      {typeof count === 'number' && count > 0 && (
        <span className="star-rating__count">({count})</span>
      )}
    </span>
  );
};

export default StarRating;
