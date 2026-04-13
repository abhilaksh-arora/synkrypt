import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Briefcase, FileText, Download, Eye, EyeOff, 
  ShieldCheck, 
  Search, Loader2, Info, Lock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function VaultPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<string, string | null>>({});
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await api.listMyAssets();
      setAssets(data.assets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    if (revealed[id]) {
      setRevealed(prev => ({ ...prev, [id]: null }));
      return;
    }
    setViewing(id);
    try {
      const data = await api.getAsset(id);
      setRevealed(prev => ({ ...prev, [id]: data.value }));
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to decrypt asset.", variant: "destructive" });
    } finally {
      setViewing(null);
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const data = await api.getAsset(id);
      const blob = new Blob([data.value], { type: data.metadata?.mime || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || data.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Asset Downloaded", description: filename });
    } catch (err) {
      toast({ title: "Error", description: "Download failed.", variant: "destructive" });
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] mb-2">
             <Lock className="size-3" />
             Personal Security Store
           </div>
           <h2 className="text-4xl font-bold tracking-tighter text-foreground">My Vault</h2>
           <p className="text-muted-foreground mt-2 max-w-xl">
              Access credentials and assets issued specifically to your identity. 
              These are not tied to any project and are for your personal use.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="p-8 rounded-3xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Stored Assets</p>
               <h4 className="text-4xl font-bold tracking-tight">{assets.length}</h4>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
               <Briefcase className="size-8" />
            </div>
         </Card>
         <Card className="p-8 rounded-3xl bg-card border-border flex items-center justify-between group shadow-sm">
            <div>
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Security Status</p>
               <h4 className="text-4xl font-bold tracking-tight text-emerald-500">Protected</h4>
            </div>
             <div className="h-16 w-16 rounded-2xl bg-emerald-500/5 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="size-8" />
             </div>
         </Card>
      </div>

      <Card className="rounded-3xl bg-card border-border shadow-sm overflow-hidden relative">
        <div className="p-10 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/5">
           <div className="relative w-full md:max-w-lg group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input 
                 placeholder="Search your vault..." 
                 className="pl-12 h-14 rounded-xl bg-background border-border focus:ring-primary/20 transition-all font-medium"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="py-6 pl-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 w-[40%]">Asset Identity</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 w-[40%]">Payload Preview</TableHead>
                <TableHead className="text-right pr-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 w-[20%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3].map(i => (
                  <TableRow key={i} className="border-border animate-pulse">
                    <TableCell className="pl-12 py-8"><div className="h-14 w-64 bg-muted/40 rounded-xl" /></TableCell>
                    <TableCell><div className="h-10 w-full bg-muted/40 rounded-xl" /></TableCell>
                    <TableCell className="pr-12 text-right"><div className="h-10 w-32 bg-muted/40 rounded-xl ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-80 text-center">
                     <div className="flex flex-col items-center justify-center opacity-30">
                        <Briefcase size={64} className="mb-6 text-primary" />
                        <p className="font-bold text-2xl tracking-tight italic">Your vault is empty.</p>
                        <p className="text-sm mt-2">Assets issued by admins will appear here.</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.map(asset => (
                <TableRow key={asset.id} className="border-border group hover:bg-muted/5 transition-colors">
                  <TableCell className="pl-12">
                     <div className="flex items-center gap-5 py-6">
                        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shadow-sm ${
                           asset.type === 'file' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' :
                           asset.type === 'vpn' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                           'bg-primary/5 text-primary border-primary/10'
                        }`}>
                           <FileText size={24} />
                        </div>
                        <div>
                           <div className="font-bold text-foreground text-lg tracking-tight">{asset.name}</div>
                           <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="px-1.5 py-0 text-[8px] uppercase">{asset.type}</Badge>
                              {asset.metadata?.filename && <span>• {asset.metadata.filename}</span>}
                           </div>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-4">
                        <div className={`flex-1 min-h-12 flex items-center px-4 py-2 rounded-xl border font-mono text-xs transition-all shadow-inner max-w-md overflow-hidden ${
                           revealed[asset.id] ? 'bg-background border-primary/20 text-foreground' : 'bg-muted/30 border-border text-muted-foreground/30'
                        }`}>
                           {revealed[asset.id] ? (
                              <div className="whitespace-pre overflow-hidden text-ellipsis">
                                 {revealed[asset.id]}
                              </div>
                           ) : (
                              '••••••••••••••••••••••••••••••••••••••••'
                           )}
                        </div>
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           disabled={viewing === asset.id}
                           className="h-10 w-10 rounded-lg hover:bg-background shadow-sm border border-transparent hover:border-border"
                           onClick={() => handleView(asset.id)}
                        >
                           {viewing === asset.id ? <Loader2 className="animate-spin size-4" /> : revealed[asset.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-lg font-bold text-xs h-10 px-4 border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
                        onClick={() => handleDownload(asset.id, asset.metadata?.filename || asset.name)}
                     >
                        <Download className="size-4 mr-2" /> Download
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-8 bg-muted/5 flex justify-center border-t border-border">
           <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
              <Info className="size-4" /> Secure Identity Store // Encrypted with Server Root
           </div>
        </div>
      </Card>
    </div>
  );
}
