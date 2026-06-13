import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/chat/ChatWindow';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMessagesInboxPath } from '../utils/chatPaths';
import './BookingChat.css';

const BookingChat = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data.data;
    },
    enabled: !!bookingId,
  });

  const { receiverId, receiverName } = useMemo(() => {
    if (!booking || !user) return { receiverId: '', receiverName: 'Contact' };

    const clientId =
      booking.clientId?.id || booking.clientId || booking.client_id;
    const driverId =
      booking.driverId?.id || booking.driverId || booking.driver_id;
    const carWashId =
      booking.carWashId?.id || booking.carWashId || booking.car_wash_id;

    if (user.role === 'client') {
      const id = driverId || carWashId;
      const name =
        booking.driverId?.name ||
        booking.carWashId?.carWashName ||
        booking.carWashId?.name ||
        'Contact';
      return { receiverId: id as string, receiverName: name };
    }
    return {
      receiverId: clientId as string,
      receiverName: booking.clientId?.name || 'Client',
    };
  }, [booking, user]);

  if (isLoading || !bookingId) {
    return (
      <div className="booking-chat-page booking-chat-page--loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!receiverId) {
    return (
      <div className="booking-chat-page">
        <header className="booking-chat-page__header">
          <button
            type="button"
            onClick={() => navigate(getMessagesInboxPath(user?.role))}
          >
            ← Back
          </button>
          <h1>Chat unavailable</h1>
        </header>
        <p className="booking-chat-page__error">
          No driver or car wash is assigned to this booking yet.
        </p>
      </div>
    );
  }

  return (
    <div className="booking-chat-page">
      <ChatWindow
        bookingId={bookingId}
        receiverId={receiverId}
        receiverName={receiverName}
        onClose={() => navigate(getMessagesInboxPath(user?.role))}
        fullPage
      />
    </div>
  );
};

export default BookingChat;
