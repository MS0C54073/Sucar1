import NotificationCenter from '../notifications/NotificationCenter';
import ThemeToggle from './ThemeToggle';
import BrandLogo from '../BrandLogo';

interface DriverHeroProps {
  userName: string;
  profilePictureUrl?: string;
  online: boolean;
  onOnlineChange: (v: boolean) => void;
}

const DriverHero = ({
  userName,
  profilePictureUrl,
  online,
  onOnlineChange,
}: DriverHeroProps) => {
  const firstName = userName?.split(' ')[0] || 'Driver';

  return (
    <header className="sucar-hero sucar-hero--driver">
      <div className="sucar-hero-top">
        <BrandLogo className="sucar-logo" size={30} textClassName="sucar-logo__text" />
        <div className="sucar-hero-actions">
          <ThemeToggle />
          <NotificationCenter />
        </div>
      </div>
      <div className="sucar-profile-row">
        {profilePictureUrl ? (
          <img src={profilePictureUrl} alt="" className="sucar-avatar" />
        ) : (
          <div className="sucar-avatar-fallback">{firstName.charAt(0)}</div>
        )}
        <div className="sucar-hero-greeting">
          <h1>Hi, {firstName}</h1>
          <p>Jobs and pickups in your area</p>
        </div>
        <div className="sucar-online-toggle">
          <label>{online ? 'Online' : 'Offline'}</label>
          <button
            type="button"
            className={`sucar-switch ${online ? 'on' : ''}`}
            onClick={() => onOnlineChange(!online)}
            aria-pressed={online}
            aria-label="Toggle availability"
          />
          {online && <p className="sucar-online-hint">You&apos;re available for jobs</p>}
        </div>
      </div>
    </header>
  );
};

export default DriverHero;
