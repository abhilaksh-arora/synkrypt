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
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', slug: '' });
  const [savingProject, setSavingProject] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const orgData = await api.getOrg(id!);
      setOrg(orgData.org);
      setMembers(orgData.members || []);
      const projectsData = await api.listProjects(id!);
      setProjects(projectsData.projects);
      
      const usersData = await api.listUsers();
      setAllUsers(usersData.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await api.addOrgMember(id!, { userId });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.removeOrgMember(id!, userId);
      await loadData();
    } catch (err) {
      console.error(err);
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
    <div className="space-y-10">
      {/* Header Info */}
      <Card className="relative overflow-hidden rounded-[2.25rem] border-border/30 bg-card/35 p-6 shadow-xl shadow-primary/5 backdrop-blur-3xl md:p-8">
         <div className="absolute right-0 top-0 p-8 opacity-[0.06]">
            <Building2 size={160} />
         </div>
         <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
                  <Building2 className="size-3" />
                  <span>Organization Profile</span>
               </div>
               <div className="space-y-3">
                  <div className="font-mono text-sm text-muted-foreground">{org.slug}</div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{org.name}</h2>
                  <p className="max-w-2xl text-muted-foreground leading-relaxed">
                     {org.description || "Active node in the Synkrypt distributed secrets nexus. Managing secure project environments."}
                  </p>
               </div>
               <div className="flex flex-wrap gap-3 pt-1">
                  <div className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                     {projects.length} projects
                  </div>
                  <div className="rounded-full border border-border/40 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                     {members.length} members
                  </div>
                  <div className="rounded-full border border-border/40 bg-background/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                     ID {org.id.slice(0, 12)}...
                  </div>
               </div>
            </div>
            
            <div className="flex flex-wrap gap-3 xl:justify-end">
               <Button onClick={() => setIsMembersDialogOpen(true)} variant="outline" className="h-11 rounded-xl px-5 border-border/50 bg-background/70 font-bold hover:bg-muted/70">
                  <Users className="mr-2 size-4" /> Manage Members
               </Button>
               <Button variant="outline" className="h-11 rounded-xl px-5 border-border/50 bg-background/70 font-bold hover:bg-muted/70">
                  <Settings className="mr-2 size-4" /> Node Settings
               </Button>
            </div>
         </div>
      </Card>

      {/* Projects Section */}
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
              <FolderKanban className="size-5 text-primary" />
              Project Clusters
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Initialize and manage project identities within this node.</p>
            <div className="inline-flex rounded-full border border-border/30 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {projects.length} active clusters
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsProjectDialogOpen(true)} className="h-11 rounded-xl px-5 font-bold shadow-lg shadow-primary/15 transition-all hover-elevate">
              <Plus className="mr-2 h-4 w-4" /> New Project
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
                <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border-border/30 bg-card/35 p-6 backdrop-blur-3xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 md:p-7">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                   <div className="relative z-10">
                      <div className="mb-6 flex justify-between items-start">
                         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                            <FolderKanban className="size-6" />
                         </div>
                         <div className="flex h-9 w-9 translate-x-2 items-center justify-center rounded-full bg-background/80 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                            <ArrowRight className="h-4 w-4 text-primary" />
                         </div>
                      </div>
                      <h4 className="mb-1 line-clamp-1 text-2xl font-black tracking-tight">{project.name}</h4>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{project.slug || project.id.slice(0,8)}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {['dev', 'prod', 'staging'].map(env => (
                          <div key={env} className="rounded-full border border-border/20 bg-muted/25 px-3 py-1.5 text-[10px] uppercase font-bold tracking-[0.18em] text-muted-foreground/75">
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

      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black tracking-tight">Node Members</DialogTitle>
              <DialogDescription>
                Assign authorized system users to this organization nexus.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Current Membership</Label>
                <div className="rounded-2xl border border-border/30 overflow-hidden bg-muted/10">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                      {m.id !== user?.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMember(m.id)}>
                          <Plus className="rotate-45 size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">System Users (Select to Add)</Label>
                <div className="rounded-2xl border border-border/30 overflow-y-auto max-h-[200px] bg-muted/10 scrollbar-none">
                  {allUsers.filter(u => !members.find(m => m.id === u.id)).map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => handleAddMember(u.id)}
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
                      <Plus className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
             <Button variant="outline" onClick={() => setIsMembersDialogOpen(false)} className="w-full h-12 rounded-xl font-bold">Close Nexus Control</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
