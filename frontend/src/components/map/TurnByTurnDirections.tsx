/**
 * TurnByTurnDirections Component
 * Displays step-by-step directions on the map and in a list view
 */

import React, { useState, useEffect } from 'react';
import './TurnByTurnDirections.css';

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface TurnByTurnDirectionsProps {
  steps: DirectionStep[];
  totalDistance: number;
  totalDuration: number;
  currentStepIndex?: number;
}

const TurnByTurnDirections: React.FC<TurnByTurnDirectionsProps> = ({
  steps,
  totalDistance,
  totalDuration,
  currentStepIndex = 0,
}) => {
  const [expanded, setExpanded] = useState(true);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="turn-by-turn-container">
      {/* Header with summary */}
      <div className="directions-header">
        <button
          className="expand-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <div className="directions-summary">
          <div className="summary-item">
            <span className="label">Distance:</span>
            <span className="value">{formatDistance(totalDistance)}</span>
          </div>
          <div className="summary-item">
            <span className="label">ETA:</span>
            <span className="value">{formatDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Current step highlighted */}
      {expanded && (
        <>
          <div className="current-step">
            <div className="step-number">→</div>
            <div className="step-content">
              <p className="step-instruction">{currentStep.instruction}</p>
              <span className="step-distance">{formatDistance(currentStep.distance)}</span>
            </div>
          </div>

          {/* Steps list */}
          <div className="steps-list">
            <p className="steps-label">Directions ({steps.length} steps)</p>
            <div className="steps-scroll">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`step-item ${index === currentStepIndex ? 'active' : ''} ${
                    index < currentStepIndex ? 'completed' : ''
                  }`}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <p className="step-instruction">{step.instruction}</p>
                    <span className="step-distance">{formatDistance(step.distance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TurnByTurnDirections;
