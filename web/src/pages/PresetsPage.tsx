import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  ShieldCheck, Plus as PlusIcon, Trash2, Shield, 
  Loader2, Tags, Globe, Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function PresetsPage() {
  const { toast } = useToast();
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', description: '', environments: ['dev'] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await api.listPresets();
      setPresets(data.presets || []);
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
      await api.createPreset(newPreset);
      await loadPresets();
      setIsAddOpen(false);
      setNewPreset({ name: '', description: '', environments: ['dev'] });
      toast({ title: "Protocol Established", description: `Access preset "${newPreset.name}" is now active.` });
    } catch (err: any) {
      toast({ title: "Failed to create preset", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this access preset? This will not affect existing members.')) return;
    try {
      await api.deletePreset(id);
      await loadPresets();
      toast({ title: "Protocol Purged" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-1.5">
             <Shield className="size-3" />
             Security Governance
           </div>
           <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Access Presets
           </h2>
           <p className="text-xs text-muted-foreground/60 italic font-medium">Standardized team clearance protocols.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-9 rounded-lg px-4 text-sm font-bold shadow-md hover:translate-y-[-1px] transition-all group">
          <PlusIcon className="mr-1.5 size-4 group-hover:rotate-90 transition-transform" /> Create Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-5 rounded-xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Protocols</p>
               <h4 className="text-xl font-bold tracking-tight">{presets.length}</h4>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
               <Tags className="size-5" />
            </div>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Structure</p>
               <h4 className="text-xl font-bold tracking-tight">Granular RBAC</h4>
            </div>
             <div className="h-10 w-10 rounded-lg bg-emerald-500/5 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="size-5" />
             </div>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Platform</p>
               <h4 className="text-xl font-bold tracking-tight text-blue-500">V3.5 Standard</h4>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/5 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Globe className="size-5" />
            </div>
         </Card>
      </div>

      <Card className="rounded-xl bg-card border-border shadow-sm overflow-hidden border-t-0">
        <div className="px-6 py-3 border-b border-border bg-muted/5 flex items-center gap-3">
           <Info className="size-4 text-primary" />
           <p className="text-xs font-bold text-muted-foreground/60 italic">
              Access presets define standardized environment clearance levels for your team.
           </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="py-3 pl-6 text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[30%]">Protocol Identity</TableHead>
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[45%]">Cluster Clearance</TableHead>
                <TableHead className="text-right pr-6 text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[25%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i} className="border-border animate-pulse">
                    <TableCell className="pl-6 py-4"><div className="h-6 w-32 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell><div className="h-6 w-48 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell className="pr-6 text-right"><div className="h-7 w-7 bg-muted/40 rounded-lg ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : presets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                     <div className="flex flex-col items-center justify-center opacity-20">
                        <Tags size={32} className="mb-3 text-primary" />
                        <p className="font-bold text-base tracking-tight italic">No protocols defined.</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : presets.map(preset => (
                <TableRow key={preset.id} className="border-border group hover:bg-muted/5 transition-colors">
                  <TableCell className="pl-6 py-4">
                     <div className="flex flex-col">
                        <h4 className="font-bold text-sm tracking-tight text-foreground">{preset.name}</h4>
                        <p className="text-[11px] text-muted-foreground/60 italic line-clamp-1 max-w-xs">{preset.description}</p>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-wrap gap-2">
                        {['dev', 'staging', 'prod'].map(env => (
                           <div 
                              key={env} 
                              className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                                 preset.environments.includes(env) 
                                    ? 'bg-primary/5 text-primary border border-primary/10 shadow-sm' 
                                    : 'bg-muted/10 text-muted-foreground/20 border border-transparent'
                              }`}
                           >
                              {env}
                           </div>
                        ))}
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 rounded-lg text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100" 
                       onClick={() => handleDelete(preset.id)}
                     >
                        <Trash2 size={14} />
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-8 pb-5">
            <DialogHeader className="mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <PlusIcon size={20} />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Create Preset</DialogTitle>
            </DialogHeader>
            
            <form id="preset-form" onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Tag Name</Label>
                <Input
                  id="p-name"
                  placeholder="e.g. Senior Backend Engineer"
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 transition-all font-bold text-sm"
                  value={newPreset.name}
                  onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-desc" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea
                  id="p-desc"
                  placeholder="What is this tag for?"
                  className="min-h-[80px] rounded-lg bg-muted/30 border-border px-4 py-2 transition-all italic text-xs"
                  value={newPreset.description}
                  onChange={e => setNewPreset({ ...newPreset, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Default Clearances</Label>
                 <div className="flex gap-2">
                    {['dev', 'staging', 'prod'].map(env => (
                       <button
                          key={env}
                          type="button"
                          onClick={() => {
                             if (newPreset.environments.includes(env)) {
                                setNewPreset({ ...newPreset, environments: newPreset.environments.filter(e => e !== env) });
                             } else {
                                setNewPreset({ ...newPreset, environments: [...newPreset.environments, env] });
                             }
                          }}
                          className={`flex-1 h-9 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                             newPreset.environments.includes(env)
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted/50 text-muted-foreground border border-border'
                          }`}
                       >
                          {env}
                       </button>
                    ))}
                 </div>
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-8 pt-5 bg-muted/5 border-t border-border/10">
            <Button form="preset-form" type="submit" disabled={saving} className="w-full h-11 rounded-lg text-lg font-bold shadow-md transition-all">
              {saving ? <Loader2 className="animate-spin" /> : "Authorize Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
