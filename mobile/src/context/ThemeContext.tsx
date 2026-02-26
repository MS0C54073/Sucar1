import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Colors as BaseColors } from '../constants/theme';

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
    primary: '#0f4c81',
    primaryDark: '#0b3b66',
    gradientStart: '#07203a',
    gradientEnd: '#0f4c81',
    background: '#071127',
    surface: '#0b1a2b',
    textPrimary: '#e6eef9',
    textSecondary: '#b6c9e1',
    border: '#122436',
    borderLight: '#082033',
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
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggle = () => setMode((m) => (m === 'light' ? 'darkBlue' : 'light'));

  const theme = mode === 'light' ? light : darkBlue;

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle, setMode }}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
