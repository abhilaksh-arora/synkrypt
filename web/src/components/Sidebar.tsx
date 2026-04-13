import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, Users, Settings, LogOut, LockKeyhole, Tags, ShieldAlert, BookOpen, Briefcase } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vault', icon: Briefcase, label: 'My Vault' },
  { to: '/users', icon: Users, label: 'Team Members', adminOnly: true },
  { to: '/presets', icon: Tags, label: 'Access Presets', adminOnly: true },
  { to: '/audit-logs', icon: ShieldAlert, label: 'Audit Logs', adminOnly: true },
];

const secondaryItems = [
  { to: '/docs', icon: BookOpen, label: 'Documentation' },
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
    <aside className="w-[200px] min-h-screen bg-sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
          <LockKeyhole size={15} />
        </div>
        <div className="font-bold text-base tracking-tight text-sidebar-foreground">
          Synkrypt
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-5">
        <div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 mb-1 opacity-50">
            Management
          </div>
          <div className="flex flex-col gap-0.5">
            {navItems.filter(i => !i.adminOnly || user?.role === 'admin').map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`
                }
              >
                <item.icon size={15} className="opacity-80 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 mb-1 opacity-50">
            Resources
          </div>
          <div className="flex flex-col gap-0.5">
            {secondaryItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`
                }
              >
                <item.icon size={15} className="opacity-80 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-sidebar-accent/50 border border-sidebar-border transition-all hover:bg-sidebar-accent cursor-default">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[13px] font-semibold text-sidebar-foreground truncate leading-tight">{user?.name}</div>
            <div className="text-[9px] font-medium text-muted-foreground uppercase truncate">{user?.role}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive">
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
