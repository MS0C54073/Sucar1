import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Colors as BaseColors } from '../constants/theme';
import { isDriverApp } from '../config/appVariant';

// Build a light theme by defaulting to existing Colors
const light = {
  name: 'light',
  colors: {
    ...BaseColors,
  },
};

// Dark-blue theme overrides a subset of colors
const darkBlue = {
  name: 'darkBlue',
  colors: {
    ...BaseColors,
    primary: '#3DD68C',
    primaryDark: '#1AAB6D',
    gradientStart: '#111318',
    gradientEnd: '#1C2028',
    headerGradientStart: '#111318',
    headerGradientEnd: '#1C2028',
    background: '#111318',
    surface: '#1C2028',
    surfaceElevated: '#262C36',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#2A3548',
    borderLight: '#1E293B',
    white: '#ffffff',
  },
};

type ThemeMode = 'light' | 'darkBlue';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: typeof light | typeof darkBlue;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(isDriverApp() ? 'darkBlue' : 'light');

  const toggle = () => setMode((m) => (m === 'light' ? 'darkBlue' : 'light'));

  const theme = mode === 'light' ? light : darkBlue;

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle, setMode }}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
