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
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </span>
      </div>
      <pre className="scrollbar-none overflow-x-auto px-6 py-5 text-[13px] leading-relaxed">
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
    <Card className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="relative z-10 mb-6 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
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
        <div key={step.title} className="rounded-2xl border border-border bg-muted/5 p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/10">
              {index + 1}
            </div>
            <h4 className="font-bold text-foreground">{step.title}</h4>
          </div>
          <div className="pl-10 text-sm">{step.body}</div>
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
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <div className="mb-2 flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-primary" />
        <h4 className="font-bold">{title}</h4>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground border border-border/50">{children}</code>;
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
          Synkrypt simplifies configuration management by providing a centralized, project-first architecture. 
          <strong className="text-foreground"> Projects</strong> are the primary security boundary. 
          <strong className="text-foreground"> Environments</strong> categorize secrets into <InlineCode>dev</InlineCode>, <InlineCode>staging</InlineCode>, and <InlineCode>prod</InlineCode>.
          <strong className="text-foreground"> The CLI</strong> allows developers to inject these values directly into their applications without storing them in plaintext on disk.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Create projects directly from your dashboard.",
            "Use Access Presets to manage team permissions in one click.",
            "Secrets are encrypted at the edge; we never see your plaintext data.",
            "Inject variables at runtime using the Synkrypt CLI.",
            "Audit logs track every configuration change and access event.",
            "Set expiration dates for temporary team members or contractors.",
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
    id: "local-setup",
    label: "Local Setup",
    group: "General",
    icon: TerminalSquare,
    title: "Server & CLI Setup",
    description:
      "Get the Synkrypt platform running on your local machine or server infrastructure.",
    body: (
      <>
        <StepList
          steps={[
            {
              title: "Requirements",
              body: (
                <p>
                  Ensure you have <strong className="text-foreground">Bun</strong> and <strong className="text-foreground">PostgreSQL</strong> installed.
                </p>
              ),
            },
            {
              title: "Installation",
              body: (
                <CodeBlock label="bash">{`git clone https://github.com/abhilaksh/synkrypt.git
cd synkrypt
bun install`}</CodeBlock>
              ),
            },
            {
              title: "Database Initialization",
              body: (
                <>
                  <p>Run the migration script to set up the V3.5 schema.</p>
                  <CodeBlock label="bash">{`cd server
bun run src/db/migrate.ts`}</CodeBlock>
                </>
              ),
            },
            {
              title: "Start Platform",
              body: (
                <>
                  <CodeBlock label="bash">{`# From root
bun run dev`}</CodeBlock>
                  <p>
                    Dashboard: <InlineCode>http://localhost:5173</InlineCode><br />
                    Server API: <InlineCode>http://localhost:2809</InlineCode>
                  </p>
                </>
              ),
            },
            {
              title: "Global CLI",
              body: (
                <CodeBlock label="bash">{`cd cli
bun link`}</CodeBlock>
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/5 p-5">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <Tags size={16} className="text-primary" /> Access Presets
            </h4>
            <p className="text-sm">
              Use "Team Tags" like Senior Dev or Product Manager to apply standard environment clearances automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/5 p-5">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <Clock size={16} className="text-primary" /> Temporary Access
            </h4>
            <p className="text-sm">
              Set expiration dates (TTL) for contractors or short-term project roles. Access is automatically revoked.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/5 p-5">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <ShieldAlert size={16} className="text-rose-500" /> Global Revoke
            </h4>
            <p className="text-sm">
              Instantly remove a user from all projects and clusters using the global offboarding protocol.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/5 p-5">
            <h4 className="mb-2 font-bold text-foreground flex items-center gap-2">
               <Activity size={16} className="text-primary" /> Audit Logs
            </h4>
            <p className="text-sm">
              Track every read and write operation with detailed metadata, including the specific key and timestamp.
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
        <CodeBlock label="CLI Commands">{`# Login to your account
synkrypt login

# Link your local folder to a project
synkrypt use <project-key>

# Inject variables into your app
synkrypt run --env dev -- bun run dev

# Sync viewable variables to .env
synkrypt pull --env dev`}</CodeBlock>

        <Callout tone="success" title="Safe Injection">
          Always prefer <InlineCode>synkrypt run</InlineCode> over <InlineCode>synkrypt pull</InlineCode>. Runtime injection ensures that sensitive secrets never touch your hard drive in plaintext.
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
        <div className="space-y-4">
          {[
            { l: "Layer 1", t: "Server Secret", d: "A global hex key that protects project-level master keys in the database." },
            { l: "Layer 2", t: "Project Master Key", d: "A unique 256-bit key generated for every project nexus." },
            { l: "Layer 3", t: "AES-256-GCM", d: "Each secret value is individually encrypted using authenticated encryption." },
          ].map((layer) => (
            <div key={layer.l} className="p-5 rounded-2xl border border-border bg-muted/5">
               <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{layer.l}: {layer.t}</div>
               <p className="text-sm">{layer.d}</p>
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
      <header className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="max-w-4xl space-y-3">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="size-3.5" />
            <span>Developer Reference</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Playbook</h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground italic">
            Safe management of secrets, team access, and project configurations.
          </p>
        </div>
      </header>

      <div className="grid gap-12 xl:grid-cols-[260px_1fr]">
        {/* Left Sidebar (Sticky Navigation) */}
        <aside className="hidden xl:block">
          <div className="sticky top-[72px] space-y-8 rounded-2xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur-sm">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1">Documentation</p>
              <div className="space-y-8">
                {groups.map((group) => (
                  <div key={group}>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-1.5 ml-1">{group}</p>
                    <div className="flex flex-col gap-1">
                      {sections
                        .filter((section) => section.group === group)
                        .map((section) => (
                          <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-background hover:text-primary border border-transparent hover:border-border group"
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
          </div>
        </aside>

        {/* Right Content (Scrolls) */}
        <div className="max-w-4xl space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
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
