import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../ToastContainer';
import './OperatorQueueStrip.css';

const ACTIVE_STATUSES = [
  'waiting_bay',
  'at_wash',
  'washing_bay',
  'drying_bay',
  'delivered_to_wash',
];

interface OperatorQueueStripProps {
  bookingId: string;
  carWashId: string;
  bookingStatus: string;
}

const OperatorQueueStrip = ({ bookingId, carWashId, bookingStatus }: OperatorQueueStripProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const washId = carWashId;

  const { data: queuePosition, isLoading } = useQuery({
    queryKey: ['queue-position', bookingId],
    queryFn: async () => {
      const response = await api.get(`/queue/booking/${bookingId}`);
      return response.data.data;
    },
    enabled: !!bookingId && ACTIVE_STATUSES.includes(bookingStatus),
    refetchInterval: 5000,
  });

  const addToQueueMutation = useMutation({
    mutationFn: async () => {
      await api.post('/queue/add', { bookingId, serviceDurationMinutes: 30 });
    },
    onSuccess: () => {
      showToast('Added to service queue', 'success');
      queryClient.invalidateQueries({ queryKey: ['queue-position', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['queue', washId] });
      queryClient.invalidateQueries({ queryKey: ['operations-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Could not add to queue', 'error');
    },
  });

  if (!ACTIVE_STATUSES.includes(bookingStatus)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="operator-queue-strip operator-queue-strip--loading">
        Checking queue…
      </div>
    );
  }

  if (queuePosition) {
    const status = String(queuePosition.status || 'waiting').replace(/_/g, ' ');
    return (
      <div className="operator-queue-strip operator-queue-strip--active">
        <div className="operator-queue-strip__main">
          <span className="operator-queue-strip__badge">Queue</span>
          <strong>Position #{queuePosition.position}</strong>
          <span className="operator-queue-strip__status">{status}</span>
        </div>
        <p className="operator-queue-strip__hint">
          Manage bays and washes from the <strong>Live ops</strong> tab.
        </p>
      </div>
    );
  }

  return (
    <div className="operator-queue-strip operator-queue-strip--empty">
      <p>Not in the service queue yet.</p>
      <button
        type="button"
        className="operator-queue-strip__btn"
        onClick={() => addToQueueMutation.mutate()}
        disabled={addToQueueMutation.isPending}
      >
        {addToQueueMutation.isPending ? 'Adding…' : '+ Add to queue'}
      </button>
    </div>
  );
};

export default OperatorQueueStrip;
