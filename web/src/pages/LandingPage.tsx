import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  LockKeyhole,
  Terminal,
  Key,
  ShieldCheck,
  ArrowRight,
  Book,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-svh bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-foreground">
              Synk<span className="text-primary">rypt</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="rounded-full h-10 px-6 font-bold shadow-md hover:-translate-y-0.5 transition-all"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                className="rounded-full h-10 px-6 font-bold shadow-md hover:-translate-y-0.5 transition-all"
              >
                Login / Start <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">
              Synkrypt Protocol Live
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-foreground mb-8">
            The Zero-Trust Secrets
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Infrastructure.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed italic mb-10">
            End-to-end encrypted environment variable management for modern
            engineering teams. Deploy configs with absolute confidence. We never
            store your plaintext secrets.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full sm:w-auto">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="h-13 px-8 rounded-full text-sm font-bold shadow-xl hover:-translate-y-1 transition-all group"
            >
              Deploy Node{" "}
              <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/docs")}
              variant="outline"
              size="lg"
              className="h-13 px-8 rounded-full text-sm font-bold bg-background shadow-sm hover:shadow-md hover:bg-muted/50 border-border group hover:-translate-y-1 transition-all"
            >
              <Book className="mr-2 size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              Read playbooks
            </Button>
            <Button
              onClick={() => window.open('https://github.com/abhilaksh-arora/synkrypt', '_blank')}
              variant="outline"
              size="lg"
              className="h-13 px-8 rounded-full text-sm font-bold shadow-sm hover:shadow-md bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white group hover:-translate-y-1 transition-all"
            >
              <svg viewBox="0 0 24 24" className="size-4 mr-2" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub Source
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
        >
          <div className="p-8 rounded-3xl bg-card border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] group hover:shadow-md hover:border-primary/20 transition-all">
            <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
              <ShieldCheck className="size-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-3">
              Absolute Zero Trust
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              Variables are encrypted locally using AES-256 GCM before ever
              touching the network. Our servers route ciphertexts anonymously.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] group hover:shadow-md hover:border-blue-500/20 transition-all">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/5 text-blue-500 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors">
              <Terminal className="size-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-3">
              Native CLI Injection
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              Wrap any standard command with the Synkrypt CLI to securely inject
              secrets directly into memory. No .env files required.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] group hover:shadow-md hover:border-amber-500/20 transition-all">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/5 text-amber-500 flex items-center justify-center mb-6 group-hover:bg-amber-500/10 transition-colors">
              <Key className="size-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-3">
              Enterprise Access
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              Granular Role-Based Access Control and isolated Personal Vaults
              ensure keys only reach authorized machines and personnel.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Soft Footer */}
      <footer className="border-t border-border/40 py-12 mt-auto relative z-10 bg-muted/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-sm font-bold text-muted-foreground/60">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="uppercase tracking-widest opacity-70 text-[10px]">
                Project Maintainer
              </span>
              <a
                href="https://abhilaksharora.com"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                Developed & Managed by Abhilaksh Arora
              </a>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
              <span className="uppercase tracking-widest opacity-70 text-[10px]">
                Community & Support
              </span>
              <a
                href="mailto:abhilaksharora@gmail.com?subject=Synkrypt%20Feature%20Request"
                className="text-foreground hover:text-primary transition-colors"
              >
                Feature Requests & Feedback Email
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-6 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
            <span>
              © {new Date().getFullYear()} Synkrypt. All rights reserved.
            </span>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-primary transition-colors">
                Website
              </a>
              <a
                href="https://github.com/abhilaksh"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/abhilaksharora"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
