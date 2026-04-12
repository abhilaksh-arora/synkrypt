import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Users, UserPlus, Trash2, Shield, Mail, 
  Crown, Code, Loader2, Search, ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', password: '', role: 'developer' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.listUsers();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.createUser(inviteForm);
      await loadUsers();
      setIsInviteOpen(false);
      setInviteForm({ email: '', name: '', password: '', role: 'developer' });
      toast({ title: "User Recruited", description: `${inviteForm.name} has been added to the vortex.` });
    } catch (err: any) {
      toast({ title: "Recruitment Failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to terminate this user access?')) return;
    try {
      await api.deleteUser(uid);
      await loadUsers();
      toast({ title: "Access Terminated" });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
             <Shield className="size-3" />
             Access Control Management
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground">Personnel Directory</h2>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="rounded-xl px-8 h-12 font-bold shadow-xl shadow-primary/20 hover-elevate transition-all">
          <UserPlus className="mr-2 size-5" /> Recruit User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-8 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Personnel</p>
               <h4 className="text-4xl font-black mt-1 tracking-tighter">{users.length}</h4>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
               <Users className="size-6" />
            </div>
         </Card>
         <Card className="p-8 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Administrators</p>
               <h4 className="text-4xl font-black mt-1 tracking-tighter">{users.filter(u => u.role === 'admin').length}</h4>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-amber-500/5 text-amber-500 flex items-center justify-center">
               <Crown className="size-6" />
            </div>
         </Card>
         <Card className="p-8 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Developers</p>
               <h4 className="text-4xl font-black mt-1 tracking-tighter">{users.filter(u => u.role === 'developer').length}</h4>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-500/5 text-blue-500 flex items-center justify-center">
               <Code className="size-6" />
            </div>
         </Card>
      </div>

      <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/40 shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input 
                 placeholder="Search by name or email identity..." 
                 className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableHead className="py-5 pl-10 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Personnel Identity</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Access Level</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Deployment Date</TableHead>
                <TableHead className="text-right pr-10 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i} className="border-border/10 animate-pulse">
                    <TableCell className="pl-10"><div className="h-12 w-48 bg-muted/40 rounded-xl" /></TableCell>
                    <TableCell><div className="h-6 w-24 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell><div className="h-5 w-32 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell className="pr-10 text-right"><div className="h-8 w-8 bg-muted/40 rounded-lg ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.map(u => (
                <TableRow key={u.id} className="border-border/10 group hover:bg-muted/10 transition-colors">
                  <TableCell className="pl-10">
                     <div className="flex items-center gap-4 py-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 transition-transform group-hover:scale-110">
                           {u.name.charAt(0)}
                        </div>
                        <div>
                           <div className="font-bold text-foreground text-lg tracking-tight">{u.name}</div>
                           <div className="text-xs font-mono text-muted-foreground/60 flex items-center gap-1.5 mt-0.5">
                              <Mail className="size-3" />
                              {u.email}
                           </div>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell>
                     <Badge className={`rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none shadow-sm ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {u.role}
                     </Badge>
                  </TableCell>
                  <TableCell>
                     <div className="text-sm font-medium text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-12 w-12 rounded-2xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100" 
                       onClick={() => handleDelete(u.id)}
                       disabled={u.email === 'admin@example.com'}
                     >
                        <Trash2 size={20} />
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-8">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                <UserPlus size={32} />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter leading-tight">Identity Recruitment</DialogTitle>
              <DialogDescription className="text-base">
                Invite a new user to join the Synkrypt personnel nexus with specific access protocols.
              </DialogDescription>
            </DialogHeader>
            
            <form id="invite-form" onSubmit={handleInvite} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Full Name</Label>
                  <Input 
                    placeholder="Rick Deckard" 
                    className="h-12 rounded-2xl bg-muted/30"
                    value={inviteForm.name}
                    onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Access Role</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={v => setInviteForm({...inviteForm, role: v})}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl">
                       <SelectItem value="developer">Developer</SelectItem>
                       <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Neural ID (Email)</Label>
                <Input 
                  type="email" 
                  placeholder="rick@nexus6.com" 
                  className="h-12 rounded-2xl bg-muted/30 font-mono text-sm"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Initial Access Key (Password)</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••••••" 
                  className="h-12 rounded-2xl bg-muted/30 font-mono"
                  value={inviteForm.password}
                  onChange={e => setInviteForm({...inviteForm, password: e.target.value})}
                  required
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/5">
            <Button form="invite-form" type="submit" disabled={inviting} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/20 transition-all hover-elevate">
              {inviting ? <Loader2 className="animate-spin" /> : (
                <>Authorize Recruitment <ArrowRight size={20} className="ml-2" /></>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
