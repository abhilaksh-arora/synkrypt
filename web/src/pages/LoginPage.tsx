import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LockKeyhole, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isSetup, setIsSetup] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    if (user) { navigate('/'); return; }
    api.setupStatus()
      .then(d => setIsSetup(d.needsSetup))
      .catch(() => setError("Backend unavailable"))
      .finally(() => setInitLoading(false));
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSetup) {
        await api.register({ email: form.email, name: form.name, password: form.password });
      }
      await login(form.email, form.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center relative overflow-hidden p-6 font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10"
      >
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 text-primary-foreground transform active:scale-95 transition-transform">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-foreground leading-none">Synk<span className="text-primary">rypt</span></h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 font-bold mt-2 ml-1">Universal Secrets Infrastructure</p>
          </div>
        </div>

        <Card className="rounded-3xl p-2 shadow-2xl border-border/40 bg-card/60 backdrop-blur-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <CardHeader className="space-y-2 pb-8 pt-8">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
              {isSetup ? 'System Bootstrap' : 'Vortex Login'}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              {isSetup ? "Define the root administrator identity for this node." : "Verify your identity to access secured environments."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="auth-form" onSubmit={handleSubmit} className="space-y-6">
              {isSetup && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Administrator Name</Label>
                  <Input
                    id="name"
                    placeholder="Major Tom"
                    className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Neural ID (Email)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tom@synkrypt.io"
                  className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all font-mono"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Key</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  className="h-12 rounded-2xl bg-muted/30 border-border/40 px-4 focus:bg-background transition-all font-mono"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert variant="destructive" className="rounded-2xl bg-destructive/5 border-destructive/20 py-4">
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </form>
          </CardContent>

          <CardFooter className="pt-2 pb-8">
            <Button 
              form="auth-form" 
              type="submit" 
              className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 bg-primary hover:opacity-90 active:scale-[0.98] transition-all group" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" /> : (
                <>
                  {isSetup ? 'Bootstrap System' : 'Authenticate Identity'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-8 text-muted-foreground/40 text-xs font-mono">
          SECURE PROTOCOL V2.0 // AES-256-GCM ENCRYPTED
        </div>
      </motion.div>
    </div>
  );
}
