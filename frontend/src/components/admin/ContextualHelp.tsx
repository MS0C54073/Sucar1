import { useState } from 'react';
import { ONBOARDING_SECTIONS, OnboardingService } from '../../services/onboarding-service';
import Icon from '../icons/Icon';
import './ContextualHelp.css';

interface ContextualHelpProps {
  sectionId: string;
  className?: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ sectionId, className = '' }) => {
  const [showHelp, setShowHelp] = useState(false);
  const section = ONBOARDING_SECTIONS.find((s) => s.id === sectionId);

  if (!section) return null;

  return (
    <div className={`contextual-help ${className}`}>
      <button
        className="help-icon-button"
        onClick={() => setShowHelp(!showHelp)}
        title="Show help"
        aria-label="Show help"
      >
        <Icon name="info" size={16} />
      </button>
      {showHelp && (
        <div className="help-popup">
          <div className="help-popup-header">
            <h4>{section.title}</h4>
            <button className="help-popup-close" onClick={() => setShowHelp(false)} aria-label="Close">
              <Icon name="x" size={15} />
            </button>
          </div>
          <div className="help-popup-content">
            <p>{section.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextualHelp;
