import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Terminal, Building2, Key } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-12">
      <div className="max-w-3xl">
        <h2 className="text-xl font-bold text-primary mb-2">Welcome back, {user?.name}</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Manage your universal secrets infrastructure. Run your apps with encrypted environment injection and zero plaintext exposure.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border-border/40 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.3)] hover:shadow-[0_40px_100px_-48px_rgba(var(--primary),0.2)] transition-all group cursor-default">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Building2 className="size-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">Organizations</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">Manage separate workspaces for different teams or clients.</p>
          <Button asChild variant="outline" className="rounded-xl h-11 px-6 font-bold border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
            <Link to="/orgs">View Workspace</Link>
          </Button>
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border-border/40 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.3)] hover:shadow-[0_40px_100px_-48px_rgba(var(--primary),0.2)] transition-all group cursor-default">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Terminal className="size-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">CLI Access</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">Connect your local terminal to the secure vortex.</p>
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-border/60 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all">
            `synkrypt login`
          </Button>
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border-border/40 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.3)] hover:shadow-[0_40px_100px_-48px_rgba(var(--primary),0.2)] transition-all group cursor-default">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Key className="size-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">Documentation</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">Master the secrets management workflow and rules.</p>
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-border/60 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
            Read Docs
          </Button>
        </Card>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 mt-12">
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="size-5 text-primary" />
            Vortex Quick Setup
          </h3>
          <div className="space-y-4">
             {[
               { t: "1. Create Organization", d: "Set up a shared workspace for your team and repositories." },
               { t: "2. Add Project", d: "Link a specific microservice or application to your workspace." },
               { t: "3. CLI Login", d: "Run 'synkrypt login' to authenticate your local machine." },
               { t: "4. Inject Secrets", d: "Run 'synkrypt run -- yarn dev' to auto-inject your secrets." },
             ].map((step, i) => (
               <div key={i} className="flex gap-4 p-5 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors">
                 <div className="font-black text-2xl opacity-10 select-none">0{i+1}</div>
                 <div>
                   <h4 className="font-bold text-foreground">{step.t}</h4>
                   <p className="text-sm text-muted-foreground mt-1">{step.d}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-muted/10 rounded-[3rem] p-10 border border-border/20 flex flex-col justify-center items-center text-center">
            <ShieldCheck className="size-20 text-primary mb-6 opacity-20" />
            <h3 className="text-2xl font-bold tracking-tight mb-4">Zero Knowledge Architecture</h3>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                Secrets are encrypted at rest with project-specific master keys and decrypted only at the edge or within the CLI runtime.
            </p>
        </div>
      </div>
    </div>
  );
}
