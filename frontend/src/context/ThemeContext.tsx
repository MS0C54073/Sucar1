import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ViewMode = 'mobile' | 'desktop';

interface ThemeContextType {
  theme: Theme;
  viewMode: ViewMode;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleViewMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved as ViewMode) || 'desktop';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
    document.documentElement.setAttribute('data-view-mode', viewMode);
  }, [viewMode]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'mobile' ? 'desktop' : 'mobile'));
  };

  return (
    <ThemeContext.Provider value={{ theme, viewMode, setTheme, toggleTheme, toggleViewMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
