import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import Icon from '../icons/Icon';
import './Analytics.css';

const Analytics = () => {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await api.get(`/admin/analytics?${params.toString()}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <EmptyState
        icon={<Icon name="trendingUp" size={28} />}
        title="No analytics data"
        description="Analytics data will appear here once bookings are created"
      />
    );
  }

  return (
    <div className="analytics">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Analytics & Insights</h2>
          <div className="date-range-selector">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="date-input"
            />
          </div>
        </div>

        {/* User Growth */}
        <div className="analytics-section">
          <h3 className="section-title">User Growth</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Clients</div>
              <div className="metric-value">{analytics.userGrowth?.clients || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Drivers</div>
              <div className="metric-value">{analytics.userGrowth?.drivers || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Car Washes</div>
              <div className="metric-value">{analytics.userGrowth?.carWashes || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Admins</div>
              <div className="metric-value">{analytics.userGrowth?.admins || 0}</div>
            </div>
          </div>
        </div>

        {/* Booking Volume */}
        <div className="analytics-section">
          <h3 className="section-title">Booking Volume</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Pending</div>
              <div className="metric-value">{analytics.bookingVolume?.pending || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">In Progress</div>
              <div className="metric-value">{analytics.bookingVolume?.inProgress || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Completed</div>
              <div className="metric-value">{analytics.bookingVolume?.completed || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cancelled</div>
              <div className="metric-value">{analytics.bookingVolume?.cancelled || 0}</div>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="analytics-section">
          <h3 className="section-title">Revenue</h3>
          <div className="metrics-grid">
            <div className="metric-card revenue-card">
              <div className="metric-label">Total Revenue</div>
              <div className="metric-value revenue">
                K{(analytics.revenue?.total || 0).toLocaleString()}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pending Revenue</div>
              <div className="metric-value">
                K{(analytics.revenue?.pending || 0).toLocaleString()}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cancellation Rate</div>
              <div className="metric-value">
                {analytics.cancellationRate || 0}%
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Bookings</div>
              <div className="metric-value">{analytics.totalBookings || 0}</div>
            </div>
          </div>
        </div>

        {/* Peak Usage */}
        {analytics.peakUsage && Object.keys(analytics.peakUsage).length > 0 && (
          <div className="analytics-section">
            <h3 className="section-title">Peak Usage by Hour</h3>
            <div className="peak-usage-chart">
              {Object.entries(analytics.peakUsage)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, count]: [string, any]) => {
                  const maxCount = Math.max(...Object.values(analytics.peakUsage as Record<string, number>));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={hour} className="peak-hour">
                      <div className="peak-hour-label">{hour}:00</div>
                      <div className="peak-bar-container">
                        <div
                          className="peak-bar"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="peak-count">{count}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
