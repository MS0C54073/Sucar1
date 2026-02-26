import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-toggle-container" role="group" aria-label="Theme controls">
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <span className="theme-icon" aria-hidden>🌙</span>
        ) : (
          <span className="theme-icon" aria-hidden>☀️</span>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;
