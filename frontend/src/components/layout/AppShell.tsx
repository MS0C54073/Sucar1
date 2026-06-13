import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BottomNav, { NavItem } from './BottomNav';
import SidebarNav from './SidebarNav';
import './AppShell.css';

export type AppSkin = 'light' | 'driver';

interface AppShellProps {
  children: ReactNode;
  skin?: AppSkin;
  hero?: ReactNode;
  navItems: NavItem[];
  activeNav: string;
  onNavChange: (id: string) => void;
  showSidebar?: boolean;
  sidebarItems?: NavItem[];
}

const AppShell = ({
  children,
  skin = 'light',
  hero,
  navItems,
  activeNav,
  onNavChange,
  showSidebar = false,
  sidebarItems,
}: AppShellProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-app-skin', skin);
    if (skin === 'driver') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    return () => {
      document.documentElement.removeAttribute('data-app-skin');
    };
  }, [skin]);

  const handleNav = (id: string) => {
    if (id === 'profile') {
      navigate('/profile');
      return;
    }
    onNavChange(id);
  };

  return (
    <div
      className={`sucar-app ${showSidebar ? 'sucar-app--with-sidebar' : ''}`}
      data-role={user?.role}
    >
      {showSidebar && sidebarItems && (
        <SidebarNav items={sidebarItems} activeId={activeNav} onSelect={handleNav} />
      )}
      <div className="sucar-main">
        {hero}
        <div className="sucar-content">{children}</div>
      </div>
      <BottomNav items={navItems} activeId={activeNav} onSelect={handleNav} />
    </div>
  );
};

export default AppShell;
