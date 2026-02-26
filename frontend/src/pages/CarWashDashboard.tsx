import { useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CarWashHome from '../components/carwash/CarWashHome';
import CarWashBookings from '../components/carwash/CarWashBookings';
import ManageServices from '../components/carwash/ManageServices';
import NotificationCenter from '../components/notifications/NotificationCenter';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import './Dashboard.css';
import ThemeToggle from '../components/ThemeToggle';

const CarWashDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ensure user is loaded before rendering
  if (!user || !user.id) {
    return <DashboardSkeleton />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="dashboard-container">
      <nav className={`dashboard-nav ${mobileMenuOpen ? '' : 'mobile-closed'}`}>
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <div className="nav-header">
          <div>
            <h1>SuCAR Car Wash</h1>
            <p className="welcome-text">{user?.name}</p>
          </div>
          <div className="user-info">
            <ThemeToggle />
            <NotificationCenter />
            <button className="avatar-btn" onClick={() => navigate('/profile')} title="My Profile" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{user?.name?.charAt(0)}</div>
              )}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/carwash" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
          <Link to="/carwash/bookings" onClick={() => setMobileMenuOpen(false)}>Bookings</Link>
          <Link to="/carwash/services" onClick={() => setMobileMenuOpen(false)}>Manage Services</Link>
        </div>
      </nav>
      <main className="dashboard-content">
        <Routes>
          <Route index element={<CarWashHome />} />
          <Route path="bookings" element={<CarWashBookings />} />
          <Route path="services" element={<ManageServices />} />
          <Route path="*" element={<Navigate to="/carwash" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default CarWashDashboard;
