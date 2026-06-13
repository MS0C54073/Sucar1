export interface NavItem {
  id: string;
  label: string;
  icon: string;
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
        <span className="nav-icon" aria-hidden>
          {item.icon}
        </span>
        {item.label}
      </button>
    ))}
  </nav>
);

export default BottomNav;
