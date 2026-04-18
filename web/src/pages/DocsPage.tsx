import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Terminal,
  TerminalSquare,
  Users,
  Tags,
  Clock,
  Activity,
  Info,
  ShieldAlert
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
    <div className="my-6 overflow-hidden rounded-2xl border border-border bg-[#0f1115] text-zinc-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2.5">
        <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </span>
      </div>
      <pre className="scrollbar-none overflow-x-auto px-4 py-4 sm:px-6 sm:py-5 text-[12px] sm:text-[13px] leading-relaxed">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

function DocCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div className="relative z-10 mb-6 flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-muted-foreground italic">{description}</p>
        </div>
      </div>
      <div className="relative z-10 space-y-4 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </Card>
  );
}

function StepList({ steps }: { steps: Array<{ title: string; body: React.ReactNode }> }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-2xl border border-border bg-muted/5 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/10">
              {index + 1}
            </div>
            <h4 className="font-bold text-foreground">{step.title}</h4>
          </div>
          <div className="pl-0 sm:pl-10 text-sm">{step.body}</div>
        </div>
      ))}
    </div>
  );
}

function Callout({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warning" | "success";
  title: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === "warning"
      ? "border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-200"
      : tone === "success"
        ? "border-emerald-500/20 bg-emerald-500/5 text-foreground"
        : "border-border bg-muted/10 text-muted-foreground";

  const Icon = tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${styles}`}>
      <div className="mb-2 flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-primary" />
        <h4 className="font-bold">{title}</h4>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground border border-border/50 break-all">{children}</code>;
}

const sections: DocSection[] = [
  {
    id: "platform-overview",
    label: "Platform Overview",
    group: "General",
    icon: ShieldCheck,
    title: "How Synkrypt Works",
    description:
      "Synkrypt is built around projects, environments, and secure runtime injection. This guide explains the core workflow for managing secrets across your team.",
    body: (
      <>
        <p>
          Synkrypt simplifies configuration management by providing a centralized, project-first architecture based on a multi-tenant model. 
          <strong className="text-foreground"> Organizations</strong> are the primary cryptographic and operational boundary, allowing you to isolate different teams or clients on a single node.
        </p>
        <p className="mt-4 mb-2">
          Underneath, every <strong className="text-foreground"> Environment</strong> (such as <InlineCode>dev</InlineCode>, <InlineCode>staging</InlineCode>, or <InlineCode>prod</InlineCode>) receives its own set of isolated encryption keys. This guarantees that a breach in your development cluster cannot technically decipher production strings.
        </p>
        <p className="mb-6">
          <strong className="text-foreground"> The native CLI</strong> allows developers and CI/CD pipelines to inject these values directly into their applications at runtime. We bypass <InlineCode>.env</InlineCode> file creation entirely, injecting securely into <InlineCode>process.env</InlineCode> allocations in memory.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Create projects and nested environments from the dashboard.",
            "Use Access Presets to manage complex team permissions effortlessly.",
            "Secrets are AES-256 GCM encrypted at the edge; server routing is blind.",
            "Inject variables instantly using `synkrypt run -- <command>`.",
            "Cryptographically signed audit logs track every string access.",
            "Time-To-Live (TTL) expiration dates for temporary contractors.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-muted/5 px-4 py-3">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[13px] font-medium text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "deployment",
    label: "Deployment & Setup",
    group: "General",
    icon: TerminalSquare,
    title: "Platform Installation",
    description: "Synkrypt can be consumed as a Managed Cloud service or deployed entirely inside your own air-gapped infrastructure.",
    body: (
      <>
        <Callout tone="success" title="Path A: Managed Cloud (SaaS)">
           The easiest way to start securely. Download the lightweight CLI using the one-line installer, then link your workspace to the cloud backend.
           <br/><br/>
           <InlineCode>curl -fsSL https://synkrypt.abhilaksharora.com/install.sh | bash</InlineCode>
        </Callout>

        <div className="mt-8 mb-4 border-b border-border/50 pb-2">
           <h3 className="text-[15px] font-bold text-foreground">Path B: Enterprise Air-Gapped</h3>
           <p className="text-xs text-muted-foreground mt-1">Deploy the primary node in your own VPC. It does not communicate with external analytics or telemetry servers.</p>
        </div>

        <StepList
          steps={[
            {
              title: "Requirements",
              body: <p>Ensure <strong className="text-foreground">Bun v1.0+</strong> and <strong className="text-foreground">PostgreSQL 14+</strong> are installed.</p>,
            },
            {
              title: "Installation & Dependencies",
              body: <CodeBlock label="bash">{`git clone https://github.com/abhilaksh-arora/synkrypt.git\ncd synkrypt\nbun install`}</CodeBlock>,
            },
            {
              title: "Configuration",
              body: (
                <>
                  <p className="mb-2">Define your identity and security tokens in <InlineCode>server/.env</InlineCode>.</p>
                  <CodeBlock label="env">{`# Toggle public registration for SaaS mode\nPUBLIC_REGISTRATION_ENABLED=false\n\n# Security secrets\nSERVER_SECRET=<64_char_hex>\nJWT_SECRET=<64_char_hex>`}</CodeBlock>
                </>
              )
            },
            {
              title: "Start Platform Node",
              body: (
                <>
                  <p className="mb-2">Launch the API server and the Dashboard UI concurrently from the workspace root.</p>
                  <CodeBlock label="bash">{`# From workspace root\nbun run dev`}</CodeBlock>
                  <p>Dashboard Port: <InlineCode>http://localhost:5173</InlineCode><br />Server API Port: <InlineCode>http://localhost:2809</InlineCode></p>
                </>
              ),
            },
            {
              title: "Global CLI Compilation",
              body: (
                <>
                  <p className="mb-2">Make the <InlineCode>synkrypt</InlineCode> command globally accessible across your operating system.</p>
                  <CodeBlock label="bash">{`cd cli\nbun link`}</CodeBlock>
                </>
              ),
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "team-management",
    label: "Team Management",
    group: "Features",
    icon: Users,
    title: "Managing Team Members",
    description:
      "Provision access, assign roles, and handle offboarding with professional-grade governance tools.",
    body: (
      <>
        <Callout tone="neutral" title="Hierarchical Role Matrix">
           Synkrypt uses an organization-scoped permission model. <strong className="text-foreground">Owners</strong> have full operational control over the organization, its billing, and members. <strong className="text-foreground">Admins</strong> can manage all projects and provision access for team members. <strong className="text-foreground">Members</strong> can interact with specific projects they are explicitly assigned to.
        </Callout>
        <div className="mt-6" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/5 p-5 hover:bg-muted/10 transition-colors">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <Tags size={16} className="text-primary" /> Access Presets
            </h4>
            <p className="text-sm">
              Instead of manually toggling boxes for every developer, assign "Team Tags" (e.g., <InlineCode>Frontend-Dev</InlineCode> or <InlineCode>Backend-Lead</InlineCode>). These tags instantly provision environment clearance across multiple projects simultaneously.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/5 p-5 hover:bg-muted/10 transition-colors">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <Clock size={16} className="text-primary" /> Temporary TTL Access
            </h4>
            <p className="text-sm">
              Working with a freelancer? Set an expiration date (Time-To-Live). The moment the TTL hits zero, their session terminates and all their local ciphertexts are cryptographically invalidated by the server.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/5 p-5 hover:bg-muted/10 transition-colors">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <ShieldAlert size={16} className="text-rose-500" /> Instant Kill-switch
            </h4>
            <p className="text-sm">
              The Revoke feature allows administrators to instantly terminate an identity within an organization. The user is instantly removed from all organizational projects, their active WebSockets are disconnected, and session tokens are scrubbed.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/5 p-5 hover:bg-muted/10 transition-colors">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <Activity size={16} className="text-primary" /> Immutable Audit Logs
            </h4>
            <p className="text-sm">
              Synkrypt maintains a cryptographically chained ledger of events. Track every read, write, and access denial. Metadata includes IP addresses, timestamps, and the specific variables targeted.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "cli-usage",
    label: "CLI Usage",
    group: "Features",
    icon: Terminal,
    title: "Developer Workflow",
    description:
      "The day-to-day commands for engineers using Synkrypt in their local environment.",
    body: (
      <>
        <p className="mb-4">
           The CLI is designed to be language agnostic. It wraps your native commands and acts as a localized proxy, resolving encryptions in memory and passing plaintext variables only to the child process's mapped memory space.
        </p>
        <CodeBlock label="General Shell Commands">{`# Authenticate your terminal session with the node
synkrypt login

# Link your current directory to a Synkrypt project (creates .synkrypt directory)
synkrypt use <project-key>`}</CodeBlock>

        <CodeBlock label="Runtime Injection Examples">{`# Node.js Example
synkrypt run --env dev -- node src/index.js

# Python Example
synkrypt run --env prod -- python3 app.py

# Docker Compose Example
synkrypt run --env dev -- docker-compose up`}</CodeBlock>

        <Callout tone="success" title="Why We Avoid .env Files">
          While <InlineCode>synkrypt pull --env dev</InlineCode> exists for legacy support, we highly suggest using <InlineCode>synkrypt run</InlineCode>. <br/><br/>
          Runtime injection ensures that sensitive secrets never touch your hard drive. If a developers laptop is stolen, there are no plaintext <InlineCode>.env</InlineCode> files to extract from the disk partition.
        </Callout>
      </>
    ),
  },
  {
    id: "security-architecture",
    label: "Security Model",
    group: "Reference",
    icon: Lock,
    title: "Multi-Layered Encryption",
    description:
      "Synkrypt is built on a zero-knowledge security model where your sensitive data is always protected.",
    body: (
      <>
        <p className="mb-4">Synkrypt does not use simple symmetric encryption. It relies on a multi-tiered cryptographic derivation pipeline combining global root keys with strict project-level isolation.</p>
        <div className="space-y-4">
          {[
            { l: "Layer 1", t: "Server Root Key", d: "A master 64-character hex key generated at setup (via HKDF). This never rests in the database and must be provided via the backend environment. It encrypts all the children keys below it." },
            { l: "Layer 2", t: "Project Master Key (PMK)", d: "A unique 256-bit AES key generated whenever a new project is created. Isolating keys by project ensures a compromised environment token can only ever attempt to decrypt data within its specific project nexus." },
            { l: "Layer 3", t: "AES-256-GCM AEAD", d: "Each individual secret is encrypted using Advanced Encryption Standard in Galois/Counter Mode. This provides Authenticated Encryption with Associated Data, ensuring that not only is the secret unreadable, but any tampering with the ciphertext block is instantly detected and rejected." },
            { l: "Layer 4", t: "Personal Vault RSA", d: "Files and VPN configurations sent to your personal vault are hybrid-encrypted using your unique client-side RSA/ECDH keypair. The server does not have the private key required to open your personal vault." }
          ].map((layer) => (
            <div key={layer.l} className="p-5 rounded-2xl border border-border bg-muted/5 hover:bg-muted/10 transition-colors">
               <div className="text-sm font-bold uppercase tracking-widest text-primary mb-1">{layer.l}: {layer.t}</div>
               <p className="text-sm leading-relaxed">{layer.d}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

const groups = Array.from(new Set(sections.map((section) => section.group)));

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="max-w-4xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="size-3.5" />
            <span>Developer Reference</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Playbook</h1>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground italic">
            Safe management of secrets, team access, and project configurations.
          </p>
        </div>
      </header>

      <div className="grid gap-8 xl:gap-12 xl:grid-cols-[260px_1fr]">
        {/* Left Sidebar (Sticky Navigation) */}
        <aside className="hidden xl:block sticky top-6 self-start max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground/40 px-1">Documentation</p>
              <div className="space-y-8">
                {groups.map((group) => (
                  <div key={group}>
                    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-1.5 ml-1">{group}</p>
                    <div className="flex flex-col gap-1">
                      {sections
                        .filter((section) => section.group === group)
                        .map((section) => (
                          <a
                            key={section.id}
                            href={`#${section.id}`}
                            onClick={(e) => {
                               e.preventDefault();
                               document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted/50 hover:text-primary border border-transparent group"
                          >
                            <section.icon className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span>{section.label}</span>
                          </a>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </aside>

        {/* Right Content (Scrolls) */}
        <div className="min-w-0 max-w-4xl space-y-8 sm:space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <DocCard icon={section.icon} title={section.title} description={section.description}>
                {section.body}
              </DocCard>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
