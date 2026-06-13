import { ReactNode } from 'react';
import NotificationCenter from '../notifications/NotificationCenter';

interface ClientHeroProps {
  userName: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  notificationSlot?: ReactNode;
}

const ClientHero = ({
  userName,
  searchValue = '',
  onSearchChange,
  notificationSlot,
}: ClientHeroProps) => {
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <header className="sucar-hero">
      <div className="sucar-hero-top">
        <div className="sucar-logo">
          SuCAR <span className="sucar-logo-sparkle">✦</span>
        </div>
        <div className="sucar-hero-actions">
          {notificationSlot ?? <NotificationCenter />}
        </div>
      </div>
      <div className="sucar-hero-greeting">
        <h1>Hello, {firstName}!</h1>
        <p>Let&apos;s get your car sparkling clean.</p>
      </div>
      <div className="sucar-search">
        <span aria-hidden>🔍</span>
        <input
          type="search"
          placeholder="Search for a car wash near you..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <button type="button" className="sucar-search-filter" aria-label="Filters">
          ⚙
        </button>
      </div>
    </header>
  );
};

export default ClientHero;
