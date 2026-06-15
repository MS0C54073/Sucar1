/** SuCAR design tokens — shared client & driver shells */

export const AppLayout = {
  screenPadding: 16,
  cardRadius: 14,
  tabBarHeight: 62,
  topBarPaddingV: 10,
  sectionTitleSize: 16,
  heroAvatarSize: 44,
};

/** Base light shell (client + driver tabs) — purple brand identity */
export const ClientColors = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#DDD6FE',
  accent: '#EC4899',
  accentDark: '#DB2777',
  accentLight: '#FBCFE8',
  /** Soft brand tint for icon chips/thumbnails (legacy key name) */
  greenLight: '#EDE9FE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  tabActive: '#EC4899',
  tabInactive: '#94A3B8',
  success: '#22C55E',
  error: '#EF4444',
};

/** Driver: same layout/sizing as client; deeper violet to distinguish the role */
export const DriverColors = {
  ...ClientColors,
  primary: '#6D28D9',
  primaryDark: '#5B21B6',
  primaryLight: '#C4B5FD',
  greenLight: '#EDE9FE',
  tabActive: '#6D28D9',
};

/** Header & avatar gradients — purple → pink mix from reference mockup */
export const BrandGradients = {
  header: ['#4C1D95', '#7C3AED', '#9333EA'] as const,
  headerLocations: [0, 0.5, 1] as const,
  avatar: ['#7C3AED', '#EC4899'] as const,
  /** Driver identity — deeper violet, no pink (distinct from client) */
  headerDriver: ['#2E1065', '#4C1D95', '#6D28D9'] as const,
  avatarDriver: ['#6D28D9', '#A855F7'] as const,
};

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline' as const },
  { id: 'exterior', label: 'Exterior', icon: 'water-outline' as const },
  { id: 'interior', label: 'Interior', icon: 'car-outline' as const },
  { id: 'premium', label: 'Premium', icon: 'sparkles-outline' as const },
];

export type AuthAppearance = 'dark' | 'light';

export type AuthThemePalette = {
  background: string;
  sheet: string;
  inputBg: string;
  inputBorder: string;
  primary: string;
  text: string;
  textMuted: string;
  textDim: string;
  divider: string;
  googleBg: string;
  googleBorder: string;
  logoBorder: string;
  logoRing: string;
  logoInner: string;
  toggleBg: string;
  roleTrack: string;
  roleActiveText: string;
  statusBar: 'light-content' | 'dark-content';
};

export const AuthThemes: Record<AuthAppearance, AuthThemePalette> = {
  dark: {
    background: '#1A0B2E',
    sheet: '#241040',
    inputBg: '#1A0B2E',
    inputBorder: 'rgba(124, 58, 237, 0.3)',
    primary: '#A855F7',
    text: '#FFFFFF',
    textMuted: '#A99CC4',
    textDim: '#7C708F',
    divider: 'rgba(168, 139, 209, 0.28)',
    googleBg: '#1A0B2E',
    googleBorder: 'rgba(168, 139, 209, 0.25)',
    logoBorder: '#A855F7',
    logoRing: 'rgba(168, 85, 247, 0.18)',
    logoInner: '#241040',
    toggleBg: 'rgba(255, 255, 255, 0.1)',
    roleTrack: 'rgba(255, 255, 255, 0.06)',
    roleActiveText: '#1A0B2E',
    statusBar: 'light-content',
  },
  light: {
    background: '#F3EEFF',
    sheet: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0',
    primary: '#7C3AED',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    divider: '#E2E8F0',
    googleBg: '#FFFFFF',
    googleBorder: '#E2E8F0',
    logoBorder: '#7C3AED',
    logoRing: 'rgba(124, 58, 237, 0.12)',
    logoInner: '#FFFFFF',
    toggleBg: 'rgba(255, 255, 255, 0.92)',
    roleTrack: '#F1F5F9',
    roleActiveText: '#0F172A',
    statusBar: 'dark-content',
  },
};

/** @deprecated use AuthThemes[appearance] */
export const AuthColors = AuthThemes.dark;

export const getAuthTheme = (appearance: AuthAppearance): AuthThemePalette =>
  AuthThemes[appearance];

export const POPULAR_SERVICES = [
  { id: 'standard', title: 'Standard Wash', desc: 'Exterior wash & dry', price: 15, icon: 'water-outline' as const, color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'deluxe', title: 'Deluxe Wash', desc: 'Exterior + interior', price: 30, icon: 'sparkles-outline' as const, color: '#EC4899', bg: '#FCE7F3' },
  { id: 'detail', title: 'Detailing', desc: 'Premium full care', price: 55, icon: 'diamond-outline' as const, color: '#9333EA', bg: '#EDE9FE' },
];
