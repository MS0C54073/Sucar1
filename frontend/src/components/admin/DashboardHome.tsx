import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import api from '../../services/api';
import AlertsPanel from './AlertsPanel';
import './DashboardHome.css';

const ACCENT = '#00C896';
const CHART_MUTED = 'rgba(236, 236, 244, 0.55)';
const TOOLTIP_STYLE = {
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  fontSize: 13,
  color: '#ececf4',
};

const paymentBadge = (status: string) => {
  const s = (status || 'pending').toLowerCase();
  if (s === 'paid' || s === 'completed') return 'tx-paid';
  if (s === 'failed') return 'tx-failed';
  return 'tx-pending';
};

type KpiKey = 'bookings' | 'pending' | 'completed' | 'revenue' | 'partners';

const KpiIcon = ({ type }: { type: KpiKey }) => {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (type) {
    case 'bookings':
      return (
        <svg {...p}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'pending':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'completed':
      return (
        <svg {...p}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'revenue':
      return (
        <svg {...p}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'partners':
      return (
        <svg {...p}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const DashboardHome = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/dashboard');
        return response.data?.data || response.data || {};
      } catch {
        return {
          totalBookings: 0,
          pendingPickups: 0,
          completedWashes: 0,
          totalRevenue: 0,
          totalClients: 0,
          totalDrivers: 0,
          totalCarWashes: 0,
          monthlyTrend: [],
          recentTransactions: [],
        };
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  });

  const isInitialLoad = isLoading && !data;
  const trend = data?.monthlyTrend || [];
  const transactions = data?.recentTransactions || [];

  const kpis: { key: KpiKey; label: string; value: string | number; sub: string }[] = [
    { key: 'bookings', label: 'Total bookings', value: data?.totalBookings ?? 0, sub: 'All time' },
    { key: 'pending', label: 'Pending pickups', value: data?.pendingPickups ?? 0, sub: 'Awaiting driver' },
    { key: 'completed', label: 'Completed washes', value: data?.completedWashes ?? 0, sub: 'Delivered' },
    {
      key: 'revenue',
      label: 'Revenue',
      value: `K${(data?.totalRevenue ?? 0).toLocaleString()}`,
      sub: 'Platform total',
    },
    {
      key: 'partners',
      label: 'Car wash partners',
      value: data?.totalCarWashes ?? 0,
      sub: 'Active locations',
    },
  ];

  return (
    <div className="dashboard-home">
      <div className="admin-dash-head">
        <p>Bookings, revenue, and platform health at a glance</p>
        <span className="admin-dash-live">Live</span>
      </div>

      <div className="kpi-grid-mockup">
        {isInitialLoad
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="kpi-card-mockup skeleton-stat-card" style={{ minHeight: 108 }} />
            ))
          : kpis.map((k) => (
              <div key={k.key} className="kpi-card-mockup">
                <div className="kpi-top">
                  <span className="kpi-lbl">{k.label}</span>
                  <span className="kpi-icon" aria-hidden>
                    <KpiIcon type={k.key} />
                  </span>
                </div>
                <div className="kpi-val">{k.value}</div>
                <p className="kpi-sub">{k.sub}</p>
              </div>
            ))}
      </div>

      <div className="admin-dash-body">
        <div className="admin-dash-main-col">
          <div className="admin-charts-row">
            <div className="admin-chart-card">
              <h3>Bookings</h3>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="admBookingsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" stroke="#65657a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#65657a" fontSize={11} tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke={ACCENT}
                      strokeWidth={2}
                      fill="url(#admBookingsFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="admin-chart-empty">Chart fills in after your first bookings</p>
              )}
            </div>
            <div className="admin-chart-card">
              <h3>Revenue</h3>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" stroke="#65657a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#65657a" fontSize={11} tickLine={false} axisLine={false} width={48} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [`K${Number(v).toLocaleString()}`, 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_MUTED}
                      strokeWidth={2}
                      dot={{ r: 3, fill: CHART_MUTED, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#ececf4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="admin-chart-empty">Revenue trend updates monthly</p>
              )}
            </div>
          </div>

          <div className="admin-tx-card">
            <div className="admin-tx-head">
              <h3>Recent transactions</h3>
              <Link to="/admin/financial">View all</Link>
            </div>
            {transactions.length === 0 ? (
              <p className="admin-chart-empty" style={{ padding: '28px 20px' }}>
                No transactions yet
              </p>
            ) : (
              <div className="admin-tx-scroll">
                <table className="admin-tx-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>ID</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: {
                      id: string;
                      userName?: string;
                      userEmail?: string;
                      transactionId?: string;
                      amount?: number;
                      date?: string;
                      paymentStatus?: string;
                    }) => (
                      <tr key={tx.id}>
                        <td>
                          <div className="tx-user">{tx.userName || '—'}</div>
                          <div className="tx-email">{tx.userEmail || ''}</div>
                        </td>
                        <td className="tx-mono">{tx.transactionId || tx.id?.slice(0, 8)}</td>
                        <td>K{Number(tx.amount || 0).toLocaleString()}</td>
                        <td>
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td>
                          <span className={`tx-badge ${paymentBadge(tx.paymentStatus || '')}`}>
                            {tx.paymentStatus || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-quick-row">
            <Link to="/admin/users" className="admin-quick-btn">
              Users
            </Link>
            <Link to="/admin/bookings" className="admin-quick-btn">
              Bookings
            </Link>
            <Link to="/admin/drivers" className="admin-quick-btn">
              Drivers
            </Link>
            <Link to="/admin/financial" className="admin-quick-btn">
              Financial
            </Link>
          </div>
        </div>

        <aside className="admin-dash-side">
          <div className="admin-health-card">
            <h3>System health</h3>
            <AlertsPanel />
          </div>
          <div className="admin-health-card">
            <h3>Platform</h3>
            <div className="admin-mini-stats">
              <div className="admin-mini-stat">
                <span>Clients</span>
                <strong>{isInitialLoad ? '—' : (data?.totalClients ?? 0)}</strong>
              </div>
              <div className="admin-mini-stat">
                <span>Drivers</span>
                <strong>{isInitialLoad ? '—' : (data?.totalDrivers ?? 0)}</strong>
              </div>
              <div className="admin-mini-stat">
                <span>Car washes</span>
                <strong>{isInitialLoad ? '—' : (data?.totalCarWashes ?? 0)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardHome;
