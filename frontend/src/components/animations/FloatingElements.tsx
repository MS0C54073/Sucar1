import React from 'react';
import './FloatingElements.css';

interface FloatingElementsProps {
  type?: 'cars' | 'bubbles' | 'sparkles';
  count?: number;
  intensity?: 'low' | 'medium' | 'high';
}

const FloatingElements: React.FC<FloatingElementsProps> = ({
  type = 'bubbles',
  count = 5,
  intensity = 'medium',
}) => {
  const speedMap = {
    low: 8,
    medium: 6,
    high: 4,
  };

  const animationSpeed = speedMap[intensity];

  return (
    <div className={`floating-elements floating-${type}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const delay = i * 0.5;
        const leftPosition = (100 / (count + 1)) * (i + 1);
        const size = 20 + (i % 3) * 10;

        return (
          <div
            key={`float-${i}`}
            className={`floating-element floating-${type}-element`}
            style={{
              '--animation-speed': `${animationSpeed + i}s`,
              '--animation-delay': `${delay}s`,
              '--left-position': `${leftPosition}%`,
              '--element-size': `${size}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export default React.memo(FloatingElements);
