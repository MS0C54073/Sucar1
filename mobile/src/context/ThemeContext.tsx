import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as BaseColors } from '../constants/theme';
import {
  AuthAppearance,
  AuthThemePalette,
  getAuthTheme,
} from '../constants/sucarTheme';

const STORAGE_KEY = 'sucar_appearance';

const light = {
  name: 'light' as const,
  colors: { ...BaseColors },
};

const darkBlue = {
  name: 'darkBlue' as const,
  colors: {
    ...BaseColors,
    primary: '#00C896',
    primaryDark: '#00A67E',
    gradientStart: '#0B162C',
    gradientEnd: '#152238',
    headerGradientStart: '#0B162C',
    headerGradientEnd: '#152238',
    background: '#0B162C',
    surface: '#152238',
    surfaceElevated: '#1C2A42',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#2A3548',
    borderLight: '#1E293B',
    white: '#ffffff',
  },
};

export type ThemeMode = 'light' | 'darkBlue';

type ThemeContextValue = {
  mode: ThemeMode;
  appearance: AuthAppearance;
  theme: typeof light | typeof darkBlue;
  authTheme: AuthThemePalette;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
  setAppearance: (a: AuthAppearance) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

const modeFromAppearance = (a: AuthAppearance): ThemeMode =>
  a === 'dark' ? 'darkBlue' : 'light';

const appearanceFromMode = (m: ThemeMode): AuthAppearance =>
  m === 'darkBlue' ? 'dark' : 'light';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [appearance, setAppearanceState] = useState<AuthAppearance>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setAppearanceState(stored);
        }
      } catch {
        /* default dark */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistAppearance = useCallback(async (next: AuthAppearance) => {
    setAppearanceState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setAppearance = useCallback(
    (a: AuthAppearance) => {
      persistAppearance(a);
    },
    [persistAppearance],
  );

  const mode = modeFromAppearance(appearance);
  const theme = mode === 'light' ? light : darkBlue;
  const authTheme = getAuthTheme(appearance);

  const toggle = () => {
    persistAppearance(appearance === 'dark' ? 'light' : 'dark');
  };

  const setMode = (m: ThemeMode) => {
    persistAppearance(appearanceFromMode(m));
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        appearance,
        theme,
        authTheme,
        toggle,
        setMode,
        setAppearance,
        ready,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
