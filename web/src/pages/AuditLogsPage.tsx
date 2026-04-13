import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  ShieldAlert, Search, 
  User as UserIcon, LayoutGrid, Terminal, 
  Eye, ShieldCheck, 
  Download, Activity,
  Key, Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setAuditStats] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    projectId: '',
    userId: '',
    action: '',
    search: ''
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
    loadStats();
  }, []);

  const loadInitialData = async () => {
    try {
      const pData = await api.listProjects();
      setProjects(pData.projects || []);
      if (user?.role === 'admin') {
        const uData = await api.listUsers();
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.projectId && filters.projectId !== 'all') query.append('projectId', filters.projectId);
      if (filters.userId && filters.userId !== 'all') query.append('userId', filters.userId);
      if (filters.action && filters.action !== 'all') query.append('action', filters.action);
      
      const data = await api.request('GET', `/audit-logs?${query.toString()}`);
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.request('GET', '/audit-logs/stats');
      setAuditStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters.projectId, filters.userId, filters.action]);

  const filteredLogs = logs.filter(log => 
    log.actor_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.details?.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.metadata?.key?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes('read')) return <Eye className="size-4 text-amber-500" />;
    if (action.includes('write')) return <ShieldCheck className="size-4 text-emerald-500" />;
    if (action.includes('delete')) return <ShieldAlert className="size-4 text-rose-500" />;
    return <Terminal className="size-4 text-primary" />;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[9px] mb-1.5">
             <Activity className="size-3" />
             Security Monitoring
           </div>
           <h2 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h2>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-lg h-9 px-4 text-sm font-bold border-border hover:bg-muted/80">
              <Download className="mr-1.5 size-4" /> Export CSV
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="p-5 rounded-xl bg-card border-border shadow-sm">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Events</p>
            <h4 className="text-xl font-bold tracking-tight">{stats?.total || 0}</h4>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border shadow-sm">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Access Events</p>
            <h4 className="text-xl font-bold tracking-tight text-amber-500">{stats?.reads || 0}</h4>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border shadow-sm">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Update Events</p>
            <h4 className="text-xl font-bold tracking-tight text-emerald-500">{stats?.writes || 0}</h4>
         </Card>
         <Card className="p-5 rounded-xl bg-card border-border shadow-sm">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Last 24 Hours</p>
            <h4 className="text-xl font-bold tracking-tight text-blue-500">{stats?.last_24h || 0}</h4>
         </Card>
      </div>

      <Card className="p-3 rounded-xl bg-muted/10 border-border flex flex-wrap items-center gap-3">
         <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input 
               placeholder="Search by key, user, or action..." 
               className="pl-9 h-9 rounded-lg bg-background border-border text-xs"
               value={filters.search}
               onChange={e => setFilters({...filters, search: e.target.value})}
            />
         </div>
         
         <Select value={filters.projectId} onValueChange={v => setFilters({...filters, projectId: v})}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg bg-background border-border font-bold text-[10px] uppercase tracking-widest">
               <div className="flex items-center gap-2"><LayoutGrid size={13} /> <SelectValue placeholder="Projects" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-xl">
               <SelectItem value="all" className="font-bold text-[10px] uppercase">All Projects</SelectItem>
               {projects.map(p => <SelectItem key={p.id} value={p.id} className="font-bold text-xs">{p.name}</SelectItem>)}
            </SelectContent>
         </Select>

         {user?.role === 'admin' && (
            <Select value={filters.userId} onValueChange={v => setFilters({...filters, userId: v})}>
               <SelectTrigger className="w-[180px] h-9 rounded-lg bg-background border-border font-bold text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-2"><UserIcon size={13} /> <SelectValue placeholder="Users" /></div>
               </SelectTrigger>
               <SelectContent className="rounded-xl border-border shadow-xl">
                  <SelectItem value="all" className="font-bold text-[10px] uppercase">All Users</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id} className="font-bold text-xs">{u.name}</SelectItem>)}
               </SelectContent>
            </Select>
         )}

         <Select value={filters.action} onValueChange={v => setFilters({...filters, action: v})}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg bg-background border-border font-bold text-[10px] uppercase tracking-widest">
               <div className="flex items-center gap-2"><Terminal size={13} /> <SelectValue placeholder="Actions" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-xl">
               <SelectItem value="all" className="font-bold text-[10px] uppercase">All Actions</SelectItem>
               <SelectItem value="secret_read" className="font-bold text-xs">Secret Access</SelectItem>
               <SelectItem value="secret_write" className="font-bold text-xs">Secret Update</SelectItem>
               <SelectItem value="project_create" className="font-bold text-xs">Project Create</SelectItem>
               <SelectItem value="member_add" className="font-bold text-xs">Member Add</SelectItem>
            </SelectContent>
         </Select>
      </Card>

      <Card className="rounded-xl bg-card border-border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="border-b border-border bg-muted/10 px-6 py-4 grid grid-cols-12 gap-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
               <div className="col-span-1">Op</div>
               <div className="col-span-3">Entity</div>
               <div className="col-span-5">Audit Details</div>
               <div className="col-span-3 text-right">Timestamp</div>
            </div>

            <div className="divide-y divide-border max-h-[800px] overflow-y-auto">
               {loading ? (
                  [1,2,3,4,5].map(i => (
                     <div key={i} className="px-6 py-4 grid grid-cols-12 gap-4 animate-pulse">
                        <div className="col-span-1 h-8 w-8 bg-muted/40 rounded-lg" />
                        <div className="col-span-3 h-8 w-40 bg-muted/40 rounded-lg" />
                        <div className="col-span-5 h-8 w-full bg-muted/40 rounded-lg" />
                        <div className="col-span-3 h-8 w-24 bg-muted/40 rounded-lg ml-auto" />
                     </div>
                  ))
               ) : filteredLogs.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                     <ShieldAlert size={48} className="mx-auto mb-4 text-primary" />
                     <p className="font-bold text-xl tracking-tight italic">No logs found.</p>
                  </div>
               ) : filteredLogs.map((log) => (
                  <div key={log.id} className="px-6 py-4 grid grid-cols-12 gap-4 hover:bg-muted/5 transition-colors group">
                     <div className="col-span-1">
                        <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm">
                           {getActionIcon(log.action)}
                        </div>
                     </div>
                     
                     <div className="col-span-3">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-xs">{log.actor_name || 'System'}</span>
                              <Badge className="text-[7px] px-1 py-0 font-bold h-3.5 uppercase bg-primary/5 text-primary border-primary/10">{log.project_name || 'System'}</Badge>
                           </div>
                           <div className="text-[9px] font-mono text-muted-foreground/40 mt-0.5 truncate">
                              {log.actor_email || 'internal'}
                           </div>
                        </div>
                     </div>

                     <div className="col-span-5">
                        <div className="flex flex-col gap-2">
                           <div className="text-xs font-bold tracking-tight text-foreground uppercase">
                              {log.action.replace(/_/g, ' ')}
                           </div>
                           {log.metadata && (
                              <div className="flex flex-wrap gap-1.5">
                                 {log.metadata.key && (
                                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                                       <Key size={10} /> {log.metadata.key}
                                    </div>
                                 )}
                                 {log.metadata.env && (
                                    <div className="flex items-center gap-1.5 bg-muted/30 text-muted-foreground border border-border px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest leading-none">
                                       <Globe size={10} /> {log.metadata.env}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="col-span-3 text-right">
                        <div className="flex flex-col">
                           <div className="text-[11px] font-bold text-foreground">
                              {new Date(log.created_at).toLocaleDateString()}
                           </div>
                           <div className="text-[9px] font-mono text-muted-foreground/30">
                              {new Date(log.created_at).toLocaleTimeString()}
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-muted/5 flex justify-center border-t border-border">
           <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">
              Secured Lifecycle // Immutable
           </div>
        </div>
      </Card>
    </div>
  );
}
