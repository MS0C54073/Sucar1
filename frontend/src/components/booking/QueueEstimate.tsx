import Icon from '../icons/Icon';
import './QueueEstimate.css';

interface QueueEstimateProps {
  queuePosition?: number | null;
  estimatedWaitTime?: number | null; // in minutes
  averageServiceTime?: number; // in minutes, default 30
}

// Simple function to estimate wait time
const estimateQueueWaitTime = (position: number, avgTime: number): number => {
  return position * avgTime;
};

// Simple function to format time
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const QueueEstimate = ({ 
  queuePosition, 
  estimatedWaitTime, 
  averageServiceTime = 30 
}: QueueEstimateProps) => {
  if (!queuePosition || queuePosition <= 0) {
    return null;
  }

  const waitTime = estimatedWaitTime || estimateQueueWaitTime(queuePosition, averageServiceTime);

  return (
    <div className="queue-estimate">
      <div className="queue-info">
        <span className="queue-icon"><Icon name="clock" size={20} /></span>
        <div className="queue-details">
          <div className="queue-position">
            Position: <strong>#{queuePosition}</strong> in queue
          </div>
          <div className="queue-wait-time">
            Est. wait: <strong>{formatTime(waitTime)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueEstimate;
