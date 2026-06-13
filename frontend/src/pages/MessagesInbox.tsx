import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getChatPath } from '../utils/chatPaths';
import './MessagesInbox.css';

interface Conversation {
  bookingId: string;
  bookingStatus?: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  otherParty?: { id: string; name: string; role: string };
}

const MessagesInbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['my-conversations', user?.id],
    queryFn: async () => {
      const response = await api.get('/chat/my-conversations');
      return (response.data.data || []) as Conversation[];
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const goBack = () => {
    if (user?.role === 'driver') navigate('/driver');
    else if (user?.role === 'carwash') navigate('/carwash');
    else navigate('/client');
  };

  return (
    <div className="messages-inbox">
      <header className="messages-inbox__header">
        <button type="button" className="messages-inbox__back" onClick={goBack}>
          ← Back
        </button>
        <h1>Messages</h1>
      </header>

      <div className="messages-inbox__body">
        {isLoading ? (
          <div className="messages-inbox__loading">
            <LoadingSpinner />
          </div>
        ) : !conversations?.length ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            description="Open chat from a booking card to message your driver or car wash."
            action={{ label: 'View bookings', onClick: goBack }}
          />
        ) : (
          <ul className="messages-inbox__list">
            {conversations.map((c) => (
              <li key={c.bookingId}>
                <button
                  type="button"
                  className="messages-inbox__item"
                  onClick={() => navigate(getChatPath(user?.role, c.bookingId))}
                >
                  <div className="messages-inbox__avatar">
                    {(c.otherParty?.name || '?').charAt(0)}
                  </div>
                  <div className="messages-inbox__content">
                    <div className="messages-inbox__row">
                      <strong>{c.otherParty?.name || 'Conversation'}</strong>
                      <span className="messages-inbox__time">
                        {new Date(c.lastTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="messages-inbox__preview">{c.lastMessage}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="messages-inbox__badge">{c.unreadCount}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MessagesInbox;
