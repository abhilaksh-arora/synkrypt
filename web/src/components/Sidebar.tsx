import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, Building2, Users, Settings, LogOut, LockKeyhole } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orgs', icon: Building2, label: 'Organizations' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <aside className="w-64 min-h-screen bg-sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col">
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <LockKeyhole size={18} />
        </div>
        <div className="font-bold text-lg text-sidebar-foreground">
          Synk<span className="text-primary">rypt</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2 mb-1">
          Navigation
        </div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`
            }
          >
            <item.icon size={18} className="opacity-80" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
