import { useState, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import OnboardingTooltip from '../components/admin/OnboardingTooltip';
import OnboardingWelcome from '../components/admin/OnboardingWelcome';
import HelpCenter from '../components/admin/HelpCenter';
import { OnboardingService, ONBOARDING_SECTIONS } from '../services/onboarding-service';
import Icon from '../components/icons/Icon';
import './AdminDashboard.css';
import '../styles/sucar-admin-mockup.css';

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
const AdminMapView = lazy(() => import('../components/admin/AdminMapView'));

type NavItem = { path: string; label: string; icon: 'grid' | 'users' | 'clock' | 'car' | 'wash' | 'book' | 'map' | 'chart' | 'money' | 'flag' | 'lock' | 'alert' | 'log' | 'chat' | 'gear' | 'doc'; badge?: boolean };
type NavSection = { title: string; items: NavItem[] };

const NavIcon = ({ name }: { name: NavItem['icon'] }) => {
  const stroke = 'currentColor';
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case 'car':
      return <svg {...common}><path d="M5 17h14v-5l-2-4H7l-2 4v5z" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></svg>;
    case 'wash':
      return <svg {...common}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z" /></svg>;
    case 'book':
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'map':
      return <svg {...common}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /></svg>;
    case 'chart':
      return <svg {...common}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'money':
      return <svg {...common}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'flag':
      return <svg {...common}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case 'alert':
      return <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case 'log':
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'gear':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case 'doc':
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" /></svg>;
  }
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [currentOnboardingSection, setCurrentOnboardingSection] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Onboarding only via Help — auto popups blocked the dashboard UX
  useEffect(() => {
    setShowWelcome(false);
    setShowOnboarding(false);
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
    const componentName = location.pathname.split('/').pop() || 'DashboardHome';
    const nextSection = OnboardingService.getNextSection(componentName);
    if (nextSection) {
      setCurrentOnboardingSection(nextSection.id);
      setShowOnboarding(true);
    }
  };

  const isAdmin = user?.role === 'admin';

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: 'grid' },
        { path: '/admin/analytics', label: 'Analytics', icon: 'chart' },
        { path: '/admin/map', label: 'Live map', icon: 'map' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/bookings', label: 'Bookings', icon: 'book' },
        { path: '/admin/users', label: 'Users', icon: 'users' },
        { path: '/admin/approvals', label: 'Approvals', icon: 'clock', badge: true },
        { path: '/admin/drivers', label: 'Drivers', icon: 'car' },
        { path: '/admin/carwashes', label: 'Car washes', icon: 'wash' },
      ],
    },
    {
      title: 'Finance & safety',
      items: [
        { path: '/admin/financial', label: 'Financial', icon: 'money' },
        { path: '/admin/reports', label: 'Reports', icon: 'doc' },
        { path: '/admin/compliance', label: 'Compliance', icon: 'lock' },
        { path: '/admin/incidents', label: 'Incidents', icon: 'alert' },
        { path: '/admin/audit-logs', label: 'Audit logs', icon: 'log' },
      ],
    },
    {
      title: 'System',
      items: [
        ...(isAdmin
          ? [
              { path: '/admin/support-chat', label: 'Support chat', icon: 'chat' as const },
              { path: '/admin/system-logs', label: 'System logs', icon: 'log' as const },
            ]
          : []),
        { path: '/admin/feature-flags', label: 'Feature flags', icon: 'flag' },
        { path: '/admin/config', label: 'Settings', icon: 'gear' },
      ],
    },
  ];

  const flatItems = navSections.flatMap((s) => s.items);
  const currentPage = flatItems.find((item) => isActive(item.path))?.label || 'Dashboard';

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim().toLowerCase();
    if (!q) return;
    if (q.includes('user')) navigate('/admin/users');
    else if (q.includes('book')) navigate('/admin/bookings');
    else if (q.includes('driver')) navigate('/admin/drivers');
    else if (q.includes('wash') || q.includes('car')) navigate('/admin/carwashes');
    else if (q.includes('report') || q.includes('financ')) navigate('/admin/financial');
    else navigate('/admin/users');
  };

  return (
    <div className="admin-dashboard admin-mockup">
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button type="button" className="sidebar-brand" onClick={() => navigate('/admin')}>
            <img src="/images/Sucarcar.jpeg" alt="" className="sidebar-brand-logo" />
            <div className="sidebar-brand-text">
              <h1>SuCar</h1>
              <span>Admin console</span>
            </div>
          </button>
          <span className="role-badge">{user?.role === 'subadmin' ? 'Sub-admin' : 'Super admin'}</span>
          <button type="button" className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <Icon name="x" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="nav-section-label">{section.title}</p>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">!</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-info"
            onClick={() => navigate('/profile')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
            role="button"
            tabIndex={0}
            title="View profile"
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
            <button type="button" className="help-btn" onClick={() => setShowHelpCenter(true)} title="Help center" aria-label="Help">
              <Icon name="helpCircle" size={18} />
            </button>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <button type="button" className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>
          <div className="header-title">{currentPage}</div>
          <form className="header-search-wrap" onSubmit={handleHeaderSearch}>
            <input
              className="header-search"
              type="search"
              placeholder="Search users, bookings, drivers…"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              aria-label="Search admin"
            />
          </form>
          <div className="header-actions">
            <span className="header-pill">
              <strong>{user?.role === 'subadmin' ? 'Sub-admin' : 'Admin'}</strong>
            </span>
            <div className="admin-user-chip" title={user?.name}>
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="admin-user-chip-img" />
              ) : (
                <span className="admin-user-chip-letter">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
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
              <Route path="map" element={<AdminMapView />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="financial" element={<FinancialOverview />} />
              <Route path="feature-flags" element={<FeatureFlags />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              {isAdmin && (
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

      {showWelcome && <OnboardingWelcome onStart={handleWelcomeStart} onSkip={handleOnboardingSkip} />}

      {showOnboarding && currentOnboardingSection && (
        <OnboardingTooltip
          section={ONBOARDING_SECTIONS.find((s) => s.id === currentOnboardingSection)!}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
    </div>
  );
};

export default AdminDashboard;
