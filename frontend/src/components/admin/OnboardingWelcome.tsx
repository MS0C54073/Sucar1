import { OnboardingService } from '../../services/onboarding-service';
import Icon from '../icons/Icon';
import './OnboardingWelcome.css';

interface OnboardingWelcomeProps {
  onStart: () => void;
  onSkip: () => void;
}

const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onStart, onSkip }) => {
  return (
    <div className="onboarding-welcome-overlay">
      <div className="onboarding-welcome">
        <div className="welcome-header">
          <h2>Welcome to SuCAR Admin Dashboard</h2>
          <p className="welcome-subtitle">
            Let's take a quick tour to help you get started
          </p>
        </div>

        <div className="welcome-content">
          <div className="welcome-features">
            <div className="welcome-feature">
              <span className="feature-icon"><Icon name="user" size={22} /></span>
              <div>
                <h3>User Management</h3>
                <p>Manage users, roles, and permissions</p>
              </div>
            </div>
            <div className="welcome-feature">
              <span className="feature-icon"><Icon name="trendingUp" size={22} /></span>
              <div>
                <h3>Analytics & Reports</h3>
                <p>Track system performance and revenue</p>
              </div>
            </div>
            <div className="welcome-feature">
              <span className="feature-icon"><Icon name="flag" size={22} /></span>
              <div>
                <h3>Feature Flags</h3>
                <p>Control features without redeployment</p>
              </div>
            </div>
            <div className="welcome-feature">
              <span className="feature-icon"><Icon name="shieldCheck" size={22} /></span>
              <div>
                <h3>Compliance</h3>
                <p>Manage data retention and privacy</p>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-footer">
          <button className="btn btn-secondary" onClick={onSkip}>
            Skip Tour
          </button>
          <button className="btn btn-primary" onClick={onStart}>
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
