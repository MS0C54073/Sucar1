import { useNavigate } from 'react-router-dom';
import { NavItem } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { NavIcon, type NavIconName } from '../icons/NavIcon';
import BrandLogo from '../BrandLogo';

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
        <BrandLogo size={30} />
      </div>
      <p className="sucar-sidebar-user">{user?.name}</p>
      <nav className="sucar-sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sucar-sidebar-link ${activeId === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="sucar-sidebar-link__icon" aria-hidden>
              <NavIcon name={item.icon as NavIconName} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sucar-sidebar-footer">
        <div className="sucar-sidebar-footer-top">
          <button type="button" className="sucar-sidebar-link" onClick={() => onSelect('profile')}>
            <span className="sucar-sidebar-link__icon" aria-hidden>
              <NavIcon name="profile" />
            </span>
            Profile
          </button>
          <ThemeToggle className="sucar-sidebar-theme" />
        </div>
        <button type="button" className="sucar-sidebar-link sucar-sidebar-signout" onClick={handleLogout}>
          <span className="sucar-sidebar-link__icon" aria-hidden>
            <NavIcon name="signout" />
          </span>
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;
