import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import './DriverEarnings.css';

const DriverEarnings = () => {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['driver-earnings', user?.id],
    queryFn: async () => {
      const response = await api.get('/drivers/earnings');
      return response.data.data || {
        totalEarnings: 0,
        completedJobs: 0,
        pendingEarnings: 0,
        thisMonth: 0,
        lastMonth: 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="earnings-loading">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="driver-earnings">
      <h3>Earnings Overview</h3>
      <div className="earnings-grid">
        <div className="earnings-card primary">
          <div className="earnings-icon"><Icon name="wallet" size={20} /></div>
          <div className="earnings-content">
            <div className="earnings-label">Total Earnings</div>
            <div className="earnings-value">K{parseFloat(earnings?.totalEarnings || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="earnings-card">
          <div className="earnings-icon"><Icon name="checkCircle" size={20} /></div>
          <div className="earnings-content">
            <div className="earnings-label">Completed Jobs</div>
            <div className="earnings-value">{earnings?.completedJobs || 0}</div>
          </div>
        </div>
        <div className="earnings-card">
          <div className="earnings-icon"><Icon name="clock" size={20} /></div>
          <div className="earnings-content">
            <div className="earnings-label">Pending</div>
            <div className="earnings-value">K{parseFloat(earnings?.pendingEarnings || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="earnings-card">
          <div className="earnings-icon"><Icon name="calendar" size={20} /></div>
          <div className="earnings-content">
            <div className="earnings-label">This Month</div>
            <div className="earnings-value">K{parseFloat(earnings?.thisMonth || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
