import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { 
  KeyRound, Plus as PlusIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Copy as CopyIcon, Trash2 as TrashIcon, 
  Loader2, ShieldCheck, Terminal, Filter as FilterIcon, Search as SearchIcon, FileUp, Lock as LockIcon, Users,
  Pencil, ArrowLeftRight, Settings2, AlertCircle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  const [activeTab, setActiveTab] = useState('secrets');
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkCanView, setBulkCanView] = useState(true);
  const [newSecret, setNewSecret] = useState({ key: '', value: '', environment: 'dev', can_view: true });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncForm, setSyncForm] = useState({ from: 'dev', to: 'staging' });
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<any>(null);

  const [isClearanceOpen, setIsClearanceOpen] = useState(false);
  const [clearanceMember, setClearanceMember] = useState<any>(null);
  const [clearanceEnvs, setClearanceEnvs] = useState<string[]>([]);
  const [updatingClearance, setUpdatingClearance] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, env]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pData = await api.getProject(id!) as any;
      setProject(pData.project);
      setProjectMembers(pData.members || []);
      const sData = await api.listSecrets(id!, env) as any;
      setSecrets(sData.secrets);

      // Fetch org members for the "Add Member" list
      const oData = await api.getOrg(pData.project.org_id);
      setOrgMembers(oData.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await api.getAuditLogs(id!) as any;
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleAddProjectMember = async (userId: string, environments: string[]) => {
    try {
      await api.addProjectMember(id!, { userId, environments });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveProjectMember = async (userId: string) => {
    if (!confirm('Remove member from project?')) return;
    try {
      await api.removeProjectMember(id!, userId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertSecret(id!, { ...newSecret, environment: env });
      await loadData();
      setIsAddOpen(false);
      setNewSecret({ key: '', value: '', environment: 'dev', can_view: true });
      toast({ title: "Cryptographic Injection Success", description: `Primary key ${newSecret.key} has been persisted to ${env}.` });
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

  const handleUpdateVisibility = async (secret: any, canView: boolean) => {
    try {
      await api.updateSecretVisibility(id!, secret.id, canView);
      await loadData();
      toast({ title: "Visibility Protocol Updated" });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertSecret(id!, { 
        key: editingSecret.key, 
        value: editingSecret.value, 
        can_view: editingSecret.can_view, 
        environment: env 
      });
      await loadData();
      setIsEditOpen(false);
      toast({ title: "Secret Updated", description: `Key ${editingSecret.key} has been re-encrypted and saved.` });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncLoading(true);
    try {
      await api.syncSecrets(id!, { fromEnv: syncForm.from, toEnv: syncForm.to });
      await loadData();
      setIsSyncOpen(false);
      toast({ title: "Environment Sync Successful", description: `Secrets promoted from ${syncForm.from} to ${syncForm.to}.` });
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleUpdateClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingClearance(true);
    try {
      await api.addProjectMember(id!, { 
        userId: clearanceMember.id, 
        environments: clearanceEnvs 
      });
      await loadData();
      setIsClearanceOpen(false);
      toast({ title: "Security Clearance Updated", description: `${clearanceMember.name}'s access protocols have been re-calibrated.` });
    } catch (err: any) {
      toast({ title: "Clearance Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingClearance(false);
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      // Create a temporary endpoint or use existing
      // For now, we'll implement a simple POST in the background
      await api.request('POST', `/projects/${id}/webhooks`, { url: webhookUrl });
      setIsWebhookOpen(false);
      setWebhookUrl('');
      toast({ title: "Webhook Configured", description: "Real-time security alerts are now active." });
    } catch (err: any) {
      toast({ title: "Configuration Failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingWebhook(false);
    }
  };

  const toggleReveal = (sid: string) => {
    setRevealed(prev => ({ ...prev, [sid]: !prev[sid] }));
  };

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    toast({ title: "Copied to Clipboard" });
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSaving(true);
    try {
      const lines = bulkText.split('\n');
      const parsedSecrets = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          let key = match[1].trim();
          let value = match[2].trim();
          
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          parsedSecrets.push({ key, value, can_view: bulkCanView });
        }
      }

      if (parsedSecrets.length === 0) {
        throw new Error("No valid KEY=VALUE pairs found.");
      }

      await api.bulkUpsertSecrets(id!, { environment: env, secrets: parsedSecrets });
      await loadData();
      setIsBulkOpen(false);
      setBulkText('');
      toast({ title: "Bulk Injection Complete", description: `Successfully injected ${parsedSecrets.length} secrets into ${env}.` });
    } catch (err: any) {
      toast({ title: "Bulk Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  };

  const filteredSecrets = secrets.filter(s => s.key.toLowerCase().includes(search.toLowerCase()));

  if (loading && !project) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary size-10" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Project Header Widget */}
      <div className="rounded-[2rem] border border-border/30 bg-card/30 p-6 shadow-xl shadow-primary/5 backdrop-blur-xl md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
              <Terminal className="size-3" />
              <span>Infrastructure Identifier</span>
            </div>
            <div className="space-y-3">
              <div className="font-mono text-sm text-muted-foreground">{project?.slug}</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{project?.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <KeyRound className="size-3" />
                <span>Project Key</span>
                <span className="font-mono text-[11px] lowercase tracking-normal text-primary/80">{project?.project_key}</span>
                <button
                  onClick={() => copyToClipboard(project?.project_key)}
                  className="rounded-full p-1 transition-colors hover:bg-primary/10 hover:text-foreground"
                >
                  <CopyIcon className="size-3" />
                </button>
              </div>
              <div className="rounded-full border border-border/40 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {projectMembers.length} collaborators
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 xl:max-w-4xl xl:items-end">
            <Tabs value={env} onValueChange={setEnv} className="w-full xl:w-auto">
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-border/40 bg-muted/30 p-1.5 backdrop-blur-xl xl:w-auto xl:min-w-[420px]">
                <TabsTrigger value="dev" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold text-[11px] uppercase tracking-[0.18em]">
                  Development
                </TabsTrigger>
                <TabsTrigger value="staging" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold text-[11px] uppercase tracking-[0.18em]">
                  Staging
                </TabsTrigger>
                <TabsTrigger value="prod" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold text-[11px] uppercase tracking-[0.18em]">
                  Production
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {user?.role === 'admin' && (
              <div className="flex flex-wrap gap-3 xl:justify-end">
                <Button onClick={() => setIsAddOpen(true)} className="h-11 rounded-xl px-5 font-bold shadow-lg shadow-primary/15 hover-elevate">
                  <PlusIcon className="mr-2 size-4" /> Add Secret
                </Button>
                <Button onClick={() => setIsBulkOpen(true)} variant="outline" className="h-11 rounded-xl px-5 font-bold border-border/40 bg-background/70 hover:bg-muted/70">
                  <FileUp className="mr-2 size-4" /> Bulk Import
                </Button>
                <Button onClick={() => setIsSyncOpen(true)} variant="secondary" className="h-11 rounded-xl px-5 font-bold border border-primary/15 bg-primary/5 text-primary hover:bg-primary/10">
                  <ArrowLeftRight className="mr-2 size-4" /> Sync Env
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto w-full justify-start gap-3 rounded-2xl border border-border/20 bg-muted/10 p-1.5">
          <TabsTrigger value="secrets" className="rounded-xl px-4 py-2.5 font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Secrets Nexus
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl px-4 py-2.5 font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-xl px-4 py-2.5 font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Team Members
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'secrets' ? (
        <>
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
                <FilterIcon className="size-6" />
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
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
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
                     <div className="flex items-center gap-3">
                        <div className="font-mono text-sm font-bold text-foreground bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 inline-block">
                           {secret.key}
                        </div>
                        {!secret.can_view && (
                          <button 
                            onClick={() => handleUpdateVisibility(secret, true)}
                            className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-amber-500/20 transition-colors"
                            title="Click to mark as Public"
                          >
                            <LockIcon size={10} /> Restricted
                          </button>
                        )}
                        {secret.can_view && (
                           <button 
                             onClick={() => handleUpdateVisibility(secret, false)}
                             className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                             title="Click to mark as Restricted"
                           >
                             <EyeIcon size={10} /> Public
                           </button>
                        )}
                      </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-2.5 rounded-xl border transition-all truncate max-w-sm ${revealed[secret.id] ? 'bg-background border-primary/20 text-foreground shadow-inner' : 'bg-muted/30 border-border/40 text-muted-foreground/40'}`}>
                           {revealed[secret.id] ? (secret.can_view ? secret.value : 'SECRET_RESTRICTED') : '••••••••••••••••••••••••••••••••'}
                        </div>
                        {secret.can_view && (
                           <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background" onClick={() => toggleReveal(secret.id)}>
                                 {revealed[secret.id] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background" onClick={(e) => { e.stopPropagation(); copyToClipboard(secret.value); }}>
                                 <CopyIcon size={16} />
                              </Button>
                           </div>
                        )}
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                     <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100" 
                          onClick={() => { setEditingSecret(secret); setIsEditOpen(true); }}
                        >
                           <Pencil size={18} />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100" onClick={() => handleDelete(secret.id)}>
                            <TrashIcon size={18} />
                         </Button>
                     </div>
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
                <PlusIcon size={32} />
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
              
              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">Dashboard Viewing Protocol</Label>
                    <p className="text-xs text-muted-foreground font-medium">If disabled, this key cannot be viewed in browser or exported to .env</p>
                  </div>
                  <Switch 
                    checked={newSecret.can_view}
                    onCheckedChange={(val) => setNewSecret(p => ({ ...p, can_view: val }))}
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

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <FileUp size={32} />
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">Bulk Secret Import</DialogTitle>
              <DialogDescription className="text-base">
                Paste your <span className="font-mono text-xs font-bold bg-muted/50 px-1.5 py-0.5 rounded">.env</span> file content below to inject multiple secrets into <span className="text-primary font-bold uppercase">{env}</span>.
              </DialogDescription>
            </DialogHeader>
            
            <form id="bulk-form" onSubmit={handleBulkImport} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="bulk-text" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Environment Protocol Data (.env format)</Label>
                <Textarea
                  id="bulk-text"
                  placeholder="DB_URL=postgres://...&#10;API_KEY=sk_test_...&#10;# This is a comment"
                  className="min-h-[250px] rounded-2xl bg-muted/30 border-border/40 px-5 py-4 focus:bg-background transition-all font-mono text-sm leading-relaxed"
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  required
                />
              </div>

               <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">Standard Visibility (Batch)</Label>
                    <p className="text-xs text-muted-foreground font-medium">Apply this protocol to all secrets in this import batch</p>
                  </div>
                  <Switch 
                    checked={bulkCanView}
                    onCheckedChange={setBulkCanView}
                  />
               </div>
            </form>
          </div>
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/10">
            <Button form="bulk-form" type="submit" disabled={bulkSaving} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover-elevate">
              {bulkSaving ? <Loader2 className="animate-spin" /> : `Import ${bulkText.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length} Detectable Keys`}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </>
      ) : activeTab === 'audit' ? (
        <div className="space-y-6">
           <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/40 shadow-2xl overflow-hidden p-10">
              <div className="flex justify-between items-end mb-10">
                <div>
                   <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <Terminal className="size-6 text-primary" /> Forensic Audit Trail
                   </h3>
                   <p className="text-muted-foreground mt-2">Real-time monitoring of all cryptographic actions and secret access.</p>
                </div>
                <div className="flex gap-3">
                   <Button variant="outline" onClick={() => setIsWebhookOpen(true)} className="rounded-xl border-border/40 font-bold bg-primary/5 text-primary border-primary/20">
                      <ShieldCheck className="size-4 mr-2" /> Webhooks
                   </Button>
                   <Button variant="outline" onClick={loadAuditLogs} disabled={auditLoading} className="rounded-xl border-border/40 font-bold">
                      {auditLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : <ArrowLeftRight className="size-4 mr-2 rotate-90" />} Refresh
                   </Button>
                </div>
              </div>

              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-10 top-0 bottom-0 w-px bg-border/20" />

                <div className="space-y-8 relative">
                   {auditLogs.length === 0 && !auditLoading && (
                     <div className="py-20 text-center opacity-30">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <p className="font-bold italic">No logs recorded for this infrastructure yet.</p>
                     </div>
                   )}
                   
                   {auditLogs.map((log) => (
                     <div key={log.id} className="flex gap-10 group">
                        <div className="relative z-10">
                           <div className={`h-20 w-20 rounded-3xl flex items-center justify-center border-2 transition-all ${
                             log.action === 'secret_read' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 scale-110' :
                             log.action.includes('write') ? 'bg-primary/10 border-primary/20 text-primary' :
                             'bg-muted/10 border-border/20 text-muted-foreground'
                           }`}>
                              {log.action === 'secret_read' ? <EyeIcon size={32} /> : 
                               log.action.includes('write') ? <ShieldCheck size={32} /> :
                               <Terminal size={32} />}
                           </div>
                        </div>
                        <div className="flex-1 pb-8 border-b border-border/10">
                           <div className="flex justify-between items-start">
                              <div>
                                 <div className="flex items-center gap-3">
                                    <h4 className="font-black text-lg uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</h4>
                                    {log.action === 'secret_read' && (
                                      <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-amber-500/20">RESTRICTED ACCESS</span>
                                    )}
                                 </div>
                                 <p className="text-muted-foreground text-sm mt-1">
                                    Action performed by <span className="text-foreground font-bold">{log.actor_name || 'System Operator'}</span>
                                    <span className="mx-2 text-border">|</span>
                                    <span className="font-mono text-xs">{log.actor_email}</span>
                                 </p>
                              </div>
                              <div className="text-right">
                                 <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    {new Date(log.created_at).toLocaleDateString()}
                                 </div>
                                 <div className="text-[10px] text-primary font-mono mt-1">
                                    {new Date(log.created_at).toLocaleTimeString()}
                                 </div>
                              </div>
                           </div>
                           {log.metadata && (
                             <div className="mt-4 p-4 rounded-2xl bg-muted/20 border border-border/10 font-mono text-[10px] text-muted-foreground/80 grid grid-cols-2 gap-4">
                                <div>
                                   <span className="opacity-40 uppercase block mb-1">Resource Context</span>
                                   {log.metadata.details || log.metadata.key || "System Level"}
                                </div>
                                <div>
                                   <span className="opacity-40 uppercase block mb-1">Injected Env</span>
                                   <span className="text-primary font-bold">{log.metadata.env || "dev"}</span>
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
           </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2.25rem] border-border/30 bg-card/40 p-6 shadow-2xl backdrop-blur-3xl md:p-8">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Active Collaborators</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Environment-level access is organized by collaborator, with quick clearance edits for each member.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-border/30 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {projectMembers.length} members
                  </div>
                  <div className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    {env.toUpperCase()} focus
                  </div>
                </div>
              </div>
              <Button onClick={() => setIsAddMemberOpen(true)} className="h-11 rounded-xl px-5 font-bold shadow-lg shadow-primary/15 hover-elevate">
                <PlusIcon className="mr-2 size-4" /> Add Project Member
              </Button>
            </div>

            <div className="space-y-3">
              {projectMembers.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-border/30 bg-muted/10 px-6 py-16 text-center">
                  <Users className="mx-auto mb-4 size-10 text-muted-foreground/40" />
                  <p className="text-lg font-bold">No collaborators added yet.</p>
                  <p className="mt-2 text-sm text-muted-foreground">Invite a member to start managing project-level access.</p>
                </div>
              ) : (
                projectMembers.map(m => (
                  <div
                    key={m.id}
                    className="rounded-[1.75rem] border border-border/20 bg-background/60 p-5 transition-colors hover:border-primary/20 hover:bg-primary/[0.03] md:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">
                          {m.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold">{m.name}</div>
                          <div className="truncate text-sm text-muted-foreground">{m.email}</div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 lg:max-w-xl">
                        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          Clearance Levels
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['dev', 'staging', 'prod'].map(level => (
                            <div
                              key={level}
                              className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${
                                m.environments?.includes(level)
                                  ? 'border-primary/30 bg-primary/10 text-primary'
                                  : 'border-border/20 bg-muted/15 text-muted-foreground/45'
                              }`}
                            >
                              {level}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end lg:self-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl border border-border/20 bg-background/70 hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit Security Clearance"
                          onClick={() => {
                            setClearanceMember(m);
                            setClearanceEnvs(m.environments || []);
                            setIsClearanceOpen(true);
                          }}
                        >
                          <Settings2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl border border-border/20 bg-background/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Revoke All Access"
                          onClick={() => handleRemoveProjectMember(m.id)}
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

           <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
             <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
               <div className="p-8">
                 <DialogHeader className="mb-8">
                   <DialogTitle className="text-3xl font-black tracking-tight">Access Provisioning</DialogTitle>
                   <DialogDescription>
                     Invite an organization member to this cryptographic project nexus.
                   </DialogDescription>
                 </DialogHeader>

                 <div className="space-y-6">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Select Member from Org</Label>
                    <div className="rounded-2xl border border-border/30 overflow-y-auto max-h-[300px] bg-muted/10 scrollbar-none">
                      {orgMembers.filter(u => !projectMembers.find(m => m.id === u.id)).map(u => (
                        <button 
                          key={u.id} 
                          onClick={() => handleAddProjectMember(u.id, ['dev'])}
                          className="w-full flex items-center justify-between p-4 border-b border-border/10 last:border-0 hover:bg-primary/5 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted/40 text-muted-foreground flex items-center justify-center text-xs font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium group-hover:font-bold transition-all">{u.name}</div>
                              <div className="text-[10px] text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                           <PlusIcon className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                      {orgMembers.filter(u => !projectMembers.find(m => m.id === u.id)).length === 0 && (
                        <div className="p-10 text-center opacity-40 italic text-sm">No remaining org members to invite.</div>
                      )}
                    </div>
                 </div>
               </div>
               <DialogFooter className="p-8 pt-0">
                  <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="w-full h-12 rounded-xl font-bold">Cancel Provisioning</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
        </div>
      )}
      <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ArrowLeftRight size={32} />
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">Sync Environments</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Clone all secrets from one environment cluster to another. This will **overwrite** duplicates.
              </DialogDescription>
            </DialogHeader>
            
            <form id="sync-form" onSubmit={handleSync} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Source Cluster</Label>
                  <select 
                    className="w-full h-12 rounded-xl bg-muted/30 border border-border/40 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={syncForm.from}
                    onChange={e => setSyncForm(p => ({ ...p, from: e.target.value }))}
                  >
                    <option value="dev">dev</option>
                    <option value="staging">staging</option>
                    <option value="prod">prod</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Target Cluster</Label>
                  <select 
                    className="w-full h-12 rounded-xl bg-muted/30 border border-border/40 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={syncForm.to}
                    onChange={e => setSyncForm(p => ({ ...p, to: e.target.value }))}
                  >
                    <option value="dev">dev</option>
                    <option value="staging">staging</option>
                    <option value="prod">prod</option>
                  </select>
                </div>
              </div>

               <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                   <ShieldCheck className="text-amber-500 size-6 shrink-0" />
                   <p className="text-xs text-amber-500/80 font-medium font-mono leading-relaxed lowercase">
                     Warning: This protocol will replicate all encrypted payloads from <span className="font-bold underline">{syncForm.from}</span> into <span className="font-bold underline">{syncForm.to}</span>. Existing keys in target will be updated.
                   </p>
               </div>
            </form>
          </div>
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/10">
            <Button form="sync-form" type="submit" disabled={syncLoading} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover-elevate">
              {syncLoading ? <Loader2 className="animate-spin" /> : `Promote Secrets to ${syncForm.to.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-8">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Pencil size={32} />
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">Modify Secret Protocol</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Updating <span className="text-primary font-black font-mono">{(editingSecret as any)?.key}</span> in the <span className="uppercase font-bold">{env}</span> cluster.
              </DialogDescription>
            </DialogHeader>
            
            <form id="edit-form" onSubmit={handleEdit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Variable Value</Label>
                <Input
                  type="password"
                  placeholder="Enter new value..."
                  className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono"
                  value={editingSecret?.value || ''}
                  onChange={e => setEditingSecret((p: any) => ({ ...p, value: e.target.value }))}
                  required
                />
              </div>
              
              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">Dashboard Viewing Protocol</Label>
                    <p className="text-xs text-muted-foreground font-medium">Toggle visibility of this key in the nexus UI.</p>
                  </div>
                  <Switch 
                    checked={editingSecret?.can_view}
                    onCheckedChange={(val) => setEditingSecret((p: any) => ({ ...p, can_view: val }))}
                  />
               </div>
            </form>
          </div>
          
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/10">
            <Button form="edit-form" type="submit" disabled={saving} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover-elevate">
              {saving ? <Loader2 className="animate-spin" /> : "Commit Modification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearanceOpen} onOpenChange={setIsClearanceOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-8">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight">Security Clearance</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Revoke or grant cluster access for <span className="text-primary font-bold">{clearanceMember?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <form id="clearance-form" onSubmit={handleUpdateClearance} className="space-y-6">
              <div className="space-y-4">
                 {['dev', 'staging', 'prod'].map(cluster => (
                  <div 
                    key={cluster} 
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                      clearanceEnvs.includes(cluster) ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-muted/10 border-border/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-[10px] uppercase ${
                         clearanceEnvs.includes(cluster) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                       }`}>
                          {cluster.charAt(0)}
                       </div>
                       <div>
                          <div className="font-bold text-sm uppercase tracking-wider">{cluster} Cluster</div>
                          <div className="text-[10px] text-muted-foreground italic">Full cryptographic injection access</div>
                       </div>
                    </div>
                    <Switch 
                      checked={clearanceEnvs.includes(cluster)} 
                      onCheckedChange={(val) => {
                        if (val) setClearanceEnvs((p: string[]) => Array.from(new Set([...p, cluster])));
                        else setClearanceEnvs((p: string[]) => p.filter(e => e !== cluster));
                      }} 
                    />
                  </div>
                ))}
              </div>

               <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-500">
                   <AlertCircle className="size-5 shrink-0" />
                   <p className="text-[10px] font-bold leading-relaxed lowercase italic">
                     Caution: Revoking access will immediately disconnect this user from the specified cluster secrets via both CLI and Dashboard.
                   </p>
               </div>
            </form>
          </div>
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/10">
            <Button form="clearance-form" type="submit" disabled={updatingClearance} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover-elevate">
              {updatingClearance ? <Loader2 className="animate-spin" /> : "Authorize Clearance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       <Dialog open={isWebhookOpen} onOpenChange={setIsWebhookOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-10 pb-6">
            <DialogHeader className="mb-8">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">Security Webhooks</DialogTitle>
              <DialogDescription className="text-base">
                Configure a Slack or Discord webhook to receive real-time alerts when **Restricted Secrets** are accessed.
              </DialogDescription>
            </DialogHeader>
            
            <form id="webhook-form" onSubmit={handleAddWebhook} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="w-url" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Webhook URL</Label>
                <Input
                  id="w-url"
                  placeholder="https://hooks.slack.com/services/..."
                  className="h-14 rounded-2xl bg-muted/30 border-border/40 px-5 focus:bg-background transition-all font-mono"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                />
              </div>
              
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <AlertCircle size={12} /> Privacy Notice
                 </p>
                 <p className="text-[11px] text-amber-500/80 leading-relaxed">
                    Synkrypt will only send metadata (Actor, Environment, Secret Key). The actual decrypted value is **never** sent via webhook.
                 </p>
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-10 pt-6 bg-muted/10 border-t border-border/10">
            <Button form="webhook-form" type="submit" disabled={savingWebhook} className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover-elevate">
              {savingWebhook ? <Loader2 className="animate-spin" /> : "Deploy Security Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
