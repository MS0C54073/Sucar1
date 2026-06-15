/**
 * Light/Dark theme toggle (web only).
 *
 * Reuses the app's existing theme system: a `data-theme` attribute on
 * <html> plus a `theme` key in localStorage (initialized in main.tsx).
 * This component only flips and persists that value — no new global state.
 */
import { useEffect, useState } from 'react';
import Icon from '../icons/Icon';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="lp-theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
    </button>
  );
};

export default ThemeToggle;
