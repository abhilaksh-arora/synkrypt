import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  Crown,
  Loader2,
  Search,
  LayoutGrid,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Settings2,
  FileText,
  Upload,
  Plus,
  Key,
  Network,
  HardDrive,
  ChevronDown,
  ChevronUp,
  UserCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// ─── Credential type icon helper ───────────────────────────────────────────
function credentialIcon(type: string) {
  switch (type) {
    case "vpn":
      return <Network className="size-4" />;
    case "ssh":
      return <Key className="size-4" />;
    case "file":
      return <FileText className="size-4" />;
    default:
      return <HardDrive className="size-4" />;
  }
}

function credentialColor(type: string) {
  switch (type) {
    case "vpn":
      return "text-violet-500 bg-violet-500/10 border-violet-500/20";
    case "ssh":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "file":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    default:
      return "text-primary bg-primary/10 border-primary/20";
  }
}

// ─── Per-member vault card ──────────────────────────────────────────────────
function MemberVaultCard({
  user,
  onIssue,
  onRevoke,
}: {
  user: any;
  onIssue: (user: any) => void;
  onRevoke: (assetId: string, userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const assets: any[] = user.assets || [];

  return (
    <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden transition-all">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-muted/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/10">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              {user.name}
              {user.global_admin && (
                <Crown className="size-3 text-amber-500" />
              )}
              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter px-1.5 h-4 border-primary/20 text-primary font-black">
                {user.org_role}
              </Badge>
            </div>
            <div className="text-sm font-mono text-muted-foreground/60 flex items-center gap-1 mt-0.5">
              <Mail className="size-2.5" /> {user.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assets.length > 0 ? (
            <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
              {assets.length} credential{assets.length !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge className="bg-muted/10 text-muted-foreground/40 border-transparent rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest italic">
              Empty
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-md h-7 px-2.5 text-xs font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onIssue(user);
            }}
          >
            <Plus className="size-3 mr-1" /> Issue
          </Button>
          <button
            className="text-muted-foreground/40 hover:text-foreground transition-colors ml-1"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          >
            {open ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable credentials list */}
      {open && (
        <div className="border-t border-border bg-muted/5 px-4 py-3 space-y-2">
          {assets.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground/40 italic py-2">
              No credentials issued to this member.
            </p>
          ) : (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-7 w-7 rounded flex items-center justify-center border ${credentialColor(asset.type)}`}
                  >
                    {credentialIcon(asset.type)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-tight">
                      {asset.name}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                      {asset.type === "other" && asset.metadata?.customType 
                        ? asset.metadata.customType 
                        : asset.type === "file"
                          ? "Certificate / PEM"
                          : asset.type === "vpn"
                            ? "VPN Config"
                            : asset.type === "ssh"
                              ? "SSH Key"
                              : "Credential"}{" "}
                      • {new Date(asset.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-md"
                  onClick={() => onRevoke(asset.id, user.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: me } = useAuth();
  const { currentOrg, currentOrgRole } = useOrg();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Vault state
  const [vaultUsers, setVaultUsers] = useState<any[]>([]);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [vaultSearch, setVaultSearch] = useState("");

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    password: "",
    org_role: "member" as const,
  });
  const [inviting, setInviting] = useState(false);

  const [isControlOpen, setIsControlOpen] = useState(false);
  const [selectedUser, setSelectedControlUser] = useState<any>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<any>(null);
  const [issueForm, setIssueForm] = useState({
    name: "",
    type: "file",
    value: "",
    metadata: {} as any,
  });
  const [issuing, setIssuing] = useState(false);

  const isAdminOrOwner = currentOrgRole === 'owner' || currentOrgRole === 'admin' || me?.isAdmin;

  useEffect(() => {
    if (currentOrg) {
      loadUsers();
    }
  }, [currentOrg]);

  const loadUsers = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const data = await api.getOrg(currentOrg.id);
      const members = data.members || [];
      setUsers(members);
      
      // Load vault too
      setVaultLoading(true);
      const enriched = await Promise.all(
        members.map(async (u: any) => {
          try {
            const res = await api.listUserAssets(u.id);
            return { ...u, assets: res.assets || [] };
          } catch {
            return { ...u, assets: [] };
          }
        }),
      );
      setVaultUsers(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setVaultLoading(false);
    }
  };

  // Deprecated loadVault (integrated into loadUsers)
  const loadVault = async () => {};

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setInviting(true);
    try {
      // 1. Search if user exists
      const searchRes = await api.searchUsers(inviteForm.email);
      let targetUser = searchRes.users.find((u: any) => u.email === inviteForm.email);
      
      let userId = targetUser?.id;

      // 2. Create if not exists (only global admins can do this, otherwise we expect existing user)
      if (!userId) {
        if (!me?.isAdmin) {
           throw new Error("User with this email does not exist. Only global admins can create new accounts.");
        }
        const createRes = await api.createUser({ ...inviteForm });
        userId = createRes.user.id;
      }

      // 3. Add to organization
      await api.addOrgMember(currentOrg.id, { userId, role: inviteForm.org_role });
      
      await loadUsers();
      setIsInviteOpen(false);
      setInviteForm({ email: "", name: "", password: "", org_role: "member" });
      toast({
        title: "Team Updated",
        description: `${inviteForm.email} has been added to the organization.`,
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeProject = async (projectId: string) => {
    if (!selectedUser) return;
    setRevoking(projectId);
    try {
      await api.removeProjectMember(projectId, selectedUser.id);
      setSelectedControlUser((prev: any) => ({
        ...prev,
        projects: prev.projects.filter((p: any) => p.id !== projectId),
      }));
      await loadUsers();
      toast({ title: "Access Revoked" });
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  const handleGlobalRevoke = async () => {
    if (!selectedUser || !confirm(`Revoke ALL project access for ${selectedUser.name}?`))
      return;
    setRevoking("global");
    try {
      await api.revokeAllAccess(selectedUser.id);
      setIsControlOpen(false);
      await loadUsers();
      toast({ title: "Global Access Revoked" });
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!currentOrg || !confirm("Remove this member from the team?")) return;
    try {
      await api.removeOrgMember(currentOrg.id, uid);
      await loadUsers();
      toast({ title: "Member Removed" });
    } catch (err) {
      console.error(err);
    }
  };

  const openIssueForUser = (user: any) => {
    setIssueTarget(user);
    setIssueForm({ name: "", type: "file", value: "", metadata: {} });
    setIsIssueOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setIssueForm({
        name: file.name,
        type: "file",
        value: content,
        metadata: { filename: file.name, size: file.size, mime: file.type },
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleIssueAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTarget) return;
    setIssuing(true);
    try {
      await api.issueAsset({ ...issueForm, userId: issueTarget.id });
      await loadVault();
      setIsIssueOpen(false);
      toast({ title: "Credential Issued" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeAsset = async (assetId: string, userId: string) => {
    if (!confirm("Revoke this credential?")) return;
    try {
      await api.revokeAsset(assetId);
      setVaultUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, assets: u.assets.filter((a: any) => a.id !== assetId) }
            : u,
        ),
      );
      toast({ title: "Credential Revoked" });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredVault = vaultUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(vaultSearch.toLowerCase()),
  );

  const totalCredentials = vaultUsers.reduce(
    (acc, u) => acc + (u.assets?.length || 0),
    0,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-widest text-xs mb-1.5">
            <Shield className="size-2.5" />
            User Management
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Team Members
          </h2>
        </div>
        <Button
          onClick={() => setIsInviteOpen(true)}
          disabled={!isAdminOrOwner}
          className="rounded-lg px-5 h-9 text-sm font-semibold shadow-sm hover:translate-y-[-1px] transition-all"
        >
          <UserPlus className="mr-1.5 size-4" /> Add Team Member
        </Button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-card border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              Total Users
            </p>
            <h4 className="text-2xl font-bold tracking-tight">{users.length}</h4>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
            <Users className="size-5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-card border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              Active Projects
            </p>
            <h4 className="text-2xl font-bold tracking-tight text-emerald-500">
              {users.reduce((acc, u) => acc + (u.projects?.length || 0), 0)}
            </h4>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/5 text-emerald-500 flex items-center justify-center">
            <LayoutGrid className="size-5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-card border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              Issued Credentials
            </p>
            <h4 className="text-2xl font-bold tracking-tight text-violet-500">{totalCredentials}</h4>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/5 text-violet-500 flex items-center justify-center">
            <Key className="size-5" />
          </div>
        </Card>
      </div>

      {/* ── Users table ─────────────────────────────────────────────── */}
      <Card className="rounded-2xl bg-card border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex flex-col md:flex-row justify-between items-center gap-3 bg-muted/5">
          <div className="relative w-full md:max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search team..."
              className="pl-8.5 h-8 rounded-lg bg-background border-border text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="py-2.5 pl-5 text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[30%]">
                  User
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[15%]">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[35%]">
                  Project Access
                </TableHead>
                <TableHead className="text-right pr-5 text-xs uppercase tracking-widest font-bold text-muted-foreground/60 w-[20%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? [1, 2, 3].map((i) => (
                    <TableRow key={i} className="border-border animate-pulse">
                      <TableCell className="pl-5 py-4">
                        <div className="h-8 w-40 bg-muted/40 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-14 bg-muted/40 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-48 bg-muted/40 rounded-lg" />
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="h-7 w-20 bg-muted/40 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-border group hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5 py-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                              {u.name}
                              {u.role === "admin" && <Crown className="size-2.5 text-amber-500" />}
                            </div>
                            <div className="text-sm font-mono text-muted-foreground/60 mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.projects?.length > 0 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-muted/10 text-muted-foreground/40 border-transparent rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest italic">
                            No Access
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {u.org_role === "owner" ? (
                            <div className="flex items-center gap-1 bg-amber-500/5 text-amber-600 border border-amber-500/10 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                              <Crown className="size-2" /> Owner
                            </div>
                          ) : u.org_role === "admin" ? (
                             <div className="flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                               <ShieldCheck className="size-2" /> Org Admin
                             </div>
                          ) : (
                             <div className="flex items-center gap-1 bg-muted/5 text-muted-foreground border border-border px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                               <UserCheck className="size-2" /> Member
                             </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 font-semibold text-xs uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                            onClick={() => {
                              setSelectedControlUser(u);
                              setIsControlOpen(true);
                            }}
                          >
                            <Settings2 className="size-3 mr-1" /> Access
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/30 hover:text-destructive"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={!isAdminOrOwner || u.id === me?.id || u.org_role === 'owner'}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Credentials Vault ───────────────────────────────────── */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1 text-violet-500 font-bold uppercase tracking-widest text-xs mb-1">
              <Key className="size-2.5" /> Admin Vault
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Team Assets</h3>
            <p className="text-[11px] text-muted-foreground">Manage PEM certificates, VPN configs, and high-level access assets.</p>
          </div>
          <div className="relative w-full md:max-w-[240px] group flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter vault..."
              className="pl-7.5 h-8 rounded-lg bg-card border-border text-sm shadow-none"
              value={vaultSearch}
              onChange={(e) => setVaultSearch(e.target.value)}
            />
          </div>
        </div>

        {vaultLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : filteredVault.length === 0 ? (
          <Card className="rounded-xl border-border p-8 text-center text-[11px] text-muted-foreground/40 italic font-bold">No members found.</Card>
        ) : (
          <div className="space-y-2.5">
            {filteredVault.map((u) => (
              <MemberVaultCard key={u.id} user={u} onIssue={openIssueForUser} onRevoke={handleRevokeAsset} />
            ))}
          </div>
        )}
      </div>

      {/* ── Per-user access control modal ─────────────────────────── */}
      <Dialog open={isControlOpen} onOpenChange={setIsControlOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <DialogTitle className="text-lg font-bold tracking-tight">Project Permissions</DialogTitle>
              </div>
              {selectedUser && (
                <p className="text-xs text-muted-foreground">Managing access for <span className="text-foreground font-bold">{selectedUser.name}</span></p>
              )}
            </DialogHeader>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Assigned Projects</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-xl bg-muted/10 p-1.5">
                {selectedUser?.projects?.length > 0 ? (
                  selectedUser.projects.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-2">
                        <LayoutGrid size={13} className="text-primary" />
                        <span className="text-xs font-semibold">{p.name}</span>
                      </div>
                      <Button
                        variant="ghost" size="sm" disabled={revoking === p.id} onClick={() => handleRevokeProject(p.id)}
                        className="h-6 px-2 text-xs font-bold uppercase text-destructive hover:bg-destructive/10"
                      >
                        {revoking === p.id ? <Loader2 className="animate-spin size-3" /> : "Revoke"}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center opacity-30 italic text-[11px]">No active projects.</div>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <h4 className="text-xs font-bold text-destructive mb-1 flex items-center gap-2"><XCircle className="size-3.5" /> Full Termination</h4>
              <p className="text-sm text-destructive/70 mb-3">Terminate all project memberships for this user instantly.</p>
              <Button
                onClick={handleGlobalRevoke}
                disabled={revoking === "global" || !selectedUser?.projects?.length}
                className="w-full h-8 rounded-lg bg-destructive text-destructive-foreground font-semibold text-xs"
              >
                {revoking === "global" ? <Loader2 className="animate-spin size-3" /> : "Revoke All Membership"}
              </Button>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-0">
            <Button variant="outline" onClick={() => setIsControlOpen(false)} className="w-full h-8 rounded-lg text-xs border-border">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Issue Credential dialog ────────────────────────────────── */}
      <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <DialogTitle className="text-lg font-bold tracking-tight">Issue Asset</DialogTitle>
              </div>
              {issueTarget && (
                <p className="text-xs text-muted-foreground">Assigning asset to <span className="text-foreground font-bold">{issueTarget.name}</span></p>
              )}
            </DialogHeader>

            <form id="issue-form" onSubmit={handleIssueAsset} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset Name</Label>
                <Input
                  placeholder="e.g. Production SSH Key" value={issueForm.name}
                  onChange={(e) => setIssueForm({ ...issueForm, name: e.target.value })}
                  required className="h-8 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset Type</Label>
                <Select value={issueForm.type} onValueChange={(v) => setIssueForm({ ...issueForm, type: v })}>
                  <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">Certificate / PEM</SelectItem>
                    <SelectItem value="vpn">VPN Configuration</SelectItem>
                    <SelectItem value="ssh">SSH Key</SelectItem>
                    <SelectItem value="other">Other Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {issueForm.type === "other" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset Category</Label>
                  <Input
                    placeholder="e.g. API Access, Support Token..."
                    value={(issueForm.metadata as any).customType || ""}
                    onChange={(e) => setIssueForm({ ...issueForm, metadata: { ...(issueForm.metadata as any), customType: e.target.value } })}
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Content</Label>
                {issueForm.value ? (
                  <div className="p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-violet-500" />
                      <span className="text-[11px] font-medium truncate max-w-[180px]">{issueForm.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs font-bold text-muted-foreground" onClick={() => setIssueForm({ ...issueForm, value: "", metadata: {} })}>Reset</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button" variant="outline" className="h-14 rounded-xl flex-col gap-1 border-dashed border-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary"
                      onClick={() => fileInputRef.current?.click()}
                    ><Upload size={14} />Upload</Button>
                    <Button
                      type="button" variant="outline" className="h-14 rounded-xl flex-col gap-1 border-dashed border-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary"
                      onClick={() => { const val = prompt("Paste content:"); if (val) setIssueForm({ ...issueForm, value: val, metadata: {} }); }}
                    ><FileText size={14} />Paste</Button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>
            </form>
          </div>
          <DialogFooter className="px-6 pb-6 pt-0">
            <Button form="issue-form" type="submit" disabled={issuing || !issueForm.value} className="w-full h-9 rounded-lg text-xs font-bold">
              {issuing ? <Loader2 className="animate-spin size-3" /> : "Issue Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite User dialog ────────────────────────────────────── */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 border-border overflow-hidden shadow-xl bg-card">
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><UserPlus size={16} /></div>
                <DialogTitle className="text-lg font-bold tracking-tight">Add Team Member</DialogTitle>
              </div>
            </DialogHeader>
            <form id="invite-form" onSubmit={handleInvite} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Name</Label>
                  <Input placeholder="John Doe" className="h-8 rounded-lg bg-muted/20 border-border text-xs" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Org Role</Label>
                  <Select value={inviteForm.org_role} onValueChange={(v: any) => setInviteForm({ ...inviteForm, org_role: v })}>
                    <SelectTrigger className="h-8 rounded-lg bg-muted/20 border-border text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {me?.isAdmin && <SelectItem value="owner">Owner</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Email</Label>
                <Input type="email" placeholder="john@company.com" className="h-8 rounded-lg bg-muted/20 border-border text-xs" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Password (New User Only)</Label>
                <Input type="password" placeholder="••••••••" className="h-8 rounded-lg bg-muted/20 border-border text-xs" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} />
              </div>
            </form>
          </div>
          <DialogFooter className="px-6 pb-6 pt-0">
            <Button form="invite-form" type="submit" disabled={inviting} className="w-full h-9 rounded-lg text-xs font-bold">
              {inviting ? <Loader2 className="animate-spin size-3" /> : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
