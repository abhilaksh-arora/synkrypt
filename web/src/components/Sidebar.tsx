import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, Users, LogOut, LockKeyhole, Tags, ShieldAlert, BookOpen, Briefcase, ChevronDown, Building2, Plus, Check } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '../api/client';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vault', icon: Briefcase, label: 'My Vault' },
  { to: '/users', icon: Users, label: 'Team Members' },
  { to: '/presets', icon: Tags, label: 'Access Presets' },
  { to: '/audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
];

const secondaryItems = [
  { to: '/docs', icon: BookOpen, label: 'Documentation' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { orgs, currentOrg, setCurrentOrgById, refreshOrgs } = useOrg();
  const navigate = useNavigate();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateOrg = async () => {
    if (!newOrgName) return;
    setLoading(true);
    try {
      await api.createOrg({ name: newOrgName });
      await refreshOrgs();
      setIsCreateOrgOpen(false);
      setNewOrgName('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <aside className="w-[240px] min-h-screen bg-sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
          <LockKeyhole size={15} />
        </div>
        <div className="font-bold text-base tracking-tight text-sidebar-foreground">
          Synkrypt
        </div>
      </div>

      <div className="px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full h-11 justify-between px-3 rounded-xl bg-sidebar-accent/20 border border-sidebar-border/50 hover:bg-sidebar-accent/50 hover:border-sidebar-border transition-all duration-200 group active:scale-[0.98]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                  <Building2 size={13} />
                </div>
                <span className="text-sm font-semibold text-sidebar-foreground truncate tracking-tight">
                  {currentOrg?.name || 'Select Team'}
                </span>
              </div>
              <ChevronDown size={14} className="text-muted-foreground/40 group-hover:text-sidebar-foreground transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[224px] p-1.5" align="start" sideOffset={8}>
            <div className="px-2 py-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Your Teams</div>
            <div className="flex flex-col gap-0.5">
              {orgs.map(org => (
                <DropdownMenuItem 
                  key={org.id} 
                  onClick={() => setCurrentOrgById(org.id)}
                  className={`flex items-center justify-between rounded-lg cursor-pointer transition-all ${
                    currentOrg?.id === org.id 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      currentOrg?.id === org.id ? 'bg-primary/20' : 'bg-muted/50'
                    }`}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{org.name}</span>
                  </div>
                  {currentOrg?.id === org.id && <Check size={14} className="shrink-0" />}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="my-1.5 opacity-50" />
            <DropdownMenuItem 
              onClick={() => setIsCreateOrgOpen(true)} 
              className="rounded-lg gap-2.5 cursor-pointer text-primary font-semibold hover:bg-primary/5"
            >
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Plus size={14} />
              </div>
              New Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-5">
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 mb-1 opacity-50">
            Management
          </div>
          <div className="flex flex-col gap-0.5">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-[0_1px_4px_-1px_rgba(var(--primary),0.1)]'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5'
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
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 mb-1 opacity-50">
            Resources
          </div>
          <div className="flex flex-col gap-0.5">
            {secondaryItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-[0_1px_4px_-1px_rgba(var(--primary),0.1)]'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5'
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

      <div className="p-3 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/20 border border-sidebar-border/30 transition-all hover:bg-sidebar-accent/40 cursor-default group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold text-sidebar-foreground/90 truncate leading-tight group-hover:text-sidebar-foreground transition-colors">{user?.name}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors">
            <LogOut size={14} />
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-sidebar border-sidebar-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-sidebar-foreground">Create New Team</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="org-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Team Name</Label>
            <Input 
              id="org-name"
              placeholder="e.g. Acme Engineering" 
              className="bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground h-11"
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateOrg} disabled={loading || !newOrgName} className="w-full h-11 rounded-xl font-bold">
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
