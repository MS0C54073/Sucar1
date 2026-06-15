import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import './ChatWindow.css';

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ChatWindowProps {
  bookingId: string;
  receiverId: string;
  receiverName: string;
  onClose?: () => void;
  /** Full-page chat (dedicated route) vs modal overlay */
  fullPage?: boolean;
}

const ChatWindow = ({
  bookingId,
  receiverId,
  receiverName,
  onClose,
  fullPage = false,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat', bookingId],
    queryFn: async () => {
      const response = await api.get(`/chat/booking/${bookingId}`);
      return response.data.data;
    },
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post('/chat/send', {
        bookingId,
        receiverId,
        message: content,
      });
      return response.data.data;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-conversations'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/chat/read/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['unread-chat-count'] });
    },
  });

  useEffect(() => {
    if (messages && messages.some((m: Message) => !m.read && m.receiver_id === user?.id)) {
      markAsReadMutation.mutate();
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  return (
    <div className={`chat-window ${fullPage ? 'chat-window--full-page' : ''}`}>
      <div className="chat-header">
        <div className="receiver-info">
          {fullPage && onClose && (
            <button type="button" className="chat-back-btn" onClick={onClose} aria-label="Back">
              <Icon name="arrowLeft" size={18} />
            </button>
          )}
          <div className="avatar">{receiverName.charAt(0)}</div>
          <h3>{receiverName}</h3>
        </div>
        {!fullPage && (
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="chat-messages">
        {isLoading ? (
          <LoadingSpinner />
        ) : messages?.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages?.map((msg: Message) => (
            <div
              key={msg.id}
              className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.message}</div>
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sendMessageMutation.isPending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
          className="send-btn"
        >
          {sendMessageMutation.isPending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
