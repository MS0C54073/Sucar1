import { ReactNode } from 'react';
import NotificationCenter from '../notifications/NotificationCenter';
import ThemeToggle from './ThemeToggle';
import BrandLogo from '../BrandLogo';
import ClientHomeSearch, { HomeSearchSelection } from '../search/ClientHomeSearch';
import type { ExplorerCarWash } from '../map/CarWashMapExplorer';
import type { HomeServiceOption } from '../search/ClientHomeSearch';

interface ClientHeroProps {
  userName: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  services?: HomeServiceOption[];
  carWashes?: ExplorerCarWash[];
  onSearchSelect?: (pick: HomeSearchSelection) => void;
  carWashesLoading?: boolean;
  carWashesError?: boolean;
  onRetryCarWashes?: () => void;
  notificationSlot?: ReactNode;
}

const ClientHero = ({
  userName,
  searchValue = '',
  onSearchChange,
  services = [],
  carWashes = [],
  onSearchSelect,
  carWashesLoading = false,
  carWashesError = false,
  onRetryCarWashes,
  notificationSlot,
}: ClientHeroProps) => {
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <header className={`sucar-hero${onSearchChange ? ' sucar-hero--with-search' : ''}`}>
      <div className="sucar-hero-top">
        <BrandLogo className="sucar-logo" size={30} textClassName="sucar-logo__text" />
        <div className="sucar-hero-actions">
          <ThemeToggle />
          {notificationSlot ?? <NotificationCenter />}
        </div>
      </div>
      <div className="sucar-hero-greeting">
        <h1>Hi, {firstName}</h1>
        <p>Book a wash or check where your car is in the queue.</p>
      </div>
      {onSearchChange && onSearchSelect ? (
        <ClientHomeSearch
          services={services}
          carWashes={carWashes}
          value={searchValue}
          onChange={onSearchChange}
          onSelect={onSearchSelect}
          isLoading={carWashesLoading}
          loadError={carWashesError}
          onRetry={onRetryCarWashes}
        />
      ) : null}
    </header>
  );
};

export default ClientHero;
