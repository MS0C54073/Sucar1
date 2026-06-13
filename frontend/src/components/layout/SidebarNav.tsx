import { useNavigate } from 'react-router-dom';
import { NavItem } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

interface SidebarNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

const SidebarNav = ({ items, activeId, onSelect }: SidebarNavProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sucar-sidebar">
      <div className="sucar-sidebar-logo">
        <span>SuCAR</span>
        <span className="sucar-logo-sparkle">✦</span>
      </div>
      <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '1.5rem' }}>{user?.name}</p>
      <nav className="sucar-sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sucar-sidebar-link ${activeId === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sucar-sidebar-footer">
        <button type="button" className="sucar-sidebar-link" onClick={() => onSelect('profile')}>
          👤 Profile
        </button>
        <button type="button" className="sucar-sidebar-link" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;
