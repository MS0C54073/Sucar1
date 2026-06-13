/** SuCAR design tokens — shared client & driver shells */

export const AppLayout = {
  screenPadding: 16,
  cardRadius: 14,
  tabBarHeight: 62,
  topBarPaddingV: 10,
  sectionTitleSize: 16,
  heroAvatarSize: 44,
};

/** Base light shell (client + driver tabs) */
export const ClientColors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#5EEAD4',
  accent: '#F97316',
  greenLight: '#CCFBF1',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  tabActive: '#0D9488',
  tabInactive: '#94A3B8',
  success: '#22C55E',
  error: '#EF4444',
};

/** Driver: same layout/sizing as client; blue accent for role-specific UI */
export const DriverColors = {
  ...ClientColors,
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#93C5FD',
  greenLight: '#DBEAFE',
  tabActive: '#2563EB',
};

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline' as const },
  { id: 'exterior', label: 'Exterior', icon: 'water-outline' as const },
  { id: 'full', label: 'Full detail', icon: 'car-sport-outline' as const },
  { id: 'interior', label: 'Interior', icon: 'sparkles-outline' as const },
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
    background: '#0B162C',
    sheet: '#152238',
    inputBg: '#0B162C',
    inputBorder: 'rgba(0, 200, 150, 0.22)',
    primary: '#00C896',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    textDim: '#64748B',
    divider: 'rgba(148, 163, 184, 0.35)',
    googleBg: '#0B162C',
    googleBorder: 'rgba(148, 163, 184, 0.25)',
    logoBorder: '#00C896',
    logoRing: 'rgba(0, 200, 150, 0.15)',
    logoInner: '#152238',
    toggleBg: 'rgba(255, 255, 255, 0.1)',
    roleTrack: 'rgba(255, 255, 255, 0.06)',
    roleActiveText: '#0B162C',
    statusBar: 'light-content',
  },
  light: {
    background: '#E8F5F2',
    sheet: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0',
    primary: '#00C896',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    divider: '#E2E8F0',
    googleBg: '#FFFFFF',
    googleBorder: '#E2E8F0',
    logoBorder: '#00C896',
    logoRing: 'rgba(0, 200, 150, 0.12)',
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
  { id: 'standard', title: 'Standard Wash', desc: 'Exterior wash & dry', price: 15, icon: 'water-outline' as const, color: '#0D9488' },
  { id: 'deluxe', title: 'Deluxe Wash', desc: 'Exterior + interior', price: 30, icon: 'sparkles-outline' as const, color: '#F97316' },
  { id: 'detail', title: 'Detailing', desc: 'Premium full care', price: 55, icon: 'diamond-outline' as const, color: '#0D9488' },
];
