import React from 'react';
import CarAnimation from './CarAnimation';
import Icon from '../icons/Icon';
import './CarQueueSystem.css';

interface CarQueueSystemProps {
  stationCount?: number;
  queueLength?: number;
}

const CarQueueSystem: React.FC<CarQueueSystemProps> = ({
  stationCount = 3,
  queueLength = 2,
}) => {
  return (
    <div className="car-queue-system" aria-hidden="true">
      {Array.from({ length: stationCount }).map((_, stationIndex) => {
        const baseDelay = stationIndex * 4;
        
        return (
          <div
            key={`queue-station-${stationIndex}`}
            className="queue-station"
            style={{
              '--station-index': stationIndex,
              '--base-delay': `${baseDelay}s`,
            } as React.CSSProperties}
          >
            {/* Station Structure */}
            <div className="queue-station-structure">
              <div className="queue-station-roof"></div>
              <div className="queue-station-pillars">
                <div className="queue-pillar"></div>
                <div className="queue-pillar"></div>
              </div>
              <div className="queue-station-sign"><Icon name="sparkles" size={16} /></div>
            </div>

            {/* Washing Area - Car being washed */}
            <div className="queue-washing-area">
              <CarAnimation
                key={`washing-${stationIndex}`}
                variant="washing"
                size="medium"
                delay={baseDelay}
                speed={8}
              />
            </div>

            {/* Queue Area - Cars waiting */}
            <div className="queue-waiting-area">
              {Array.from({ length: queueLength }).map((_, queueIndex) => (
                <div
                  key={`queue-${stationIndex}-${queueIndex}`}
                  className="queue-car-slot"
                  style={{
                    '--queue-index': queueIndex,
                    '--queue-delay': `${baseDelay + queueIndex * 2}s`,
                  } as React.CSSProperties}
                >
                  <CarAnimation
                    variant="parking"
                    size="small"
                    delay={baseDelay + queueIndex * 2 + 1}
                    speed={5}
                  />
                </div>
              ))}
            </div>

            {/* Arriving Car - Coming to station */}
            <div className="queue-arriving-area">
              <CarAnimation
                key={`arriving-${stationIndex}`}
                variant="driving"
                direction="right"
                size="medium"
                speed={12}
                delay={baseDelay + 6}
              />
            </div>

            {/* Leaving Car - Finished washing */}
            <div className="queue-leaving-area">
              <CarAnimation
                key={`leaving-${stationIndex}`}
                variant="driving"
                direction="left"
                size="medium"
                speed={15}
                delay={baseDelay + 8}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CarQueueSystem;
