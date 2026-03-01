import React from 'react';
import CarAnimation from './CarAnimation';
import './BackgroundCars.css';

interface BackgroundCarsProps {
  count?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

const BackgroundCars: React.FC<BackgroundCarsProps> = ({ 
  count = 5,
  speed = 'normal' 
}) => {
  const speedMap = {
    slow: 25,
    normal: 20,
    fast: 15,
  };

  const animationSpeed = speedMap[speed];

  return (
    <div className="background-cars" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const direction = i % 2 === 0 ? 'right' : 'left';
        const size = i % 3 === 0 ? 'small' : i % 3 === 1 ? 'medium' : 'large';
        const delay = i * 3;
        const bottomPosition = 15 + (i % 3) * 8; // Stagger vertically

        return (
          <div
            key={`bg-car-${i}`}
            className="background-car-track"
            style={{
              '--track-bottom': `${bottomPosition}%`,
            } as React.CSSProperties}
          >
            <CarAnimation
              variant="driving"
              direction={direction}
              size={size}
              speed={animationSpeed + i * 2}
              delay={delay}
            />
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(BackgroundCars);
