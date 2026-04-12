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
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary mb-1">Organizations</h2>
          <p className="text-muted-foreground">Select an organization to manage projects and secrets.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl px-6 h-12 bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20 transition-all font-bold">
            <Plus className="mr-2 h-5 w-5" /> Create Organization
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-[2rem] bg-muted/20 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-[3rem] border border-dashed border-border/40">
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
              <Card className="p-8 rounded-[2rem] h-full flex flex-col justify-between hover:shadow-2xl hover:border-primary/40 transition-all duration-300 group cursor-pointer border-border/40 bg-card/40 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter mb-1 text-foreground">{org.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-60">ID: {org.slug || org.id.slice(0,8)}</p>
                </div>
                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-4 leading-relaxed relative z-10">{org.description}</p>
                )}
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
