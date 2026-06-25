import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useBookings } from '../../hooks/useBookings';
import OperatorWeekCalendar from './OperatorWeekCalendar';
import OperatorStaffPanel from './OperatorStaffPanel';
import Icon from '../icons/Icon';
import './OperatorWeekCalendar.css';
import './OperatorStaffPanel.css';
import '../carwash/CarWashHome.css';

const statusClass = (status: string) => {
  const s = (status || '').toLowerCase();
  if (['completed', 'delivered', 'wash_completed'].includes(s)) return 's-done';
  if (['pending', 'accepted'].includes(s)) return 's-confirmed';
  if (['picked_up', 'at_wash', 'washing_bay', 'drying_bay'].includes(s)) return 's-inprogress';
  return 's-cancel';
};

const statusLabel = (status: string) =>
  status
    ?.split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || status;

const CarWashHome = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['carwash-dashboard'],
    queryFn: async () => {
      const response = await api.get('/carwash/dashboard');
      return response.data.data;
    },
    staleTime: 15000,
  });

  const { data: bookings, isLoading: bookingsLoading } = useBookings({
    filters: { role: 'carwash' },
    refetchInterval: 15000,
  });

  const recent = (bookings || []).slice(0, 5);
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="operator-dashboard-content">
      <p className="operator-date-sub">{today}</p>

      <div className="stats-grid stats-grid-op">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card-op skeleton-stat-card" />
          ))
        ) : (
          <>
            <div className="stat-card-op">
              <div className="stat-header-op">
                <span>Today&apos;s Bookings</span>
                <span className="stat-ic"><Icon name="calendar" size={18} /></span>
              </div>
              <div className="value">{data?.totalBookings ?? 0}</div>
              <div className="stat-sub-op">
                <span className="up"><Icon name="arrowUpRight" size={13} /> Active day</span>
              </div>
            </div>
            <div className="stat-card-op">
              <div className="stat-header-op">
                <span>Revenue</span>
                <span className="stat-ic"><Icon name="wallet" size={18} /></span>
              </div>
              <div className="value highlight-val">K{(data?.totalRevenue ?? 0).toLocaleString()}</div>
            </div>
            <div className="stat-card-op">
              <div className="stat-header-op">
                <span>Pending</span>
                <span className="stat-ic"><Icon name="clock" size={18} /></span>
              </div>
              <div className="value">{data?.pendingBookings ?? 0}</div>
            </div>
            <div className="stat-card-op">
              <div className="stat-header-op">
                <span>In Progress</span>
                <span className="stat-ic"><Icon name="refresh" size={18} /></span>
              </div>
              <div className="value">{data?.inProgressBookings ?? 0}</div>
            </div>
          </>
        )}
      </div>

      <OperatorWeekCalendar bookings={bookings || []} isLoading={bookingsLoading} />

      <div className="operator-lower">
        <div className="card operator-bookings-card">
          <div className="card-head">
            <h3>Recent Bookings</h3>
            <Link to="/carwash/bookings">View all</Link>
          </div>
          {bookingsLoading ? (
            <p className="operator-loading">Loading bookings…</p>
          ) : recent.length === 0 ? (
            <p className="operator-empty">No bookings yet.</p>
          ) : (
            <table className="book-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b: any) => (
                  <tr key={b.id || b._id}>
                    <td>
                      <div className="client-cell">
                        <span className="av">
                          {(b.clientId?.name || 'C').charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div>{b.clientId?.name || 'Client'}</div>
                          <div className="sub">{b.vehicleId?.make} {b.vehicleId?.model}</div>
                        </div>
                      </div>
                    </td>
                    <td>{b.serviceId?.name || 'Wash'}</td>
                    <td>
                      <span className={`status-pill ${statusClass(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </td>
                    <td>K{b.totalAmount ?? '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="side-stack">
          <OperatorStaffPanel bookings={bookings || []} />
          <div className="card">
            <div className="card-head">
              <h3>Quick stats</h3>
            </div>
            <div className="quick-stats">
              <div className="qs">
                <div className="val">{data?.completedBookings ?? 0}</div>
                <div className="lbl">Completed</div>
              </div>
              <div className="qs">
                <div className="val">{user?.washingBays ?? '—'}</div>
                <div className="lbl">Wash bays</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h3>Location</h3>
            </div>
            <p style={{ padding: '12px 16px', margin: 0, fontSize: 13, color: '#6b7280' }}>
              {user?.location || user?.carWashName || 'Your car wash'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarWashHome;
