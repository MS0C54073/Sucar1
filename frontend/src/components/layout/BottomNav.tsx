import { NavIcon, type NavIconName } from '../icons/NavIcon';

export interface NavItem {
  id: string;
  label: string;
  icon: NavIconName;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

const BottomNav = ({ items, activeId, onSelect }: BottomNavProps) => (
  <nav className="sucar-bottom-nav" aria-label="Main navigation">
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        className={`sucar-nav-item ${activeId === item.id ? 'active' : ''}`}
        onClick={() => onSelect(item.id)}
        aria-current={activeId === item.id ? 'page' : undefined}
      >
        <span className="nav-icon">
          <NavIcon name={item.icon} />
        </span>
        {item.label}
      </button>
    ))}
  </nav>
);

export default BottomNav;
