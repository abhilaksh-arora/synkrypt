import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Building2, FolderKanban, Plus, ArrowRight, Loader2, Users, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OrgDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', slug: '' });
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const orgData = await api.getOrg(id!);
      setOrg(orgData.org);
      const projectsData = await api.listProjects(id!);
      setProjects(projectsData.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      await api.createProject(id!, newProject);
      await loadData();
      setIsProjectDialogOpen(false);
      setNewProject({ name: '', slug: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProject(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
    </div>
  );

  if (!org) return <div>Organization not found.</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <Card className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/40 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building2 size={180} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-[0.3em] text-[10px]">
                  <span className="h-1 w-6 bg-primary rounded-full" /> 
                  Organization Profile
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">{org.name}</h2>
               <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                  {org.description || "Active node in the Synkrypt distributed secrets nexus. Managing secure project environments."}
               </p>
               <div className="flex gap-4 pt-4">
                  <div className="px-5 py-2.5 rounded-2xl bg-muted/30 border border-border/40 text-xs font-mono">
                     SLUG: <span className="text-foreground font-bold">{org.slug}</span>
                  </div>
                  <div className="px-5 py-2.5 rounded-2xl bg-muted/30 border border-border/40 text-xs font-mono">
                     ID: <span className="text-foreground font-bold">{org.id.slice(0, 12)}...</span>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col gap-3 shrink-0">
               <Button variant="outline" className="h-12 rounded-xl px-6 border-border/60 font-bold hover:bg-muted/80">
                  <Users className="size-4 mr-2" /> Manage Members
               </Button>
               <Button variant="outline" className="h-12 rounded-xl px-6 border-border/60 font-bold hover:bg-muted/80">
                  <Settings className="size-4 mr-2" /> Node Settings
               </Button>
            </div>
         </div>
      </Card>

      {/* Projects Section */}
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
              <FolderKanban className="size-5 text-primary" />
              Project Clusters
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Initialize and manage project identities within this node.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsProjectDialogOpen(true)} className="rounded-xl px-6 h-12 font-bold shadow-xl shadow-primary/20 transition-all hover-elevate">
              <Plus className="mr-2 h-5 w-5" /> New Project
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="py-20 rounded-[2.5rem] border border-dashed border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center">
             <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6">
               <FolderKanban className="text-muted-foreground/40" />
             </div>
             <h4 className="text-xl font-bold">No projects yet</h4>
             <p className="text-muted-foreground max-w-xs mt-2 mb-8">Deploy your first project identity to start routing secrets securely.</p>
             {isAdmin && (
               <Button onClick={() => setIsProjectDialogOpen(true)} className="rounded-xl px-8 h-12 font-bold">Deploy Discovery Project</Button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="p-8 rounded-[2rem] bg-card/40 backdrop-blur-3xl border-border/40 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                         <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                            <FolderKanban className="size-6" />
                         </div>
                         <div className="h-9 w-9 rounded-full bg-muted/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                            <ArrowRight className="h-4 w-4 text-primary" />
                         </div>
                      </div>
                      <h4 className="text-2xl font-black tracking-tighter mb-1 line-clamp-1">{project.name}</h4>
                      <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">{project.slug || project.id.slice(0,8)}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {['dev', 'prod', 'staging'].map(env => (
                          <div key={env} className="px-2 py-1 rounded-md bg-muted/40 text-[10px] uppercase font-bold tracking-tighter text-muted-foreground/80">
                            {env}
                          </div>
                        ))}
                      </div>
                   </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-8 pb-4">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black tracking-tight">Project Deployment</DialogTitle>
              <DialogDescription className="text-base">
                Allocate a new secure project container for your application.
              </DialogDescription>
            </DialogHeader>
            
            <form id="project-form" onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="proj-name" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Project Display Name</Label>
                <Input
                  id="proj-name"
                  placeholder="Backend Vision API"
                  className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all"
                  value={newProject.name}
                  onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-slug" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Vortex Identifier (Slug)</Label>
                <Input
                  id="proj-slug"
                  placeholder="vision-api"
                  className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all font-mono text-sm"
                  value={newProject.slug}
                  onChange={e => setNewProject(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  required
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-8 pt-4 bg-muted/10">
            <Button form="project-form" type="submit" disabled={savingProject} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
              {savingProject ? <Loader2 className="animate-spin" /> : "Deploy Identity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
