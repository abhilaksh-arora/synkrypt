import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  Settings, Lock, ShieldCheck, Save, Loader2, 
  KeyRound, Fingerprint, UserCircle, Bell,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(user!.id, { currentPassword, newPassword });
      toast({ title: "Access Key Updated", description: "Your security credentials have been successfully rotated." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck, active: true },
    { id: 'profile', label: 'Identity Profile', icon: UserCircle, active: false },
    { id: 'keys', label: 'Organization Keys', icon: KeyRound, active: false },
    { id: 'notifications', label: 'Activity Alerts', icon: Bell, active: false },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
             <Settings className="size-3" />
             Core Configuration
           </div>
           <h2 className="text-3xl font-bold tracking-tight text-foreground">Account Infrastructure</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
        {/* Navigation Sidebar */}
        <aside className="space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${item.active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={item.active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} />
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              <ChevronRight size={14} className={`transition-transform duration-300 ${item.active ? 'rotate-0' : 'group-hover:translate-x-1'}`} />
            </button>
          ))}
          
          <div className="mt-12 p-6 rounded-[2rem] bg-muted/20 border border-border/20">
             <div className="flex items-center gap-2 mb-3">
               <Fingerprint className="size-5 text-primary opacity-50" />
               <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Session Trust</span>
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed">
               Your session is verified with high-entropy cryptographic tokens. 
             </p>
             <Badge variant="outline" className="mt-4 rounded-lg bg-background/50 border-border/20 text-xs py-1">Verified Node</Badge>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/40 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Lock size={120} />
            </div>
            
            <CardHeader className="p-10 pb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Lock size={28} />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Credential Rotation</CardTitle>
              <CardDescription className="text-lg text-muted-foreground max-w-lg">
                Your Access Key is used to finalize session handshakes. Periodic rotation is recommended for sensitive environments.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10 pt-4">
              <form id="password-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="current" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Current Access Key</Label>
                    <Input
                      id="current"
                      type="password"
                      placeholder="••••••••••••"
                      className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="hidden md:block" />
                  
                  <div className="space-y-3">
                    <Label htmlFor="new" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">New Access Key</Label>
                    <Input
                      id="new"
                      type="password"
                      placeholder="••••••••••••"
                      className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="confirm" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirm Identity Key</Label>
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="••••••••••••"
                      className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="rounded-2xl bg-destructive/5 border-destructive/20 py-4">
                    <AlertDescription className="font-bold flex items-center gap-2">
                       <ShieldCheck className="size-4" /> {error}
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
            
            <CardFooter className="p-10 pt-4 bg-muted/10 border-t border-border/10">
              <Button 
                form="password-form" 
                type="submit" 
                className="h-14 rounded-2xl px-10 font-black text-lg shadow-xl shadow-primary/20 hover-elevate transition-all group" 
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              >
                {loading ? <Loader2 className="animate-spin text-primary-foreground" /> : (
                  <>Rotate Security Credentials <Save className="ml-2 size-5 transition-transform group-hover:scale-110" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="p-8 rounded-[2rem] border border-border/30 bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center text-primary shadow-sm leading-none font-black text-xl">
                   {user?.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{user?.name}</h4>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest leading-none mt-1">Personnel ID: {user?.id.slice(0, 12)}</p>
                </div>
             </div>
             <Badge className="rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border-none shadow-sm">
                Active Protocol: {user?.role}
             </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
