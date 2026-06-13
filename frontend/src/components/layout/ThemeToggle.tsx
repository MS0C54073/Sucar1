import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

type ThemeToggleProps = {
  className?: string;
  /** Icon-only for hero bars; segmented for profile/settings */
  variant?: 'icon' | 'segmented';
};

const ThemeToggle = ({ className = '', variant = 'icon' }: ThemeToggleProps) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={`theme-segmented ${className}`.trim()}
        role="group"
        aria-label="Color theme"
      >
        <button
          type="button"
          className={`theme-segmented-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
        >
          Light
        </button>
        <button
          type="button"
          className={`theme-segmented-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
        >
          Dark
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`sucar-icon-btn theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;
