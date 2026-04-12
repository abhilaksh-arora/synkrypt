import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  ShieldAlert, Fingerprint, Calendar, 
  Terminal, Search, Loader2, RefreshCcw,
  ArrowUpRight, AlertCircle, Database
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.listAuditLogs();
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const criticalActions = ['project_delete', 'org_member_remove', 'secret_read', 'member_remove'];
    const isCritical = criticalActions.includes(action);
    
    return (
      <Badge className={`rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider border-none ${
        isCritical ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      }`}>
        {action.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    (l.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
             <ShieldAlert className="size-3" />
             Security Governance Nexus
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground">Audit Logs</h2>
        </div>
        <Button 
          variant="outline" 
          onClick={loadLogs} 
          disabled={loading}
          className="rounded-xl border-border/40 hover:bg-muted font-bold"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCcw className="mr-2 size-4" />}
          Refresh Stream
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-8 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Total Operations</p>
               <h4 className="text-4xl font-black mt-1 tracking-tighter">{logs.length}</h4>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
               <Terminal className="size-6" />
            </div>
         </Card>
         <Card className="p-8 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Identity Handshakes</p>
               <h4 className="text-4xl font-black mt-1 tracking-tighter">{logs.filter(l => l.action === 'login').length}</h4>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-amber-500/5 text-amber-500 flex items-center justify-center">
               <Fingerprint className="size-6" />
            </div>
         </Card>
         <Card className="p-8 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-border/40 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Secret Injections</p>
               <h4 className="text-4xl font-black mt-1 tracking-tighter">{logs.filter(l => l.action === 'secret_read' || l.action === 'secret_write').length}</h4>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-500/5 text-blue-500 flex items-center justify-center">
               <Database className="size-6" />
            </div>
         </Card>
      </div>

      <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/40 shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input 
                 placeholder="Search by identity, action, or context..." 
                 className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/10 hover:bg-transparent">
                <TableHead className="py-5 pl-10 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Operation Pulse</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Identity Context</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Protocol Level</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Metadata Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i} className="border-border/10 animate-pulse">
                    <TableCell className="pl-10"><div className="h-4 w-32 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell><div className="h-10 w-40 bg-muted/40 rounded-xl" /></TableCell>
                    <TableCell><div className="h-6 w-24 bg-muted/40 rounded-lg" /></TableCell>
                    <TableCell><div className="h-4 w-60 bg-muted/40 rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                         <AlertCircle className="size-12 opacity-10" />
                         <p className="font-bold tracking-tight lowercase italic">No cryptographic pulses detected in this range.</p>
                      </div>
                   </TableCell>
                </TableRow>
              ) : filteredLogs.map(l => (
                <TableRow key={l.id} className="border-border/10 group hover:bg-muted/10 transition-colors">
                  <TableCell className="pl-10">
                     <div className="flex items-center gap-3 text-sm font-medium">
                        <Calendar className="size-3.5 opacity-40" />
                        <span className="text-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
                        <span className="text-muted-foreground/60 text-xs">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-background border border-border/40 flex items-center justify-center text-primary text-[10px] font-black">
                           {l.user_name?.charAt(0) || '?'}
                        </div>
                        <div>
                           <div className="font-bold text-sm">{l.user_name || 'System'}</div>
                           <div className="text-[10px] text-muted-foreground font-mono">{l.user_email}</div>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell>
                     {getActionBadge(l.action)}
                  </TableCell>
                  <TableCell>
                     <div className="flex items-start gap-3 max-w-sm">
                        <div className="text-xs text-muted-foreground/80 leading-relaxed italic">
                           {l.details || 'Baseline operation.'}
                        </div>
                        {l.project_name && (
                           <Badge variant="outline" className="shrink-0 rounded-md bg-muted/30 border-border/20 text-[9px] uppercase font-black tracking-tight">
                              <ArrowUpRight className="size-2 mr-1" /> {l.project_name}
                           </Badge>
                        )}
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
