import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Building2, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../context/AuthContext';

export default function OrgsPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    try {
      const data = await api.listOrgs();
      setOrgs(data.orgs);
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
      await api.createOrg(newOrg);
      await loadOrgs();
      setIsDialogOpen(false);
      setNewOrg({ name: '', slug: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border/30 bg-card/30 p-6 shadow-xl shadow-primary/5 backdrop-blur-xl md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
              <Building2 className="size-3" />
              <span>Organization Directory</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Organizations</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Browse your workspace nodes and jump into the teams, projects, and secrets managed inside each one.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-border/40 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {orgs.length} active organizations
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsDialogOpen(true)} className="h-11 rounded-xl px-5 bg-primary text-primary-foreground shadow-lg shadow-primary/15 transition-all font-bold hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-[2rem] bg-muted/20 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border/40 bg-muted/5 py-24">
           <Building2 className="h-16 w-16 text-muted-foreground/30 mb-6" />
           <h3 className="text-2xl font-black tracking-tight mb-2">No organizations found</h3>
           <p className="text-muted-foreground mb-8">Create your first organization to start managing secrets.</p>
           {isAdmin && (
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl h-12 px-8 font-bold">Create First Organization</Button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map(org => (
            <Link key={org.id} to={`/orgs/${org.id}`}>
              <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border-border/30 bg-card/35 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 md:p-7">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex h-9 w-9 translate-x-2 items-center justify-center rounded-full bg-background/80 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-1 text-2xl font-black tracking-tight text-foreground">{org.name}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{org.slug || org.id.slice(0,8)}</p>
                </div>
                <div className="relative z-10 mt-5 space-y-4">
                  {org.description ? (
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{org.description}</p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground/70">
                      Shared node for projects, collaborators, and environment access management.
                    </p>
                  )}
                  <div className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Open workspace
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-0 border-border/40 overflow-hidden shadow-2xl backdrop-blur-3xl bg-card/90">
          <div className="p-8 pb-4">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black tracking-tight">Expansion Protocol</DialogTitle>
              <DialogDescription className="text-base">
                Initialize a new organization node within the Synkrypt vortex.
              </DialogDescription>
            </DialogHeader>
            
            <form id="org-form" onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Galaxy"
                  className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all"
                  value={newOrg.name}
                  onChange={e => setNewOrg(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Unique Alias (Slug)</Label>
                <Input
                  id="org-slug"
                  placeholder="acme-galaxy"
                  className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all font-mono text-sm"
                  value={newOrg.slug}
                  onChange={e => setNewOrg(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  required
                />
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-8 pt-4 bg-muted/10">
            <Button form="org-form" type="submit" disabled={saving} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
              {saving ? <Loader2 className="animate-spin" /> : "Initialize Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
