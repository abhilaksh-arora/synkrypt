import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { 
  KeyRound, Plus as PlusIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Copy as CopyIcon, Trash2 as TrashIcon, 
  Loader2, ShieldCheck, Terminal, Search as SearchIcon, Users,
  Settings2, FileText, ShieldQuestion, User as UserIcon,
  Globe, Download, Clock, Activity, History, ArrowRightLeft, ArrowRight, UserPlus, Calendar,
  FileUp, ShieldAlert, XCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [accessPresets, setAccessPresets] = useState<any[]>([]);
  
  const [newSecret, setNewSecret] = useState({ key: '', value: '', environment: 'dev', can_view: true, isPersonal: false, type: 'env' });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  
  const [isClearanceOpen, setIsClearanceOpen] = useState(false);
  const [clearanceMember, setClearanceMember] = useState<any>(null);
  const [clearanceEnvs, setClearanceEnvs] = useState<string[]>([]);
  const [clearancePreset, setClearancePreset] = useState('');
  const [clearanceTTL, setClearanceTTL] = useState('');
  const [updatingClearance, setUpdatingClearance] = useState(false);

  // Advanced feature states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkCanView, setBulkCanView] = useState(true);
  
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncForm, setSyncForm] = useState({ from: 'dev', to: 'staging' });

  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', github_repo: '' });

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
      setSettingsForm({ name: pData.project.name, description: pData.project.description || '', github_repo: pData.project.github_repo || '' });
      setProjectMembers(pData.members || []);
      const sData = await api.listSecrets(id!, env) as any;
      setSecrets(sData.secrets);

      if (user?.role === 'admin') {
        const uData = await api.listUsers();
        setOrgMembers(uData.users || []);
        const preData = await api.listPresets();
        setAccessPresets(preData.presets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await api.request('GET', `/audit-logs?projectId=${id}&limit=50`);
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
  }, [activeTab, id]);

  const handleAddProjectMember = async (userId: string, environments: string[], presetName?: string, expiresAt?: string | null) => {
    try {
      await api.addProjectMember(id!, { userId, environments, presetName, expiresAt });
      await loadData();
      toast({ title: "Member Added" });
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
      setNewSecret({ key: '', value: '', environment: 'dev', can_view: true, isPersonal: false, type: 'env' });
      toast({ title: "Secret Saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVisibility = async (secretId: string, canView: boolean) => {
    try {
      await api.updateSecretVisibility(id!, secretId, canView);
      await loadData();
      toast({ title: "Visibility Updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSaving(true);
    try {
      const lines = bulkText.split('\n');
      const parsed = lines.map(l => {
        const match = l.trim().match(/^([^=]+)=(.*)$/);
        if (match) {
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          return { key: match[1].trim(), value: val, can_view: bulkCanView };
        }
        return null;
      }).filter(Boolean);

      if (!parsed.length) throw new Error("No valid KEY=VALUE pairs found.");
      
      await api.bulkUpsertSecrets(id!, { environment: env, secrets: parsed });
      await loadData();
      setIsBulkOpen(false);
      setBulkText('');
      toast({ title: "Bulk Import Successful" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncLoading(true);
    try {
      await api.request('POST', `/projects/${id}/secrets/sync`, { fromEnv: syncForm.from, toEnv: syncForm.to });
      await loadData();
      setIsSyncOpen(false);
      toast({ title: "Sync Complete" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProject(id!, settingsForm);
      await loadData();
      setIsSettingsOpen(false);
      toast({ title: "Project Updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('DELETE PROJECT: This will purge all secrets and members. This cannot be undone.')) return;
    try {
      await api.deleteProject(id!);
      navigate('/');
      toast({ title: "Project Deleted" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      await api.request('POST', `/projects/${id}/webhooks`, { url: webhookUrl });
      setIsWebhookOpen(false);
      setWebhookUrl('');
      toast({ title: "Webhook Configured" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleDelete = async (sid: string) => {
    if (!confirm('Delete this secret?')) return;
    try {
      await api.deleteSecret(id!, sid);
      await loadData();
      toast({ title: "Secret Deleted" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingClearance(true);
    try {
      await api.addProjectMember(id!, { userId: clearanceMember.id, environments: clearanceEnvs, presetName: clearancePreset, expiresAt: clearanceTTL || null });
      await loadData();
      setIsClearanceOpen(false);
      toast({ title: "Access Updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingClearance(false);
    }
  };

  const downloadAsset = (secret: any) => {
    const blob = new Blob([secret.value], { type: secret.metadata?.mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = secret.metadata?.filename || secret.key;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="space-y-8 pb-20">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary/80">
              <Terminal className="size-3.5" />
              <span>Project Overview</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{project?.name}</h2>
                 <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-full h-8 w-8 hover:bg-muted opacity-40 hover:opacity-100">
                    <Settings2 size={16} />
                 </Button>
              </div>
              <p className="text-muted-foreground text-base max-w-xl leading-relaxed italic">
                 {project?.description || "No description provided."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                <KeyRound className="size-4" />
                <span>Project Key</span>
                <span className="font-mono text-xs lowercase tracking-normal text-primary/80 ml-2">{project?.project_key}</span>
                <button onClick={() => copyToClipboard(project?.project_key)} className="rounded-full p-1.5 transition-colors hover:bg-primary/10">
                  <CopyIcon className="size-3.5" />
                </button>
              </div>
              <div className="rounded-xl border border-border bg-background/70 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                {projectMembers.length} team members
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 xl:max-w-4xl xl:items-end">
            <Tabs value={env} onValueChange={setEnv} className="w-full xl:w-auto">
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-border bg-muted/30 p-1 xl:w-auto xl:min-w-[320px]">
                <TabsTrigger value="dev" className="rounded-lg px-4 py-2 font-bold text-[10px] uppercase tracking-widest">Dev</TabsTrigger>
                <TabsTrigger value="staging" className="rounded-lg px-4 py-2 font-bold text-[10px] uppercase tracking-widest">Staging</TabsTrigger>
                <TabsTrigger value="prod" className="rounded-lg px-4 py-2 font-bold text-[10px] uppercase tracking-widest">Prod</TabsTrigger>
              </TabsList>
            </Tabs>
            {user?.role === 'admin' && (
              <div className="flex flex-wrap gap-3 xl:justify-end">
                <Button onClick={() => setIsAddOpen(true)} className="h-9 rounded-lg px-4 font-bold shadow-sm group text-sm">
                  <PlusIcon className="mr-1.5 size-4 group-hover:rotate-90 transition-transform" /> Add Secret
                </Button>
                <Button onClick={() => setIsBulkOpen(true)} variant="outline" className="h-9 rounded-lg px-4 font-bold text-sm">
                  <FileUp className="mr-1.5 size-4" /> Bulk Import
                </Button>
                <Button onClick={() => setIsSyncOpen(true)} variant="outline" className="h-9 rounded-lg px-4 font-bold text-sm">
                  <ArrowRightLeft className="mr-1.5 size-4" /> Sync Env
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto justify-start gap-2 rounded-xl border border-border bg-muted/10 p-1">
          <TabsTrigger value="secrets" className="rounded-lg px-4 py-2 font-bold text-[11px] uppercase tracking-widest">Secrets</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg px-4 py-2 font-bold text-[11px] uppercase tracking-widest">Audit Logs</TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg px-4 py-2 font-bold text-[11px] uppercase tracking-widest">Team</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'secrets' ? (
        <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-5 rounded-xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Secrets</p>
               <h4 className="text-2xl font-bold tracking-tight">{secrets.length}</h4>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
               <ShieldCheck className="size-5" />
            </div>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Project Wide</p>
               <h4 className="text-2xl font-bold tracking-tight">{secrets.filter(s => !s.is_personal).length}</h4>
            </div>
             <div className="h-10 w-10 rounded-xl bg-blue-500/5 text-blue-500 flex items-center justify-center">
                <Globe className="size-5" />
             </div>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">My Personal</p>
               <h4 className="text-2xl font-bold tracking-tight">{secrets.filter(s => s.is_personal).length}</h4>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/5 text-amber-500 flex items-center justify-center">
               <UserIcon className="size-5" />
            </div>
         </Card>
      </div>

      <Card className="rounded-xl bg-card border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex flex-col md:flex-row justify-between items-center gap-3 bg-muted/5">
           <div className="relative w-full md:max-w-md group">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input 
                 placeholder="Search secrets..." 
                 className="pl-9 h-9 rounded-lg bg-background border-border text-sm"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[30%] py-6 pl-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Variable Name</TableHead>
                <TableHead className="w-[40%] text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Value</TableHead>
                <TableHead className="w-[15%] text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Show in UI</TableHead>
                <TableHead className="w-[15%] text-right pr-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i} className="border-border animate-pulse">
                    <TableCell className="pl-12 py-8"><div className="h-10 w-48 bg-muted/40 rounded-xl" /></TableCell>
                    <TableCell><div className="h-10 w-80 bg-muted/40 rounded-xl" /></TableCell>
                    <TableCell><div className="h-6 w-12 bg-muted/40 rounded-full" /></TableCell>
                    <TableCell className="pr-12 text-right"><div className="h-10 w-10 bg-muted/40 rounded-xl ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSecrets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-80 text-center">
                     <div className="flex flex-col items-center justify-center opacity-30">
                        <ShieldQuestion size={64} className="mb-6 text-primary" />
                        <p className="font-bold text-2xl tracking-tight italic">No secrets found.</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : filteredSecrets.map(secret => (
                <TableRow key={secret.id} className="border-border group hover:bg-primary/[0.01]">
                  <TableCell className="pl-6 py-3">
                     <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                           <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                              secret.type === 'file' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-primary/5 text-primary border-primary/20'
                           }`}>
                              {secret.type === 'file' ? <FileText size={16} /> : <KeyRound size={16} />}
                           </div>
                           <div className="font-mono text-sm font-bold text-foreground bg-background px-3 py-1.5 rounded-lg border border-border inline-block shadow-inner transition-all">
                              {secret.key}
                           </div>
                           {secret.is_personal && (
                              <TooltipProvider>
                                 <Tooltip>
                                    <TooltipTrigger>
                                       <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 p-1.5 rounded-lg">
                                          <UserIcon size={12} />
                                       </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-lg border-border font-bold text-[10px]">Personal Variable</TooltipContent>
                                 </Tooltip>
                              </TooltipProvider>
                           )}
                        </div>
                        {secret.type === 'file' && (
                           <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1.5 flex items-center gap-1.5">
                              <ShieldCheck size={10} className="text-emerald-500" />
                              {secret.metadata?.filename} 
                           </div>
                        )}
                      </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-lg border transition-all truncate max-w-sm font-bold shadow-inner ${revealed[secret.id] ? 'bg-background border-primary/30 text-foreground' : 'bg-muted/30 border-border text-muted-foreground/20'}`}>
                           {revealed[secret.id] ? (secret.can_view ? (secret.type === 'file' ? '•••• ENCRYPTED ••••' : secret.value) : 'RESTRICTED') : '••••••••••••••••••••••••'}
                        </div>
                        {secret.can_view && (
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-transparent hover:border-border shadow-sm" onClick={() => toggleReveal(secret.id)}>
                                 {revealed[secret.id] ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                              </Button>
                              {secret.type === 'file' ? (
                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-transparent hover:border-border shadow-sm" onClick={() => downloadAsset(secret)}>
                                    <Download size={14} />
                                 </Button>
                              ) : (
                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-transparent hover:border-border shadow-sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(secret.value); }}>
                                    <CopyIcon size={14} />
                                 </Button>
                              )}
                           </div>
                        )}
                     </div>
                  </TableCell>
                  <TableCell>
                     <Switch 
                        checked={secret.can_view} 
                        onCheckedChange={(val) => handleUpdateVisibility(secret.id, val)}
                        className="data-[state=checked]:bg-emerald-500"
                     />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                     <div className="flex justify-end gap-1.5">
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100" onClick={() => handleDelete(secret.id)}>
                            <TrashIcon size={16} />
                         </Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      </>
      ) : activeTab === 'audit' ? (
        <div className="space-y-6">
           <Card className="rounded-xl bg-card border-border shadow-sm overflow-hidden p-6 relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div className="space-y-2">
                   <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                      <History className="size-5" />
                   </div>
                   <h3 className="text-2xl font-bold tracking-tight">Audit Logs</h3>
                   <p className="text-muted-foreground text-sm italic max-w-xl">Activity log for configuration changes and access events.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                   <Button variant="outline" onClick={() => navigate('/audit-logs', { state: { projectId: id } })} className="rounded-lg h-9 px-4 border-border bg-background hover:bg-muted/80 font-bold transition-all group text-xs">
                      Full Dashboard <ArrowRightLeft className="size-3.5 ml-2 group-hover:rotate-90 transition-transform" />
                   </Button>
                   <Button variant="outline" onClick={loadAuditLogs} disabled={auditLoading} className="rounded-lg h-9 px-4 border-border bg-background hover:bg-muted/80 font-bold transition-all text-xs">
                      {auditLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Activity className="size-4 mr-2" />} Refresh
                   </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-10 top-0 bottom-0 w-px bg-border rounded-full" />
                <div className="space-y-8 relative">
                   {auditLogs.map((log) => (
                     <div key={log.id} className="flex gap-6 group">
                        <div className="relative z-10 pt-1">
                           <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all shadow-sm ${
                             log.action === 'secret_read' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                             log.action.includes('write') ? 'bg-primary/10 border-primary/30 text-primary' :
                             'bg-muted/20 border-border text-muted-foreground'
                           }`}>
                              {log.action === 'secret_read' ? <EyeIcon size={20} /> : 
                               log.action.includes('write') ? <ShieldCheck size={20} /> :
                               <Terminal size={20} />}
                           </div>
                        </div>
                        <div className="flex-1 pb-6 border-b border-border last:border-0">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                 <h4 className="font-bold text-base uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</h4>
                                 <div className="flex items-center gap-2 text-muted-foreground font-medium mt-1">
                                    <span className="text-foreground font-bold text-xs">{log.actor_name || 'System'}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xs font-bold text-foreground">
                                    {new Date(log.created_at).toLocaleDateString()}
                                 </div>
                                 <div className="text-[10px] text-primary font-mono font-bold">{new Date(log.created_at).toLocaleTimeString()}</div>
                              </div>
                           </div>
                           {log.metadata && (
                              <div className="mt-4 p-4 rounded-xl bg-muted/5 border border-border grid grid-cols-1 md:grid-cols-2 gap-4 shadow-inner">
                                 <div className="space-y-1">
                                    <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest block">Variable</span>
                                    <div className="text-foreground font-bold text-xs bg-background p-2 rounded-lg border border-border inline-block min-w-[150px] font-mono">
                                       {log.metadata.key || "General Config"}
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest block">Env</span>
                                    <Badge variant="outline" className="text-primary font-bold text-[10px] px-3 py-1 rounded-lg border-primary/20 bg-primary/5 uppercase">
                                       {log.metadata.env || "dev"}
                                    </Badge>
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
          <Card className="overflow-hidden rounded-xl border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Team Members</h3>
                </div>
              </div>
              <Button onClick={() => setIsAddMemberOpen(true)} className="h-9 rounded-lg px-4 font-bold text-sm shadow-sm group">
                <PlusIcon className="mr-1.5 size-4 group-hover:rotate-90 transition-transform" /> Add Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectMembers.map(m => {
                const isExpired = m.expires_at && new Date(m.expires_at) < new Date();
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-5 transition-all hover:shadow-sm relative overflow-hidden ${
                      isExpired ? 'border-destructive/20 bg-destructive/[0.02] opacity-60' : 'border-border bg-background/60 hover:border-primary/20'
                    }`}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-base text-primary border border-primary/10 shadow-sm">
                            {m.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold tracking-tight text-foreground">{m.name}</div>
                            <div className="truncate text-[10px] font-mono text-muted-foreground/60 italic mt-0.5">{m.email}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                           <Badge className={`rounded-md px-2 py-0.5 font-bold text-[8px] uppercase tracking-widest ${m.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                              {m.role}
                           </Badge>
                           {m.preset_name && (
                              <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                 <ShieldCheck size={9} /> {m.preset_name}
                              </div>
                           )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                             Access Matrix
                           </div>
                           {m.expires_at && (
                              <TooltipProvider>
                                 <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-tighter bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                       <Clock size={9} /> 
                                       {isExpired ? 'EXPIRED' : `TTL: ${new Date(m.expires_at).toLocaleDateString()}`}
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold text-[10px]">Auto-revocation active.</TooltipContent>
                                 </Tooltip>
                              </TooltipProvider>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {['dev', 'staging', 'prod'].map(level => (
                            <div
                              key={level}
                              className={`rounded-lg border px-3 py-1 text-[9px] font-bold uppercase tracking-widest transition-all ${
                                m.environments?.includes(level)
                                  ? 'border-primary/30 bg-primary/10 text-primary'
                                  : 'border-border/10 bg-muted/5 text-muted-foreground/30 opacity-60'
                              }`}
                            >
                              {level}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex gap-1.5">
                           <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-primary/5 hover:text-primary transition-all"
                              onClick={() => {
                                setClearanceMember(m);
                                setClearanceEnvs(m.environments || []);
                                setClearancePreset(m.preset_name || '');
                                setClearanceTTL(m.expires_at ? new Date(m.expires_at).toISOString().split('T')[0] : '');
                                setIsClearanceOpen(true);
                              }}
                            >
                              <Settings2 size={14} />
                           </Button>
                           <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-destructive/5 hover:text-destructive transition-all"
                              onClick={() => handleRemoveProjectMember(m.id)}
                            >
                              <TrashIcon size={14} />
                           </Button>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Advanced Feature Dialogs */}
      
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl p-0 border-border overflow-hidden shadow-2xl bg-card">
          <div className="p-12 pb-8">
            <DialogHeader className="mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-sm">
                <FileUp size={36} />
              </div>
              <DialogTitle className="text-4xl font-bold tracking-tighter leading-tight">Bulk Import</DialogTitle>
              <DialogDescription className="text-lg font-medium text-muted-foreground mt-2 italic">
                Paste an entire <span className="font-mono text-xs font-bold bg-muted/80 px-2 py-1 rounded">.env</span> file into the <span className="text-primary font-bold uppercase">{env}</span> environment.
              </DialogDescription>
            </DialogHeader>
            <form id="bulk-form" onSubmit={handleBulkImport} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="bulk-text" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1.5">Environment Data (KEY=VALUE)</Label>
                <Textarea id="bulk-text" placeholder="DB_URL=postgres://...&#10;API_KEY=sk_test_..." className="min-h-[300px] rounded-2xl bg-muted/30 border-border px-6 py-6 focus:bg-background font-mono text-base" value={bulkText} onChange={e => setBulkText(e.target.value)} required />
              </div>
               <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border border-border">
                  <Label className="text-base font-bold">Apply "Show in UI" to all keys</Label>
                  <Switch checked={bulkCanView} onCheckedChange={setBulkCanView} />
               </div>
            </form>
          </div>
          <DialogFooter className="p-12 pt-8 bg-muted/10 border-t border-border/10">
            <Button form="bulk-form" type="submit" disabled={bulkSaving} className="w-full h-20 rounded-2xl text-2xl font-bold shadow-md">
              {bulkSaving ? <Loader2 className="animate-spin" /> : `Import Variables`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 border-border overflow-hidden shadow-2xl bg-card">
          <div className="p-12 pb-8">
            <DialogHeader className="mb-10">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-sm">
                <ArrowRightLeft size={36} />
              </div>
              <DialogTitle className="text-4xl font-bold tracking-tighter leading-tight">Sync Environments</DialogTitle>
              <DialogDescription className="text-lg font-medium text-muted-foreground mt-2 italic">
                Copy all shared variables from one environment to another.
              </DialogDescription>
            </DialogHeader>
            <form id="sync-form" onSubmit={handleSync} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1.5">Source</Label>
                  <select className="w-full h-14 rounded-xl bg-muted/30 border border-border px-6 font-bold text-sm outline-none" value={syncForm.from} onChange={e => setSyncForm(p => ({ ...p, from: e.target.value }))}>
                    <option value="dev">Development</option><option value="staging">Staging</option><option value="prod">Production</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1.5">Target</Label>
                  <select className="w-full h-14 rounded-xl bg-muted/30 border border-border px-6 font-bold text-sm outline-none" value={syncForm.to} onChange={e => setSyncForm(p => ({ ...p, to: e.target.value }))}>
                    <option value="dev">Development</option><option value="staging">Staging</option><option value="prod">Production</option>
                  </select>
                </div>
              </div>
               <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                   <ShieldAlert className="text-amber-500 size-6 shrink-0 mt-1" />
                   <p className="text-xs text-amber-600 font-bold leading-relaxed uppercase tracking-tight italic">
                     This will overwrite variables with the same name in the target environment.
                   </p>
               </div>
            </form>
          </div>
          <DialogFooter className="p-12 pt-8 bg-muted/10 border-t border-border/10">
            <Button form="sync-form" type="submit" disabled={syncLoading} className="w-full h-20 rounded-2xl text-2xl font-bold shadow-md">
              {syncLoading ? <Loader2 className="animate-spin" /> : "Start Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <Settings2 size={20} />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Project Settings</DialogTitle>
            </DialogHeader>
            <form id="settings-form" onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Project Name</Label>
                <Input className="h-9 rounded-lg bg-muted/30 border-border px-4 font-bold text-sm" value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Input className="h-9 rounded-lg bg-muted/30 border-border px-4 text-sm" value={settingsForm.description} onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })} />
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2"><Activity size={12} /> Security Webhooks</h4>
                 <Button type="button" variant="outline" className="w-full rounded-lg border-primary/20 bg-background text-primary font-bold h-9 text-xs" onClick={() => { setIsSettingsOpen(false); setIsWebhookOpen(true); }}>
                    Configure Webhooks
                 </Button>
              </div>

              <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 shadow-inner">
                  <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-1"><XCircle size={14} /> Danger Zone</h4>
                  <p className="text-[10px] text-destructive/70 mb-4 font-medium italic">Purge secrets and members.</p>
                  <Button type="button" variant="destructive" className="w-full h-9 rounded-lg font-bold text-xs" onClick={handleDeleteProject}>Delete Project</Button>
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 bg-muted/5 border-t border-border/10">
            <Button form="settings-form" type="submit" className="w-full h-10 rounded-lg text-sm font-bold shadow-sm">Update Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWebhookOpen} onOpenChange={setIsWebhookOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <ShieldAlert size={20} />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Security Webhooks</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Receive real-time alerts for secret access events.
              </DialogDescription>
            </DialogHeader>
            <form id="webhook-form" onSubmit={handleAddWebhook} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="w-url" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Webhook URL</Label>
                <Input id="w-url" placeholder="https://hooks.slack.com/..." className="h-9 rounded-lg bg-muted/30 border-border px-4 font-mono text-xs" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} required />
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 bg-muted/5 border-t border-border/10">
            <Button form="webhook-form" type="submit" disabled={savingWebhook} className="w-full h-10 rounded-lg text-sm font-bold shadow-sm">
              {savingWebhook ? <Loader2 className="animate-spin size-4" /> : "Save Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <PlusIcon size={20} />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Add Secret</DialogTitle>
            </DialogHeader>
            <form id="secret-form" onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="s-key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Variable Name</Label>
                <Input id="s-key" className="h-9 rounded-lg bg-muted/30 border-border px-4 focus:bg-background font-mono font-bold text-sm uppercase" value={newSecret.key} onChange={e => setNewSecret(p => ({ ...p, key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_') }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-val" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Value</Label>
                <Input id="s-val" type="password" className="h-9 rounded-lg bg-muted/30 border-border px-4 focus:bg-background font-mono text-sm" value={newSecret.value} onChange={e => setNewSecret(p => ({ ...p, value: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                 <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border" onClick={() => setNewSecret(p => ({ ...p, can_view: !p.can_view }))}>
                    <Label className="text-sm font-bold tracking-tight">Show in Browser</Label>
                    <Switch checked={newSecret.can_view} onCheckedChange={(val) => setNewSecret(p => ({ ...p, can_view: val }))} />
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20" onClick={() => setNewSecret(p => ({ ...p, isPersonal: !p.isPersonal }))}>
                    <Label className="text-sm font-bold tracking-tight text-amber-600">Personal Only</Label>
                    <Switch checked={newSecret.isPersonal} onCheckedChange={(val) => setNewSecret(p => ({ ...p, isPersonal: val }))} />
                 </div>
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 bg-muted/5 border-t border-border/10">
            <Button form="secret-form" type="submit" disabled={saving} className="w-full h-10 rounded-lg text-sm font-bold shadow-sm">
              {saving ? <Loader2 className="animate-spin size-4" /> : "Create Secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearanceOpen} onOpenChange={setIsClearanceOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Edit Access Matrix</DialogTitle>
            </DialogHeader>
            <form id="clearance-form" onSubmit={handleUpdateClearance} className="space-y-5">
              <div className="space-y-3">
                 {['dev', 'staging', 'prod'].map(cluster => (
                  <div key={cluster} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group shadow-sm ${clearanceEnvs.includes(cluster) ? 'bg-primary/[0.03] border-primary/20' : 'bg-muted/5 border-border opacity-60 hover:opacity-100'}`} onClick={() => { if (clearanceEnvs.includes(cluster)) setClearanceEnvs(p => p.filter(e => e !== cluster)); else setClearanceEnvs(p => [...p, cluster]); }}>
                    <div className="flex items-center gap-4">
                       <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase transition-all ${clearanceEnvs.includes(cluster) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}>{cluster.charAt(0)}</div>
                       <div className="font-bold text-sm uppercase tracking-widest">{cluster} Environment</div>
                    </div>
                    <Switch checked={clearanceEnvs.includes(cluster)} onCheckedChange={() => {}} />
                  </div>
                ))}
              </div>
               <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Access Expiration (TTL)</Label>
                  <Input type="date" className="h-9 rounded-lg bg-muted/10 border-border font-mono text-xs" value={clearanceTTL} onChange={e => setClearanceTTL(e.target.value)} />
               </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 bg-muted/5 border-t border-border/10">
            <Button form="clearance-form" type="submit" disabled={updatingClearance} className="w-full h-10 rounded-lg text-sm font-bold shadow-sm">{updatingClearance ? <Loader2 className="animate-spin size-4" /> : "Apply Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl p-0 border-border overflow-hidden shadow-2xl bg-card">
          <div className="p-12">
            <DialogHeader className="mb-10">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-sm"><UserPlus size={36} /></div>
              <DialogTitle className="text-4xl font-bold tracking-tighter leading-tight">Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1.5">Select User</Label>
                <div className="rounded-2xl border border-border overflow-y-auto max-h-[350px] bg-muted/10 p-4 space-y-2">
                  {orgMembers.filter(u => !projectMembers.find(m => m.id === u.id)).map(u => (
                    <button key={u.id} onClick={() => { setClearanceMember(u); setClearanceEnvs(['dev']); }} className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left group ${clearanceMember?.id === u.id ? 'bg-primary/10 border-primary/30' : 'border-transparent hover:bg-primary/[0.04]'}`}>
                      <div className="h-10 w-10 rounded-xl bg-background border border-border text-muted-foreground flex items-center justify-center text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">{u.name.charAt(0)}</div>
                      <div className="text-sm font-bold tracking-tight">{u.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1.5">Access Presets</Label>
                <div className="space-y-3">
                  {accessPresets.map(preset => (
                    <button key={preset.id} onClick={() => { setClearancePreset(preset.name); setClearanceEnvs(preset.environments); }} className={`w-full p-5 rounded-xl border transition-all text-left flex flex-col gap-1 group ${clearancePreset === preset.name ? 'bg-blue-500/10 border-blue-500/30' : 'border-border hover:border-blue-500/30'}`}>
                      <div className="font-bold text-xs uppercase tracking-widest">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {clearanceMember && (
              <div className="mt-8 p-6 rounded-3xl bg-muted/20 border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row gap-8 justify-between">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Environments</Label>
                    <div className="flex gap-2">
                      {['dev', 'staging', 'prod'].map(cluster => (
                        <button key={cluster} onClick={() => { if (clearanceEnvs.includes(cluster)) setClearanceEnvs(p => p.filter(e => e !== cluster)); else setClearanceEnvs(p => [...p, cluster]); }} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${clearanceEnvs.includes(cluster) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground border border-border'}`}>{cluster}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Expiration Date (TTL)</Label>
                    <div className="flex items-center gap-3"><Calendar size={18} className="text-muted-foreground" /><Input type="date" className="h-10 rounded-xl bg-muted/50 border-border font-mono text-xs" value={clearanceTTL} onChange={e => setClearanceTTL(e.target.value)} /></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-12 pt-0"><Button disabled={!clearanceMember || updatingClearance} onClick={() => handleAddProjectMember(clearanceMember.id, clearanceEnvs, clearancePreset, clearanceTTL)} className="w-full h-20 rounded-2xl text-2xl font-bold transition-all shadow-md">{updatingClearance ? <Loader2 className="animate-spin" /> : "Authorize Member"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
