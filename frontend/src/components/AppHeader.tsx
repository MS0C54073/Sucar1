import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import './AppHeader.css';

const AppHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    if (user) {
      // Navigate to appropriate dashboard based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'carwash') {
        navigate('/carwash');
      } else if (user.role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/client');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <button
          className="logo-link"
          onClick={handleLogoClick}
          aria-label="Go to dashboard"
        >
          <BrandLogo size={28} textClassName="logo-text" />
        </button>
        {user && (
          <div className="header-right">
            <span className="welcome-text">Welcome, {user.name}</span>
            <button className="avatar-btn" onClick={() => navigate('/profile')} title="My Profile">
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt={user.name} className="header-avatar" />
              ) : (
                <div className="avatar-placeholder">{user.name.charAt(0)}</div>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
