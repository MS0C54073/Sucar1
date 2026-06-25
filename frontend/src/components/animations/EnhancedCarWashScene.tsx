import React from 'react';
import CarAnimation from './CarAnimation';
import Icon from '../icons/Icon';
import './EnhancedCarWashScene.css';

interface EnhancedCarWashSceneProps {
  intensity?: 'low' | 'medium' | 'high';
  stationCount?: number;
}

const EnhancedCarWashScene: React.FC<EnhancedCarWashSceneProps> = ({ 
  intensity = 'medium',
  stationCount = 3 
}) => {
  const carCount = intensity === 'low' ? 3 : intensity === 'medium' ? 5 : 8;

  return (
    <div className="enhanced-car-wash-scene" aria-hidden="true">
      {/* Multiple Car Wash Stations */}
      {Array.from({ length: stationCount }).map((_, stationIndex) => {
        const leftPosition = 20 + (stationIndex * 30); // Distribute stations
        
        return (
          <div
            key={`station-${stationIndex}`}
            className="car-wash-station"
            style={{
              '--station-left': `${leftPosition}%`,
              '--station-delay': `${stationIndex * 2}s`,
            } as React.CSSProperties}
          >
            <div className="station-roof"></div>
            <div className="station-pillars">
              <div className="pillar"></div>
              <div className="pillar"></div>
            </div>
            <div className="station-sign"><Icon name="sparkles" size={16} /></div>
            
            {/* Washing Area - Cars being washed */}
            <div className="washing-area">
              <CarAnimation 
                variant="washing" 
                size="medium" 
                delay={stationIndex * 3}
                speed={8}
              />
            </div>
            
            {/* Queue Area - Cars waiting */}
            <div className="queue-area">
              {stationIndex < 2 && (
                <CarAnimation 
                  variant="parking" 
                  size="small" 
                  delay={stationIndex * 3 + 1}
                  speed={5}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Cars Arriving - Continuous Loop */}
      <div className="cars-arriving-lane">
        {Array.from({ length: carCount }).map((_, i) => (
          <CarAnimation
            key={`arriving-${i}`}
            variant="driving"
            direction="right"
            size={i % 3 === 0 ? 'small' : i % 3 === 1 ? 'medium' : 'large'}
            speed={12 + i * 2}
            delay={i * 4}
          />
        ))}
      </div>

      {/* Cars Leaving - Continuous Loop */}
      <div className="cars-leaving-lane">
        {Array.from({ length: Math.floor(carCount * 0.7) }).map((_, i) => (
          <CarAnimation
            key={`leaving-${i}`}
            variant="driving"
            direction="left"
            size="medium"
            speed={15 + i * 2}
            delay={i * 5 + 8}
          />
        ))}
      </div>

      {/* Additional Background Cars */}
      <div className="background-traffic">
        {Array.from({ length: 4 }).map((_, i) => (
          <CarAnimation
            key={`traffic-${i}`}
            variant="driving"
            direction={i % 2 === 0 ? 'right' : 'left'}
            size="small"
            speed={20 + i * 3}
            delay={i * 6}
          />
        ))}
      </div>
    </div>
  );
};

export default EnhancedCarWashScene;
