import { useEffect, useState, useRef } from 'react';
import { OnboardingSection, OnboardingService } from '../../services/onboarding-service';
import Icon from '../icons/Icon';
import './OnboardingTooltip.css';

interface OnboardingTooltipProps {
  section: OnboardingSection;
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({ section, onComplete, onSkip }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (section.targetSelector) {
      const element = document.querySelector(section.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 300;

        let top = rect.top + rect.height + 10;
        let left = rect.left;

        // Adjust position based on preferred position
        switch (section.position) {
          case 'top':
            top = rect.top - tooltipHeight - 10;
            break;
          case 'bottom':
            top = rect.top + rect.height + 10;
            break;
          case 'left':
            left = rect.left - tooltipWidth - 10;
            top = rect.top;
            break;
          case 'right':
            left = rect.left + rect.width + 10;
            top = rect.top;
            break;
        }

        // Ensure tooltip stays in viewport
        if (top + tooltipHeight > window.innerHeight) {
          top = window.innerHeight - tooltipHeight - 10;
        }
        if (left + tooltipWidth > window.innerWidth) {
          left = window.innerWidth - tooltipWidth - 10;
        }
        if (top < 0) top = 10;
        if (left < 0) left = 10;

        setPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Center if element not found
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 150,
        });
      }
    } else {
      // Center if no target
      setPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
    }
  }, [section]);

  if (!position) return null;

  return (
    <>
      <div className="onboarding-overlay" />
      <div
        ref={tooltipRef}
        className="onboarding-tooltip"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="tooltip-header">
          <h3 className="tooltip-title">{section.title}</h3>
          <button className="tooltip-close" onClick={onSkip} aria-label="Close">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="tooltip-content">
          <p>{section.description}</p>
        </div>
        <div className="tooltip-footer">
          <button className="btn btn-secondary btn-sm" onClick={onSkip}>
            Skip
          </button>
          <button className="btn btn-primary btn-sm" onClick={onComplete}>
            Got it
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;
