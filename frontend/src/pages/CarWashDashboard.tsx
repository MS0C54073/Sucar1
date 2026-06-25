import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CarWashHome from '../components/carwash/CarWashHome';
import CarWashBookings from '../components/carwash/CarWashBookings';
import ManageServices from '../components/carwash/ManageServices';
import Profile from './Profile';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { NavIcon, type NavIconName } from '../components/icons/NavIcon';
import BrandLogo from '../components/BrandLogo';
import '../styles/sucar-operator.css';

const NAV: { id: string; label: string; icon: NavIconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'bookings', label: 'Bookings', icon: 'bookings' },
  { id: 'services', label: 'Services', icon: 'services' },
  { id: 'profile', label: 'Profile', icon: 'settings' },
];

const CarWashDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathTab = location.pathname.includes('/bookings')
    ? 'bookings'
    : location.pathname.includes('/services')
      ? 'services'
      : location.pathname.includes('/profile')
        ? 'profile'
        : 'dashboard';

  const [activeTab, setActiveTab] = useState(pathTab);

  useEffect(() => {
    setActiveTab(pathTab);
  }, [pathTab]);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-skin', 'operator');
    return () => {
      document.documentElement.removeAttribute('data-app-skin');
    };
  }, []);

  const handleNav = (id: string) => {
    setActiveTab(id);
    if (id === 'dashboard') navigate('/carwash');
    else if (id === 'bookings') navigate('/carwash/bookings');
    else if (id === 'services') navigate('/carwash/services');
    else if (id === 'profile') navigate('/carwash/profile');
  };

  if (!user?.id) {
    return <DashboardSkeleton />;
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="carwash-dashboard-operator"
      data-operator-theme="light"
    >
      <aside className="operator-sidebar">
        <div className="operator-brand">
          <BrandLogo size={30} />
        </div>
        <div className="operator-sidebar-user">
          <div className="operator-sidebar-user__name">{user.carWashName || user.name}</div>
          <div className="operator-sidebar-user__role">Car wash partner</div>
        </div>
        <nav className="operator-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`operator-nav__item ${activeTab === item.id ? 'operator-nav__item--active' : ''}`}
            >
              <span className="operator-nav__icon">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="operator-main">
        <header className="operator-topbar">
          <h1 className="operator-topbar__title">
            {NAV.find((n) => n.id === activeTab)?.label || 'Dashboard'}
          </h1>
          <div className="operator-topbar__actions">
            <span className="operator-topbar__date">{today}</span>
          </div>
        </header>
        <div className="operator-content">
          <Routes>
            <Route index element={<CarWashHome />} />
            <Route path="bookings" element={<CarWashBookings />} />
            <Route path="services" element={<ManageServices />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/carwash" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default CarWashDashboard;
