import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import AlertsPanel from './AlertsPanel';
import ContextualHelp from './ContextualHelp';
import './DashboardHome.css';

const DashboardHome = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      try {
        console.log('📡 Fetching admin dashboard data');
        const response = await api.get('/admin/dashboard');
        const dashboardData = response.data?.data || response.data || {};
        console.log('✅ Received admin dashboard data:', dashboardData);
        return dashboardData;
      } catch (error: any) {
        console.error('❌ Error fetching admin dashboard:', error);
        console.error('   Response:', error.response?.data);
        // Return default empty structure instead of throwing
        return {
          totalBookings: 0,
          pendingPickups: 0,
          completedWashes: 0,
          totalRevenue: 0,
          totalClients: 0,
          totalDrivers: 0,
          totalCarWashes: 0,
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
    retry: 1,
  });

  // Don't block - show skeleton stats while loading
  const isInitialLoad = isLoading && !data;

  const stats = [
    {
      label: 'Total Bookings',
      value: data?.totalBookings || 0,
      icon: '📋',
      color: 'blue',
    },
    {
      label: 'Pending Pickups',
      value: data?.pendingPickups || 0,
      icon: '⏳',
      color: 'amber',
    },
    {
      label: 'Completed Washes',
      value: data?.completedWashes || 0,
      icon: '✅',
      color: 'green',
    },
    {
      label: 'Total Revenue',
      value: `K${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: '💰',
      color: 'emerald',
    },
    {
      label: 'Total Clients',
      value: data?.totalClients || 0,
      icon: '👥',
      color: 'blue',
    },
    {
      label: 'Total Drivers',
      value: data?.totalDrivers || 0,
      icon: '🚗',
      color: 'green',
    },
    {
      label: 'Car Wash Providers',
      value: data?.totalCarWashes || 0,
      icon: '🧼',
      color: 'purple',
    },
  ];

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="dashboard-subtitle">System health and key metrics</p>
        </div>
        <ContextualHelp sectionId="dashboard-overview" />
      </div>

      <div className="kpi-grid-mockup">
        {isInitialLoad ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi-card-mockup skeleton-stat-card" style={{ minHeight: 80 }} />
          ))
        ) : (
          [
            { label: 'Total bookings', value: data?.totalBookings ?? 0, cls: '' },
            { label: 'Pending pickups', value: data?.pendingPickups ?? 0, cls: 'kpi-amber' },
            { label: 'Completed washes', value: data?.completedWashes ?? 0, cls: 'kpi-blue' },
            { label: 'Revenue', value: `K${(data?.totalRevenue ?? 0).toLocaleString()}`, cls: 'kpi-green' },
            { label: 'Active partners', value: data?.totalCarWashes ?? 0, cls: 'kpi-purple' },
          ].map((k, i) => (
            <div key={i} className={`kpi-card-mockup ${k.cls}`}>
              <div className="kpi-lbl">{k.label}</div>
              <div className="kpi-val">{k.value}</div>
            </div>
          ))
        )}
      </div>

      <div className="stats-grid">
        {isInitialLoad ? (
          // Show skeleton cards while loading
          Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="stat-card skeleton-stat-card">
              <div className="skeleton-stat-icon"></div>
              <div className="skeleton-stat-content">
                <div className="skeleton-stat-label"></div>
                <div className="skeleton-stat-value"></div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => (
            <div key={index} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
              {/* Highlight critical metrics */}
              {stat.label === 'Pending Pickups' && stat.value > 10 && (
                <div className="stat-alert">⚠️ High</div>
              )}
              {stat.label === 'Total Revenue' && parseFloat(stat.value.toString().replace('K', '').replace(',', '')) > 100000 && (
                <div className="stat-success">✓ Good</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Alerts Panel */}
      <AlertsPanel />

      <div className="dashboard-sections">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <a href="/admin/users" className="quick-action-card">
              <span className="quick-action-icon">👥</span>
              <span className="quick-action-label">Manage Users</span>
            </a>
            <a href="/admin/bookings" className="quick-action-card">
              <span className="quick-action-icon">📋</span>
              <span className="quick-action-label">View Bookings</span>
            </a>
            <a href="/admin/drivers" className="quick-action-card">
              <span className="quick-action-icon">🚗</span>
              <span className="quick-action-label">Manage Drivers</span>
            </a>
            <a href="/admin/reports" className="quick-action-card">
              <span className="quick-action-icon">📈</span>
              <span className="quick-action-label">View Reports</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
