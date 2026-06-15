import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  /** Accepts a string/emoji (legacy) or an icon element (preferred). */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
