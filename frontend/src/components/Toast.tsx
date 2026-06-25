import { useEffect } from 'react';
import Icon, { type IconName } from './icons/Icon';
import './Toast.css';

const TOAST_ICON: Record<'success' | 'error' | 'warning' | 'info', IconName> = {
  success: 'checkCircle',
  error: 'alertCircle',
  warning: 'alertTriangle',
  info: 'info',
};

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <div className="toast-icon">
        <Icon name={TOAST_ICON[type]} size={20} />
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
};

export default Toast;
