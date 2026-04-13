import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, Terminal, Key, Plus as PlusIcon, 
  ArrowRight, Loader2, LayoutGrid,  Activity, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', github_repo: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createProject(newProject);
      await loadProjects();
      setIsCreateOpen(false);
      setNewProject({ name: '', description: '', github_repo: '' });
      toast({ title: "Project Created", description: "Your new project has been initialized." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
                {user?.name.charAt(0)}
             </div>
             <h2 className="text-sm font-semibold text-primary/60 tracking-tight">Welcome back, {user?.name}</h2>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
            Projects
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl italic">
            Securely manage environment variables and team access.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="h-9 rounded-lg px-4 text-sm font-bold shadow-md hover:translate-y-[-1px] transition-all group">
          <PlusIcon className="mr-1.5 size-4 group-hover:rotate-90 transition-transform" /> Create Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
           [1,2,3].map(i => (
             <Card key={i} className="h-64 rounded-3xl bg-card border-border animate-pulse" />
           ))
         ) : projects.length === 0 ? (
           <Card className="col-span-full py-20 rounded-3xl bg-muted/5 border-dashed border-border flex flex-col items-center justify-center text-center">
              <ShieldAlert className="size-16 text-muted-foreground/20 mb-6" />
              <h3 className="text-2xl font-bold tracking-tight mb-2">No Active Projects</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                 You haven't created any projects yet. Get started by initializing your first environment.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl h-12 px-8 font-bold">
                 Create First Project
              </Button>
           </Card>
         ) : projects.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="p-6 h-full rounded-xl bg-card border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all group flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                       <LayoutGrid className="size-5" />
                     </div>
                     <div className="font-mono text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest bg-muted/20 px-2 py-0.5 rounded">
                        {project.project_key}
                     </div>
                   </div>
                   <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
                   <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed italic">
                     {project.description || "No description provided."}
                   </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                         <Activity className="size-3 text-emerald-500" /> Connected
                      </div>
                   </div>
                   <ArrowRight className="size-4 text-muted-foreground/30 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              </Card>
            </Link>
         ))}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 mt-12">
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="size-5 text-primary" />
            Quick Setup
          </h3>
          <div className="space-y-3">
             {[
               { t: "1. Create Project", d: "Set up a workspace for your microservice." },
               { t: "2. Auth CLI", d: "Run 'synkrypt login' to link your environment." },
               { t: "3. Inject Secrets", d: "Use 'synkrypt run' to securely inject variables." },
               { t: "4. Deploy", d: "Connect your cloud providers to sync config." },
             ].map((step, i) => (
               <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-all group">
                 <div className="font-bold text-2xl opacity-10 group-hover:opacity-30 group-hover:text-primary transition-all select-none">0{i+1}</div>
                 <div>
                   <h4 className="font-bold text-sm text-foreground mb-0.5">{step.t}</h4>
                   <p className="text-[11px] text-muted-foreground leading-relaxed italic">{step.d}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck className="size-5 text-primary" />
            Features
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 rounded-xl bg-card border-border flex flex-col items-center text-center shadow-sm">
               <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                  <Terminal className="size-4" />
               </div>
               <h4 className="font-bold text-xs mb-1">CLI Tools</h4>
               <p className="text-[9px] text-muted-foreground uppercase tracking-widest">v3.5</p>
            </Card>
             <Card className="p-6 rounded-xl bg-card border-border flex flex-col items-center text-center shadow-sm">
               <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <Key className="size-4" />
               </div>
               <h4 className="font-bold text-xs mb-1">RBAC</h4>
               <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Enterprise</p>
            </Card>
          </div>
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 relative overflow-hidden group">
             <h3 className="text-lg font-bold tracking-tight mb-2">Zero Trust</h3>
             <p className="text-muted-foreground text-[11px] leading-relaxed max-w-sm italic">
                Data is encrypted locally before transmission. We never store plaintext secrets.
             </p>
          </div>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-8 pb-5">
            <DialogHeader className="mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <PlusIcon size={20} />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Create Project</DialogTitle>
              <DialogDescription className="text-sm">
                Initialize a secure workspace for your team.
              </DialogDescription>
            </DialogHeader>
            
            <form id="project-form" onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Project Name</Label>
                <Input
                  id="p-name"
                  placeholder="e.g. Production API"
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 transition-all font-bold text-sm"
                  value={newProject.name}
                  onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-desc" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Input
                  id="p-desc"
                  placeholder="Service description..."
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 text-sm"
                  value={newProject.description}
                  onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-repo" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">GitHub (Optional)</Label>
                <Input
                  id="p-repo"
                  placeholder="org/repo"
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 font-mono text-xs"
                  value={newProject.github_repo}
                  onChange={e => setNewProject(p => ({ ...p, github_repo: e.target.value }))}
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-8 pt-5 bg-muted/5 border-t border-border/10">
            <Button form="project-form" type="submit" disabled={creating} className="w-full h-12 rounded-lg text-lg font-bold transition-all shadow-md">
              {creating ? <Loader2 className="animate-spin" /> : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
