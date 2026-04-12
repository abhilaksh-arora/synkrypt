import { 
  KeyRound, 
  ShieldCheck, TerminalSquare, Terminal,
  Lock, Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface DocSection {
  id: string;
  label: string;
  group: string;
  icon: any;
  title: string;
  description: string;
  body: React.ReactNode;
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-border/40 bg-[#0f1115] text-zinc-100 shadow-2xl my-6 font-sans">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-white/5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">
          {label}
        </span>
        <span className="text-[10px] text-zinc-500 font-mono uppercase">Read Only</span>
      </div>
      <pre className="overflow-x-auto px-6 py-5 text-[13px] leading-relaxed scrollbar-none">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

function DocCard({ icon: Icon, title, description, children }: { icon: any; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-3xl p-8 md:p-10 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <Icon size={120} />
      </div>
      <div className="mb-8 flex items-start gap-6 relative z-10 font-sans">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground font-medium">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-6 text-base leading-relaxed text-muted-foreground relative z-10 font-sans">{children}</div>
    </Card>
  );
}

const sections: DocSection[] = [
  {
    id: "vortex",
    label: "Synkrypt Infrastructure",
    group: "About",
    icon: ShieldCheck,
    title: "Vortex Infrastructure",
    description: "Synkrypt is a localized universal secrets manager designed for maximum security with zero external dependencies.",
    body: (
      <>
        <p>
          The Synkrypt architecture pivots to a project-centric encryption model. Every project generates a unique cryptographic Master Key upon creation, ensuring total isolation between repositories.
        </p>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          {[
            "AES-256-GCM Encryption at rest.",
            "Project-level Master Key derivation.",
            "Organization-scoped resource management.",
            "CLI-first runtime environment injection.",
            "Zero-plaintext storage in database logs.",
            "Bcrypt-hardened administrative access.",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/20 px-4 py-2.5 shadow-sm hover:bg-muted/30 transition-colors">
              <Zap className="size-3.5 text-primary shrink-0 opacity-50" />
              <p className="text-[11px] font-bold text-foreground tracking-tight">{item}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "deployment-protocol",
    label: "Deployment",
    group: "Run",
    icon: TerminalSquare,
    title: "Node Deployment",
    description: "Initialize your Synkrypt node for local development or production hosting.",
    body: (
      <>
        <p>Start by configuring your root environment variables for the core server and dashboard.</p>
        <CodeBlock label=".env">{`DATABASE_URL=postgresql://user:pass@localhost:5432/synkrypt
SERVER_SECRET=64_char_hex_string
JWT_SECRET=64_char_hex_string`}</CodeBlock>
        <p>Boot the entire stack using the unified development command:</p>
        <CodeBlock label="bash">{`# Start Synkrypt Ecosystem
bun run dev`}</CodeBlock>
      </>
    ),
  },
  {
    id: "cli-vortex",
    label: "CLI Nexus",
    group: "CLI",
    icon: Terminal,
    title: "CLI Nexus Workflow",
    description: "Connect your local terminal session to the Synkrypt vortex for seamless secret injection.",
    body: (
      <>
        <p>The CLI is your primary interface for interacting with secrets during development. It handles session management and real-time decryption injection.</p>
        <CodeBlock label="bash">{`# Authenticate Identity
synkrypt login

# Select Active Cluster
synkrypt use

# Execute with Injected Secrets
synkrypt run -- yarn dev`}</CodeBlock>
        <div className="rounded-[1.5rem] bg-muted/5 border border-border/30 p-8">
           <p className="font-bold text-foreground flex items-center gap-2 text-sm">
             <KeyRound size={14} className="text-primary" /> Runtime Decryption
           </p>
           <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80 lowercase italic font-medium">
             // Secrets are fetched and decrypted in memory just before your child process starts. They never touch your disk in plaintext `.env` files.
           </p>
        </div>
      </>
    ),
  },
  {
    id: "encryption-handshake",
    label: "Encryption",
    group: "Platform",
    icon: Lock,
    title: "Encryption Handshake",
    description: "Understanding the multi-layer security model that protects your cryptographic payloads.",
    body: (
      <>
        <p>Synkrypt uses a tiered encryption strategy to ensure that even a database leak does not expose your secrets.</p>
        <div className="space-y-3">
           <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
              <h5 className="font-bold text-[10px] uppercase tracking-widest text-primary mb-1">Layer 1: Server Secret</h5>
              <p className="text-xs font-medium">Encrypts all Project Master Keys stored in the database.</p>
           </div>
           <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
              <h5 className="font-bold text-[10px] uppercase tracking-widest text-primary mb-1">Layer 2: Project Master Key</h5>
              <p className="text-xs font-medium">A unique 256-bit key generated per project, used to encrypt actual secret values.</p>
           </div>
           <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
              <h5 className="font-bold text-[10px] uppercase tracking-widest text-primary mb-1">Layer 3: AES-256-GCM</h5>
              <p className="text-xs font-medium">Authenticated encryption for individual values, preventing tampering or bit-flipping.</p>
           </div>
        </div>
      </>
    ),
  },
];

const groups = Array.from(new Set(sections.map((section) => section.group)));

export default function DocsPage() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl font-sans">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-3">Technical Nexus</h2>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
          Master the protocols of Synkrypt protocols. Detailed guides on deployment, encryption models, and the CLI vortex workflow.
        </p>
      </div>

      <div className="grid gap-12 xl:grid-cols-[240px_1fr]">
        <aside className="xl:sticky xl:top-24 xl:self-start hidden xl:block font-sans">
          <div className="space-y-10 pl-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-6">Documentation Root</p>
              <div className="space-y-8">
                {groups.map((group) => (
                  <div key={group}>
                    <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-primary/60 border-l border-primary/20">
                      {group}
                    </p>
                    <div className="space-y-1 pl-3">
                      {sections
                        .filter((section) => section.group === group)
                        .map((section) => (
                          <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="flex items-center gap-3 py-1.5 text-xs text-muted-foreground transition-all hover:text-primary group"
                          >
                            <section.icon className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span className="font-bold tracking-tight">{section.label}</span>
                          </a>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-12 max-w-4xl">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <DocCard
                icon={section.icon}
                title={section.title}
                description={section.description}
              >
                {section.body}
              </DocCard>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
