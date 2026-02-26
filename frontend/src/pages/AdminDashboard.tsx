import { useState, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import OnboardingTooltip from '../components/admin/OnboardingTooltip';
import OnboardingWelcome from '../components/admin/OnboardingWelcome';
import HelpCenter from '../components/admin/HelpCenter';
import { OnboardingService, ONBOARDING_SECTIONS } from '../services/onboarding-service';
import './AdminDashboard.css';
import ThemeToggle from '../components/ThemeToggle';

// Lazy load admin components for better performance
const DashboardHome = lazy(() => import('../components/admin/DashboardHome'));
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const PendingApprovals = lazy(() => import('../components/admin/PendingApprovals'));
const ManageBookings = lazy(() => import('../components/admin/ManageBookings'));
const ManageDrivers = lazy(() => import('../components/admin/ManageDrivers'));
const ManageCarWashes = lazy(() => import('../components/admin/ManageCarWashes'));
const Reports = lazy(() => import('../components/admin/Reports'));
const AuditLogs = lazy(() => import('../components/admin/AuditLogs'));
const Analytics = lazy(() => import('../components/admin/Analytics'));
const FinancialOverview = lazy(() => import('../components/admin/FinancialOverview'));
const SystemConfig = lazy(() => import('../components/admin/SystemConfig'));
const FeatureFlags = lazy(() => import('../components/admin/FeatureFlags'));
const Compliance = lazy(() => import('../components/admin/Compliance'));
const Incidents = lazy(() => import('../components/admin/Incidents'));
const IncidentDetail = lazy(() => import('../components/admin/IncidentDetail'));
const SystemLogs = lazy(() => import('../components/admin/SystemLogs'));
const ConversationsManager = lazy(() => import('../components/admin/ConversationsManager'));


const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [currentOnboardingSection, setCurrentOnboardingSection] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Onboarding logic
  useEffect(() => {
    // Show welcome screen on first visit
    if (!OnboardingService.isSkipped() && OnboardingService.getCompletedSections().length === 0) {
      setShowWelcome(true);
      return;
    }

    // Show next section tooltip
    if (!OnboardingService.isSkipped()) {
      const componentName = location.pathname.split('/').pop() || 'DashboardHome';
      const nextSection = OnboardingService.getNextSection(componentName);
      if (nextSection) {
        setCurrentOnboardingSection(nextSection.id);
        setShowOnboarding(true);
      }
    }
  }, [location.pathname]);

  const handleOnboardingComplete = () => {
    if (currentOnboardingSection) {
      OnboardingService.completeSection(currentOnboardingSection);
      setShowOnboarding(false);
      setCurrentOnboardingSection(null);
    }
  };

  const handleOnboardingSkip = () => {
    OnboardingService.skipOnboarding();
    setShowOnboarding(false);
    setCurrentOnboardingSection(null);
    setShowWelcome(false);
  };

  const handleWelcomeStart = () => {
    setShowWelcome(false);
    // Start with first section
    const componentName = location.pathname.split('/').pop() || 'DashboardHome';
    const nextSection = OnboardingService.getNextSection(componentName);
    if (nextSection) {
      setCurrentOnboardingSection(nextSection.id);
      setShowOnboarding(true);
    }
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/approvals', label: 'Pending Approvals', icon: '⏳', badge: true },
    { path: '/admin/drivers', label: 'Drivers', icon: '🚗' },
    { path: '/admin/carwashes', label: 'Car Washes', icon: '🧼' },
    { path: '/admin/bookings', label: 'Bookings', icon: '📋' },
    { path: '/admin/map', label: 'Map View', icon: '🗺️' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/financial', label: 'Financial', icon: '💰' },
    { path: '/admin/feature-flags', label: 'Feature Flags', icon: '🚩' },
    { path: '/admin/compliance', label: 'Compliance', icon: '🔒' },
    { path: '/admin/incidents', label: 'Incidents', icon: '🚨' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📝' },
    ...(user?.role === 'admin' ? [
      { path: '/admin/support-chat', label: 'Support Chat', icon: '💬' },
      { path: '/admin/system-logs', label: 'System Logs', icon: '🛠️' },
    ] : []),
    { path: '/admin/config', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="logo-link"
            onClick={() => navigate('/admin')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <div className="logo">
              <h1>SuCAR</h1>
              <span className="role-badge">{user?.role === 'subadmin' ? 'Subadmin' : 'Admin'}</span>
            </div>
          </button>
          <button className="mobile-close-btn" onClick={toggleMobileMenu}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-info"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            <div className="user-avatar">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="avatar-img" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <div className="footer-actions">
            <button
              className="help-btn"
              onClick={() => setShowHelpCenter(true)}
              title="Help Center"
            >
              ❓
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            ☰
          </button>
          <div className="header-title">
            {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <span className="welcome-text">Welcome, {user?.name}</span>
          </div>
        </header>

        <div className="admin-content">
          <Suspense fallback={<DashboardSkeleton />}>
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="approvals" element={<PendingApprovals />} />
              <Route path="drivers" element={<ManageDrivers />} />
              <Route path="carwashes" element={<ManageCarWashes />} />
              <Route path="bookings" element={<ManageBookings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="financial" element={<FinancialOverview />} />
              <Route path="feature-flags" element={<FeatureFlags />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              {user?.role === 'admin' && (
                <>
                  <Route path="support-chat" element={<ConversationsManager />} />
                  <Route path="system-logs" element={<SystemLogs />} />
                </>
              )}
              <Route path="config" element={<SystemConfig />} />
              <Route path="reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* Welcome Screen */}
      {showWelcome && (
        <OnboardingWelcome
          onStart={handleWelcomeStart}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Onboarding Tooltip */}
      {showOnboarding && currentOnboardingSection && (
        <OnboardingTooltip
          section={ONBOARDING_SECTIONS.find((s) => s.id === currentOnboardingSection)!}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Help Center */}
      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
    </div>
  );
};

export default AdminDashboard;
