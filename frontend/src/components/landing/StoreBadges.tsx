/**
 * Official-style App Store + Google Play badges.
 *
 * Self-contained SVG recreations (no external images) so they stay crisp at
 * any size and need no asset pipeline. Black badges per both stores' brand
 * guidelines; they read correctly in light and dark themes.
 */

interface StoreBadgesProps {
  iosHref?: string;
  androidHref?: string;
  className?: string;
}

const AppStoreBadge = ({ href }: { href: string }) => (
  <a
    className="lp-badge"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Download on the App Store"
  >
    <svg className="lp-badge__glyph" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.6c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.4 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-2c.7-1.1 1-2.1 1-2.2-.1 0-2-.8-2.1-3.2ZM14.6 6.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.7-.4 2.3-1.1Z"
      />
    </svg>
    <span className="lp-badge__text">
      <small>Download on the</small>
      <strong>App Store</strong>
    </span>
  </a>
);

const GooglePlayBadge = ({ href }: { href: string }) => (
  <a
    className="lp-badge"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Get it on Google Play"
  >
    <svg className="lp-badge__play" viewBox="0 0 24 25" width="24" height="25" aria-hidden="true">
      <defs>
        <linearGradient id="gpBlue" x1="0" y1="2" x2="14" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00C3FF" />
          <stop offset="1" stopColor="#00A0FF" />
        </linearGradient>
        <linearGradient id="gpGreen" x1="3" y1="2" x2="18.5" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00E676" />
          <stop offset="1" stopColor="#00C853" />
        </linearGradient>
        <linearGradient id="gpYellow" x1="3" y1="23" x2="18.5" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD500" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id="gpRed" x1="14" y1="12.5" x2="21.5" y2="12.5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF3A44" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <polygon points="3,2 14,12.5 3,23" fill="url(#gpBlue)" />
      <polygon points="3,2 18.5,7.5 14,12.5" fill="url(#gpGreen)" />
      <polygon points="3,23 18.5,17.5 14,12.5" fill="url(#gpYellow)" />
      <polygon points="18.5,7.5 21.5,12.5 18.5,17.5 14,12.5" fill="url(#gpRed)" />
    </svg>
    <span className="lp-badge__text">
      <small>GET IT ON</small>
      <strong>Google Play</strong>
    </span>
  </a>
);

const StoreBadges = ({
  iosHref = 'https://apps.apple.com/app/sucar',
  androidHref = 'https://play.google.com/store/apps/details?id=com.sucar',
  className = '',
}: StoreBadgesProps) => (
  <div className={`lp-badges ${className}`.trim()}>
    <AppStoreBadge href={iosHref} />
    <GooglePlayBadge href={androidHref} />
  </div>
);

export default StoreBadges;
