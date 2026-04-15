import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Terminal,
  Key,
  Plus as PlusIcon,
  Building2,
  ArrowRight,
  Loader2,
  LayoutGrid,
  Activity,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import { api } from "../api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const { orgs, currentOrg, currentOrgRole, refreshOrgs } = useOrg();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    github_repo: "",
  });
  const [creating, setCreating] = useState(false);

  const canCreateProject =
    currentOrgRole === "owner" || currentOrgRole === "admin" || user?.isAdmin;

  useEffect(() => {
    loadProjects();
  }, [currentOrg]);

  const loadProjects = async () => {
    if (!currentOrg && user?.isAdmin !== true) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const data = await api.listProjects(currentOrg?.id);
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg && user?.isAdmin !== true) return;
    setCreating(true);
    try {
      await api.createProject(newProject, currentOrg?.id);
      await loadProjects();
      setIsCreateOpen(false);
      setNewProject({ name: "", description: "", github_repo: "" });
      toast({
        title: "Project Created",
        description: "Your new project has been initialized.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    setCreating(true);
    try {
      await api.createOrg({ name: newTeamName });
      await refreshOrgs();
      setIsCreateTeamOpen(false);
      setNewTeamName("");
      toast({
        title: "Team Created",
        description: "Your organization is now ready.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-3xl space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 mb-2">
            <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
              {user?.name.charAt(0)}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
              Welcome back, {user?.name}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base leading-relaxed max-w-xl italic pt-1">
            Securely manage environment variables and team access.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={!canCreateProject}
            className="h-10 rounded-xl px-5 text-sm font-bold shadow-sm hover:translate-y-[-1px] transition-all group"
          >
            <PlusIcon className="mr-2 size-4 group-hover:rotate-90 transition-transform" />{" "}
            Create Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card
              key={i}
              className="h-64 rounded-3xl bg-card border-border animate-pulse"
            />
          ))
        ) : orgs.length === 0 && !user?.isAdmin ? (
          <Card className="col-span-full py-20 rounded-3xl bg-muted/5 border-dashed border-border flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-sm">
              <Building2 className="size-10" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight mb-4">
              Welcome to Synkrypt
            </h3>
            <p className="text-muted-foreground max-w-md mb-10 text-lg italic">
              Before managing secrets, you need to create an{" "}
              <strong>Organization</strong> (Team). This will be the
              cryptographic home for all your projects.
            </p>
            <Button
              onClick={() => setIsCreateTeamOpen(true)}
              className="rounded-2xl h-14 px-10 font-bold text-lg shadow-lg hover:scale-105 transition-all"
            >
              <PlusIcon className="mr-2 size-5" /> Initialize First Team
            </Button>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="col-span-full py-20 rounded-3xl bg-muted/5 border-dashed border-border flex flex-col items-center justify-center text-center">
            <ShieldAlert className="size-16 text-muted-foreground/20 mb-6" />
            <h3 className="text-2xl font-bold tracking-tight mb-2">
              {!currentOrg && !user?.isAdmin
                ? "No Team Selected"
                : "No Active Projects"}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              {!currentOrg && !user?.isAdmin
                ? "Please select or create a team from the sidebar to start managing projects."
                : "You haven't created any projects yet. Get started by initializing your first environment."}
            </p>
            {canCreateProject && projects.length === 0 && currentOrg && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-xl h-12 px-8 font-bold"
              >
                Create First Project
              </Button>
            )}
          </Card>
        ) : (
          projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="p-6 h-full rounded-2xl bg-card border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-primary/30 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-105 group-hover:bg-primary/10 transition-all">
                      <LayoutGrid className="size-6" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground/30 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="font-mono text-[10px] sm:text-xs text-muted-foreground/50 font-bold uppercase tracking-widest mb-3 truncate">
                    {project.project_key}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed italic">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <Activity className="size-3" /> Connected
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 mt-12 pb-8">
        <div className="space-y-5">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="size-5 text-primary" />
            Quick Setup
          </h3>
          <div className="space-y-3">
            {[
              {
                t: "1. Create Project",
                d: "Set up a workspace for your microservice.",
              },
              {
                t: "2. Auth CLI",
                d: "Run 'synkrypt login' to link your environment.",
              },
              {
                t: "3. Inject Secrets",
                d: "Use 'synkrypt run' to securely inject variables.",
              },
              {
                t: "4. Deploy",
                d: "Connect your cloud providers to sync config.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl bg-muted/5 border border-border/40 hover:bg-muted/10 transition-colors group items-center"
              >
                <div className="font-black text-3xl opacity-10 group-hover:opacity-30 group-hover:text-primary transition-all select-none w-12 text-center">
                  0{i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-foreground mb-1">
                    {step.t}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {step.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 flex flex-col">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck className="size-5 text-primary" />
            Capabilities
          </h3>
          <div className="flex flex-col gap-3 flex-1">
            <div className="grid grid-cols-2 gap-3 h-full min-h-[140px]">
              <Card className="p-6 rounded-2xl bg-card border-border/50 flex flex-col justify-center items-center text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                  <Terminal className="size-5" />
                </div>
                <h4 className="font-bold text-sm mb-1">CLI Tools</h4>
                <p className="text-[10px] text-muted-foreground/60 uppercase font-mono tracking-widest">
                  v3.5 Native
                </p>
              </Card>
              <Card className="p-6 rounded-2xl bg-card border-border/50 flex flex-col justify-center items-center text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                  <Key className="size-5" />
                </div>
                <h4 className="font-bold text-sm mb-1">Enterprise RBAC</h4>
                <p className="text-[10px] text-muted-foreground/60 uppercase font-mono tracking-widest">
                  Granular Control
                </p>
              </Card>
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10 relative overflow-hidden group">
              <h3 className="text-lg font-bold tracking-tight mb-2 text-primary">
                Zero Trust Architecture
              </h3>
              <p className="text-primary/70 text-sm leading-relaxed italic">
                Data is encrypted locally before transmission using AES-256 GCM.
                We never see plaintext secrets.
              </p>
            </div>
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
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Create Project
              </DialogTitle>
              <DialogDescription className="text-sm">
                Initialize a secure workspace for your team.
              </DialogDescription>
            </DialogHeader>

            <form
              id="project-form"
              onSubmit={handleCreate}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="p-name"
                  className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Project Name
                </Label>
                <Input
                  id="p-name"
                  placeholder="e.g. Production API"
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 transition-all font-bold text-sm"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="p-desc"
                  className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Description
                </Label>
                <Input
                  id="p-desc"
                  placeholder="Service description..."
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 text-sm"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="p-repo"
                  className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  GitHub (Optional)
                </Label>
                <Input
                  id="p-repo"
                  placeholder="org/repo"
                  className="h-10 rounded-lg bg-muted/30 border-border px-4 font-mono text-xs"
                  value={newProject.github_repo}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      github_repo: e.target.value,
                    }))
                  }
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-8 pt-5 bg-muted/5 border-t border-border/10">
            <Button
              form="project-form"
              type="submit"
              disabled={creating}
              className="w-full h-12 rounded-lg text-lg font-bold transition-all shadow-md"
            >
              {creating ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-8 pb-5">
            <DialogHeader className="mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <Building2 size={20} />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Create Your Team
              </DialogTitle>
              <DialogDescription className="text-sm">
                An organization is required to manage your projects.
              </DialogDescription>
            </DialogHeader>

            <form
              id="team-form"
              onSubmit={handleCreateTeam}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="t-name"
                  className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Organization Name
                </Label>
                <Input
                  id="t-name"
                  placeholder="e.g. Acme Engineering"
                  className="h-11 rounded-lg bg-muted/30 border-border px-4 transition-all font-bold text-base"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-8 pt-5 bg-muted/5 border-t border-border/10">
            <Button
              form="team-form"
              type="submit"
              disabled={creating}
              className="w-full h-12 rounded-lg text-lg font-bold transition-all shadow-md"
            >
              {creating ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Initialize Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
