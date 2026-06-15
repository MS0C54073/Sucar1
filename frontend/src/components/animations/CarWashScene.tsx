import React from 'react';
import CarAnimation from './CarAnimation';
import Icon from '../icons/Icon';
import './CarWashScene.css';

interface CarWashSceneProps {
  intensity?: 'low' | 'medium' | 'high';
}

const CarWashScene: React.FC<CarWashSceneProps> = ({ intensity = 'medium' }) => {
  const carCount = intensity === 'low' ? 2 : intensity === 'medium' ? 4 : 6;

  return (
    <div className="car-wash-scene" aria-hidden="true">
      {/* Car Wash Station */}
      <div className="car-wash-station">
        <div className="station-roof"></div>
        <div className="station-pillars">
          <div className="pillar"></div>
          <div className="pillar"></div>
        </div>
        <div className="station-sign"><Icon name="sparkles" size={16} /></div>
      </div>

      {/* Cars in wash */}
      <div className="cars-in-wash">
        <CarAnimation variant="washing" size="medium" delay={0} />
        <CarAnimation variant="washing" size="small" delay={2} />
      </div>

      {/* Cars arriving */}
      <div className="cars-arriving">
        {Array.from({ length: carCount }).map((_, i) => (
          <CarAnimation
            key={`arriving-${i}`}
            variant="driving"
            direction={i % 2 === 0 ? 'right' : 'left'}
            size={i % 3 === 0 ? 'small' : i % 3 === 1 ? 'medium' : 'large'}
            speed={15 + i * 3}
            delay={i * 2}
          />
        ))}
      </div>

      {/* Cars leaving */}
      <div className="cars-leaving">
        {Array.from({ length: Math.floor(carCount / 2) }).map((_, i) => (
          <CarAnimation
            key={`leaving-${i}`}
            variant="driving"
            direction={i % 2 === 0 ? 'right' : 'left'}
            size="medium"
            speed={18 + i * 2}
            delay={i * 3 + 5}
          />
        ))}
      </div>
    </div>
  );
};

export default CarWashScene;
