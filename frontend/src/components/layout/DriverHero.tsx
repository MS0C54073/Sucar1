import NotificationCenter from '../notifications/NotificationCenter';

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
        <button type="button" className="sucar-icon-btn" aria-label="Menu">
          ☰
        </button>
        <div className="sucar-logo">
          SuCAR <span className="sucar-logo-sparkle">✦</span>
        </div>
        <NotificationCenter />
      </div>
      <div className="sucar-profile-row">
        {profilePictureUrl ? (
          <img src={profilePictureUrl} alt="" className="sucar-avatar" />
        ) : (
          <div className="sucar-avatar-fallback">{firstName.charAt(0)}</div>
        )}
        <div className="sucar-hero-greeting">
          <h1>Hello, {firstName}</h1>
          <p>Driver / Detailer</p>
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
          {online && (
            <p style={{ fontSize: '0.65rem', color: 'var(--color-success)', marginTop: 4 }}>
              ● You&apos;re available for jobs
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default DriverHero;
