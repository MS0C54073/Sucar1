import { useTheme } from '../context/ThemeContext';
import Icon from './icons/Icon';
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
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
      </button>
    </div>
  );
};

export default ThemeToggle;
