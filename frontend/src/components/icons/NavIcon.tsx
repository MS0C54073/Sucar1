/** Simple line icons for navigation — no emoji */

type NavIconName =
  | 'home'
  | 'bookings'
  | 'car'
  | 'deals'
  | 'profile'
  | 'dashboard'
  | 'jobs'
  | 'earnings'
  | 'map'
  | 'services'
  | 'settings'
  | 'signout';

const stroke = 'currentColor';

const common = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function NavIcon({ name }: { name: NavIconName }) {
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      );
    case 'bookings':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case 'car':
      return (
        <svg {...common}>
          <path d="M6 17h12l1.5-5.5L16 8H8l-2.5 3.5L6 17z" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case 'deals':
      return (
        <svg {...common}>
          <path d="M12 2 4 7v10l8 5 8-5V7l-8-5z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case 'jobs':
      return (
        <svg {...common}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12h14V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case 'earnings':
      return (
        <svg {...common}>
          <path d="M12 3v18M7 8c0-2 2.2-3 5-3s5 1 5 3-2.2 3-5 3-5 1-5 3 2.2 3 5 3" />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          <path d="M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3z" />
          <path d="M9 4v13M15 7v13" />
        </svg>
      );
    case 'services':
      return (
        <svg {...common}>
          <path d="M12 3c-4 4-6 7-6 10a6 6 0 1 0 12 0c0-3-2-6-6-10z" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
        </svg>
      );
    case 'signout':
      return (
        <svg {...common}>
          <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 12H8M18 8l4 4-4 4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export type { NavIconName };
