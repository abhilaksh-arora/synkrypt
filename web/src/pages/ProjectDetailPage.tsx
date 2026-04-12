import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { 
  KeyRound, Plus, Eye, EyeOff, Copy, Trash2, 
  Loader2, ShieldCheck, Terminal, Filter, Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<any>(null);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [env, setEnv] = useState('dev');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSecret, setNewSecret] = useState({ key: '', value: '', environment: 'dev' });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, env]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pData = await api.getProject(id!);
      setProject(pData.project);
      const sData = await api.listSecrets(id!, env);
      setSecrets(sData.secrets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertSecret(id!, { ...newSecret, environment: env });
      await loadData();
      setIsAddOpen(false);
      setNewSecret({ key: '', value: '', environment: env });
      toast({ title: "Secret Injected", description: `${newSecret.key} is now live in ${env}.` });
    } catch (err: any) {
      toast({ title: "Encryption Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sid: string) => {
    if (!confirm('Are you sure you want to purge this secret?')) return;
    try {
      await api.deleteSecret(id!, sid);
      await loadData();
      toast({ title: "Secret Purged" });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReveal = (sid: string) => {
    setRevealed(prev => ({ ...prev, [sid]: !prev[sid] }));
  };

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    toast({ title: "Copied to Clipboard" });
  };

  const filteredSecrets = secrets.filter(s => s.key.toLowerCase().includes(search.toLowerCase()));

  if (loading && !project) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary size-10" />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Project Header Widget */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
             <Terminal className="size-3" />
             Infrastructure Identifier: <span className="opacity-60">{project?.slug}</span>
           </div>
           <h2 className="text-3xl font-bold tracking-tight text-foreground">{project?.name}</h2>
        </div>
        <div className="flex items-center gap-3">
           <Tabs value={env} onValueChange={setEnv} className="w-auto">
             <TabsList className="h-12 rounded-xl bg-muted/40 p-1 border border-border/40 backdrop-blur-xl">
               <TabsTrigger value="dev" className="rounded-lg px-5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">Development</TabsTrigger>
               <TabsTrigger value="staging" className="rounded-lg px-5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">Staging</TabsTrigger>
               <TabsTrigger value="prod" className="rounded-lg px-5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">Production</TabsTrigger>
             </TabsList>
           </Tabs>
           <Button onClick={() => setIsAddOpen(true)} className="rounded-xl px-6 h-12 font-bold shadow-xl shadow-primary/20 hover-elevate">
              <Plus className="mr-2 size-5" /> Add Secret
           </Button>
        </div>
      </div>

      {/* Stats / Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 rounded-[2rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Active Secrets</p>
               <h4 className="text-3xl font-black mt-1">{secrets.length}</h4>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
               <ShieldCheck className="size-6" />
            </div>
         </Card>
         <Card className="p-6 rounded-[2rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Environment</p>
               <h4 className="text-2xl font-bold mt-1 uppercase text-primary">{env}</h4>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
               <Filter className="size-6" />
            </div>
         </Card>
         <Card className="p-6 rounded-[2rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between group cursor-help">
            <div className="flex-1">
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Encryption</p>
               <h4 className="text-2xl font-bold mt-1 truncate">AES-GCM</h4>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
               <KeyRound className="size-6" />
            </div>
         </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/40 shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input 
                 placeholder="Search cryptographic keys..." 
                 className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
           </div>
           <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl h-11 border-border/40 font-bold hover:bg-muted/80">
                 Export JSON
              </Button>
           </div>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableHead className="w-[35%] py-5 pl-10 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Key Identifier</TableHead>
                <TableHead className="w-[45%] text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Encrypted Payload</TableHead>
                <TableHead className="w-[20%] text-right pr-10 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Modifications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i} className="border-border/10 animate-pulse">
                    <TableCell className="pl-10"><div className="h-5 w-32 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell><div className="h-5 w-64 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell className="pr-10 text-right"><div className="h-8 w-8 bg-muted/40 rounded-lg ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSecrets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-64 text-center">
                     <div className="flex flex-col items-center justify-center opacity-30">
                        <ShieldCheck size={48} className="mb-4" />
                        <p className="font-bold text-lg italic">No secrets found in this cluster.</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : filteredSecrets.map(secret => (
                <TableRow key={secret.id} className="border-border/10 group hover:bg-muted/10 transition-colors">
                  <TableCell className="pl-10">
                     <div className="font-mono text-sm font-bold text-foreground bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 inline-block">
                        {secret.key}
                     </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-2.5 rounded-xl border transition-all truncate max-w-sm ${revealed[secret.id] ? 'bg-background border-primary/20 text-foreground shadow-inner' : 'bg-muted/30 border-border/40 text-muted-foreground/40'}`}>
                           {revealed[secret.id] ? secret.value : '••••••••••••••••••••••••••••••••'}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background" onClick={() => toggleReveal(secret.id)}>
                              {revealed[secret.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                           </Button>
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background" onClick={() => copyToClipboard(secret.value)}>
                              <Copy size={16} />
                           </Button>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                     <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100" onClick={() => handleDelete(secret.id)}>
                        <Trash2 size={18} />
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-6 bg-muted/5 flex justify-center border-t border-border/10">
           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              <Loader2 className="size-3" /> System idle // Waiting for local injection
           </div>
        </div>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-8">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Plus size={32} />
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">New Secret Injection</DialogTitle>
              <DialogDescription className="text-base">
                Securely persist an encrypted environment key into the <span className="text-primary font-bold uppercase">{env}</span> runtime cluster.
              </DialogDescription>
            </DialogHeader>
            
            <form id="secret-form" onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="s-key" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Key Identifier (SHOUT_CASE)</Label>
                <Input
                  id="s-key"
                  placeholder="DATABASE_VORTEX_URL"
                  className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono font-bold"
                  value={newSecret.key}
                  onChange={e => setNewSecret(p => ({ ...p, key: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="s-val" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Payload (Secret Value)</Label>
                <Input
                  id="s-val"
                  type="password"
                  placeholder="e.g. postgres://cluster.vortex.link/main"
                  className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono"
                  value={newSecret.value}
                  onChange={e => setNewSecret(p => ({ ...p, value: e.target.value }))}
                  required
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/10">
            <Button form="secret-form" type="submit" disabled={saving} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover-elevate">
              {saving ? <Loader2 className="animate-spin" /> : "Inject Cryptographic Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
