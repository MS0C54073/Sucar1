/** SuCAR design tokens — from product HTML mockups */

export const ClientColors = {
  primary: '#1D9E75',
  primaryDark: '#0F6E56',
  primaryLight: '#9FE1CB',
  greenLight: '#E1F5EE',
  background: '#F4F3EF',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#A0A0A0',
  border: 'rgba(0,0,0,0.08)',
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  tabActive: '#1D9E75',
  tabInactive: '#A0A0A0',
};

export const DriverColors = {
  primary: '#3DD68C',
  primaryDark: '#1AAB6D',
  background: '#111318',
  surface: '#1C2028',
  surfaceElevated: '#262C36',
  text: '#F0F0EE',
  textSecondary: '#8A909E',
  textMuted: '#555E72',
  border: 'rgba(255,255,255,0.07)',
  success: '#3DD68C',
  warning: '#F59E0B',
  error: '#EF4444',
  blue: '#60A5FA',
  tabBar: '#1C2028',
  tabActive: '#3DD68C',
};

export const CATEGORIES = [
  { id: 'exterior', label: 'Exterior', icon: 'water-outline' as const },
  { id: 'full', label: 'Full detail', icon: 'car-sport-outline' as const },
  { id: 'interior', label: 'Interior', icon: 'sparkles-outline' as const },
  { id: 'ev', label: 'EV care', icon: 'flash-outline' as const },
  { id: 'eco', label: 'Eco wash', icon: 'leaf-outline' as const },
];
