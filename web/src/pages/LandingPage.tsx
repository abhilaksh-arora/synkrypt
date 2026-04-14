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
  Globe,
  BookOpen,
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
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tighter text-black">
              Synk<span className="text-primary">rypt</span>
            </span>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="/docs"
                className="text-sm font-bold text-black hover:opacity-70 transition-all flex items-center gap-2"
              >
                <BookOpen className="size-5" />
                Documentation
              </a>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold shadow-md bg-primary text-white hover:opacity-90 transition-all"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="rounded-full h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold shadow-md bg-primary text-white hover:opacity-90 transition-all"
                >
                  Login / Start <ArrowRight className="ml-1.5 size-3.5 sm:size-4" />
                </Button>
              )}

              <div className="h-4 w-px bg-black/20 mx-1" />

              <a
                href="https://github.com/abhilaksh-arora/synkrypt"
                target="_blank"
                rel="noreferrer"
                className="text-black hover:opacity-70 transition-all"
              >
                <svg viewBox="0 0 24 24" className="size-7 fill-current">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 flex flex-col items-center text-center relative z-10">
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

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-foreground mb-8">
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

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 w-full sm:w-auto">
            <Button
              onClick={() => navigate("/docs")}
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-10 rounded-full text-sm sm:text-base font-bold bg-primary text-white shadow-xl hover:opacity-90 hover:-translate-y-1 transition-all group"
            >
              <BookOpen className="size-5 sm:size-8 mr-2 sm:mr-3" />
              Read Documentation
            </Button>
            <Button
              onClick={() =>
                window.open(
                  "https://github.com/abhilaksh-arora/synkrypt",
                  "_blank",
                )
              }
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-10 rounded-full text-sm sm:text-base font-bold shadow-xl bg-black text-white hover:bg-black/90 hover:-translate-y-1 transition-all group"
            >
              <svg viewBox="0 0 24 24" className="size-6 sm:size-10 mr-2 sm:mr-3 fill-current">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Star on GitHub
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left"
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
              <a
                href="https://abhilaksharora.com"
                title="Website"
                className="hover:text-primary transition-colors"
              >
                <Globe className="size-6" />
              </a>
              <a
                href="https://abhilaksharora.com/github"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
                className="hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="size-6 fill-current">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://abhilaksharora.com/linkedin"
                target="_blank"
                rel="noreferrer"
                title="LinkedIn"
                className="hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="size-6 fill-current">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.7 2.7 0 0 0-2.7-2.7c-1.2 0-2.3.7-2.8 1.7v-1.4h-2.1v7.7h2.1v-4.1c0-.4 0-.8.1-1.1.2-.5.7-1 1.4-1 1 0 1.4.8 1.4 2v4.2h2.2M7 10.1a1.1 1.1 0 0 0-1.2 1.1c0 .6.5 1.1 1.2 1.1s1.2-.5 1.2-1.1c0-.6-.5-1.1-1.2-1.1M5.9 18.5h2.2v-7.7H5.9v7.7z" />
                </svg>
              </a>
              <a
                href="https://abhilaksharora.com/x"
                target="_blank"
                rel="noreferrer"
                title="X"
                className="hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="size-6 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
