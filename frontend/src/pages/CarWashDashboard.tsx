import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CarWashHome from '../components/carwash/CarWashHome';
import CarWashBookings from '../components/carwash/CarWashBookings';
import ManageServices from '../components/carwash/ManageServices';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import '../styles/sucar-operator.css';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'bookings', label: 'Bookings', icon: '📅' },
  { id: 'services', label: 'Services', icon: '🚗' },
  { id: 'profile', label: 'Profile', icon: '⚙️' },
];

const CarWashDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user?.id) {
    return <DashboardSkeleton />;
  }

  const pathTab =
    location.pathname.includes('/bookings')
      ? 'bookings'
      : location.pathname.includes('/services')
        ? 'services'
        : 'dashboard';

  const [activeTab, setActiveTab] = useState(pathTab);

  useEffect(() => {
    setActiveTab(pathTab);
  }, [pathTab]);

  const handleNav = (id: string) => {
    setActiveTab(id);
    if (id === 'dashboard') navigate('/carwash');
    else if (id === 'bookings') navigate('/carwash/bookings');
    else if (id === 'services') navigate('/carwash/services');
  };

  return (
    <div className="carwash-dashboard-operator">
      <aside className="operator-sidebar">
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚗</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Su<span style={{ color: '#9FE1CB' }}>Car</span></span>
        </div>
        <div style={{ margin: '0 12px 16px', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{user.carWashName || user.name}</div>
          <div style={{ fontSize: 10, color: '#9FE1CB', marginTop: 2 }}>Operator · Partner</div>
        </div>
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNav(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              margin: '1px 8px',
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              width: 'calc(100% - 16px)',
              textAlign: 'left',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              background: activeTab === item.id ? 'rgba(29,158,117,0.15)' : 'transparent',
              color: activeTab === item.id ? '#9FE1CB' : 'rgba(255,255,255,0.5)',
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </aside>
      <div className="operator-main">
        <header className="operator-topbar">
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{NAV.find((n) => n.id === activeTab)?.label || 'Dashboard'}</h1>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </header>
        <div className="operator-content">
          <Routes>
            <Route index element={<CarWashHome />} />
            <Route path="bookings" element={<CarWashBookings />} />
            <Route path="services" element={<ManageServices />} />
            <Route path="*" element={<Navigate to="/carwash" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default CarWashDashboard;
