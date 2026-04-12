import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  ShieldCheck,
  Terminal,
  TerminalSquare,
  Users,
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
    <div className="my-6 overflow-hidden rounded-[1.35rem] border border-border/40 bg-[#0f1115] text-zinc-100 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </span>
        <span className="font-mono text-[10px] uppercase text-zinc-500">Read Only</span>
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
    <Card className="group relative overflow-hidden rounded-[2rem] border border-border/30 bg-card/35 p-7 shadow-xl shadow-primary/5 backdrop-blur-3xl md:p-9">
      <div className="absolute right-0 top-0 p-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
        <Icon size={120} />
      </div>
      <div className="relative z-10 mb-8 flex items-start gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="relative z-10 space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </Card>
  );
}

function StepList({ steps }: { steps: Array<{ title: string; body: React.ReactNode }> }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
              {index + 1}
            </div>
            <h4 className="font-bold text-foreground">{step.title}</h4>
          </div>
          <div className="pl-10">{step.body}</div>
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
      ? "border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200"
      : tone === "success"
        ? "border-primary/20 bg-primary/5 text-foreground"
        : "border-border/25 bg-muted/15 text-muted-foreground";

  const Icon = tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle2 : ShieldCheck;

  return (
    <div className={`rounded-[1.5rem] border p-5 ${styles}`}>
      <div className="mb-2 flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-primary" />
        <h4 className="font-bold">{title}</h4>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">{children}</code>;
}

const sections: DocSection[] = [
  {
    id: "platform-overview",
    label: "Platform Overview",
    group: "Start Here",
    icon: ShieldCheck,
    title: "How Synkrypt Is Organized",
    description:
      "Synkrypt is built around organizations, projects, environments, and runtime injection. This page explains the real operator flow for admins and the day-to-day flow for developers.",
    body: (
      <>
        <p>
          The platform has four main layers. <strong className="text-foreground">Organizations</strong> group people and projects.
          <strong className="text-foreground"> Projects</strong> are the main security boundary and each project has its own project key.
          <strong className="text-foreground"> Environments</strong> split secrets into <InlineCode>dev</InlineCode>, <InlineCode>staging</InlineCode>, and <InlineCode>prod</InlineCode>.
          <strong className="text-foreground"> The CLI</strong> links a local repository to a project and injects secrets into a process when needed.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Admins create organizations, create projects, add members, and manage access.",
            "Developers link their local repo to a project using the project key from the dashboard.",
            "Viewable secrets can be pulled into a local .env file with the CLI.",
            "All secrets can be injected at runtime with synkrypt run, including restricted values.",
            "Project membership and environment access are controlled from the dashboard.",
            "Project secrets are isolated per project so one project does not expose another.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-[1.25rem] border border-border/20 bg-muted/10 px-4 py-3">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[13px] font-medium text-foreground">{item}</p>
            </div>
          ))}
        </div>

        <Callout title="Recommended mental model">
          Start as an admin from the dashboard. Create the org, create the project, add team members, add secrets, and then hand the project key to developers so they can link the local repository with the CLI.
        </Callout>
      </>
    ),
  },
  {
    id: "local-setup",
    label: "Local Setup",
    group: "Start Here",
    icon: TerminalSquare,
    title: "Install And Run Synkrypt Locally",
    description:
      "This is the fastest way to bring up the system for local development, verify the dashboard, and make the CLI available on your machine.",
    body: (
      <>
        <StepList
          steps={[
            {
              title: "Install prerequisites",
              body: (
                <p>
                  You need <strong className="text-foreground">Bun</strong> and <strong className="text-foreground">PostgreSQL</strong> available locally.
                  The monorepo uses Bun workspaces and Turbo.
                </p>
              ),
            },
            {
              title: "Clone the repository and install packages",
              body: (
                <CodeBlock label="bash">{`git clone https://github.com/abhilaksh/synkrypt.git
cd synkrypt
bun install`}</CodeBlock>
              ),
            },
            {
              title: "Configure the server environment",
              body: (
                <>
                  <p>Set these variables in <InlineCode>server/.env</InlineCode> before starting the backend.</p>
                  <CodeBlock label="server/.env">{`PORT=2809
DATABASE_URL=postgresql://user:pass@localhost:5432/synkrypt
SERVER_SECRET=64_char_hex_string
JWT_SECRET=64_char_hex_string`}</CodeBlock>
                </>
              ),
            },
            {
              title: "Start the platform",
              body: (
                <>
                  <p>The monorepo root script starts the app stack for development.</p>
                  <CodeBlock label="bash">{`bun run dev`}</CodeBlock>
                  <p>
                    The dashboard is available at <InlineCode>http://localhost:5173</InlineCode>. The CLI and frontend talk to the server at <InlineCode>http://localhost:2809</InlineCode> by default.
                  </p>
                </>
              ),
            },
            {
              title: "Install the CLI command globally",
              body: (
                <CodeBlock label="bash">{`cd cli
bun link`}</CodeBlock>
              ),
            },
          ]}
        />

        <Callout tone="warning" title="Before onboarding a team">
          Make sure the server is reachable from the machines that will use the CLI. If the backend is not running or the URL is wrong, login, pull, and runtime injection will all fail.
        </Callout>
      </>
    ),
  },
  {
    id: "admin-workflow",
    label: "Admin Workflow",
    group: "Roles",
    icon: Building2,
    title: "Admin Guide: From Empty Workspace To Working Project",
    description:
      "This section is for admins and maintainers who set up the workspace, organize teams, create projects, and control who can access which environments.",
    body: (
      <>
        <StepList
          steps={[
            {
              title: "Create an organization",
              body: (
                <p>
                  Open the <InlineCode>/orgs</InlineCode> page and create a new organization. This is the top-level workspace that will contain members and projects.
                </p>
              ),
            },
            {
              title: "Open the organization and add members",
              body: (
                <p>
                  On the organization detail page, use <strong className="text-foreground">Manage Members</strong> to add the people who should participate in that workspace. This gives them organization membership so they can later be added to individual projects.
                </p>
              ),
            },
            {
              title: "Create a project inside the organization",
              body: (
                <p>
                  Use <strong className="text-foreground">New Project</strong> from the organization page. Each project gets its own project key and acts as the main boundary for project secrets.
                </p>
              ),
            },
            {
              title: "Open the project and note the project key",
              body: (
                <p>
                  In the project detail view, copy the <strong className="text-foreground">Project Key</strong>. Developers will use this in the CLI command <InlineCode>synkrypt use &lt;project-key&gt;</InlineCode> to link their local repository.
                </p>
              ),
            },
            {
              title: "Add project members and grant environment access",
              body: (
                <p>
                  In the <strong className="text-foreground">Team Members</strong> tab, add users to the project and assign environment clearance such as <InlineCode>dev</InlineCode>, <InlineCode>staging</InlineCode>, or <InlineCode>prod</InlineCode>. This determines where they can operate.
                </p>
              ),
            },
            {
              title: "Create secrets for each environment",
              body: (
                <p>
                  In the <strong className="text-foreground">Secrets Nexus</strong> tab, switch to the target environment and add secrets one by one or use bulk import to paste a full <InlineCode>.env</InlineCode> payload.
                </p>
              ),
            },
            {
              title: "Choose whether a secret is viewable in the dashboard",
              body: (
                <p>
                  If a secret is marked as viewable, developers can pull it into a local <InlineCode>.env</InlineCode> file. If it is restricted, it will be omitted from <InlineCode>synkrypt pull</InlineCode> and only injected at runtime through <InlineCode>synkrypt run</InlineCode>.
                </p>
              ),
            },
            {
              title: "Promote secrets between environments carefully",
              body: (
                <p>
                  Use the project’s <strong className="text-foreground">Sync Env</strong> action when you want to copy values from one environment to another. This can overwrite duplicates, so treat it like a deployment action rather than a casual edit.
                </p>
              ),
            },
          ]}
        />

        <Callout tone="success" title="Admin handoff checklist">
          Before telling a developer to start, confirm that they are an organization member, a project member, have the right environment clearance, and have received the correct project key for the repository they are working in.
        </Callout>
      </>
    ),
  },
  {
    id: "developer-workflow",
    label: "Developer Workflow",
    group: "Roles",
    icon: Terminal,
    title: "Developer Guide: Link, Pull, And Run",
    description:
      "This section is for developers who need to connect a local repository to Synkrypt and use secrets safely during local work, test runs, or build steps.",
    body: (
      <>
        <StepList
          steps={[
            {
              title: "Install the CLI if it is not already linked",
              body: <CodeBlock label="bash">{`cd cli
bun link`}</CodeBlock>,
            },
            {
              title: "Log in from your terminal",
              body: (
                <>
                  <p>
                    Use the credentials provided for your Synkrypt account. The command accepts flags, or it can prompt for them interactively.
                  </p>
                  <CodeBlock label="bash">{`synkrypt login
# or
synkrypt login --email you@company.com --password your-password`}</CodeBlock>
                </>
              ),
            },
            {
              title: "Verify your identity",
              body: <CodeBlock label="bash">{`synkrypt whoami`}</CodeBlock>,
            },
            {
              title: "Go to your repository and link it to the project",
              body: (
                <>
                  <p>
                    Your admin will provide the project key from the dashboard. Run the command from the root of the application repository you want to connect.
                  </p>
                  <CodeBlock label="bash">{`cd /path/to/your-app
synkrypt use <project-key>`}</CodeBlock>
                  <p>
                    This creates local config inside <InlineCode>.synkrypt</InlineCode> and, when possible, adds <InlineCode>.synkrypt</InlineCode> to <InlineCode>.gitignore</InlineCode>.
                  </p>
                </>
              ),
            },
            {
              title: "Pull viewable secrets when you need a local .env file",
              body: (
                <CodeBlock label="bash">{`synkrypt pull --env dev`}</CodeBlock>
              ),
            },
            {
              title: "Run commands with full runtime injection",
              body: (
                <>
                  <p>
                    This is the safest default because it injects all permitted secrets into the child process, including restricted secrets that are intentionally excluded from pulled <InlineCode>.env</InlineCode> files.
                  </p>
                  <CodeBlock label="bash">{`synkrypt run --env dev -- bun run dev
synkrypt run --env staging -- bun test
synkrypt run --env prod -- bun run build`}</CodeBlock>
                </>
              ),
            },
            {
              title: "Log out when needed",
              body: <CodeBlock label="bash">{`synkrypt logout`}</CodeBlock>,
            },
          ]}
        />

        <Callout tone="warning" title="Important difference between pull and run">
          <InlineCode>synkrypt pull</InlineCode> only writes <strong className="text-foreground">viewable</strong> secrets to <InlineCode>.env</InlineCode>. <InlineCode>synkrypt run</InlineCode> injects the full set of secrets you are allowed to use for that environment. If something works with <InlineCode>run</InlineCode> but is missing after <InlineCode>pull</InlineCode>, the secret is probably restricted on purpose.
        </Callout>
      </>
    ),
  },
  {
    id: "secret-operations",
    label: "Secret Operations",
    group: "Operations",
    icon: KeyRound,
    title: "Managing Secrets Safely",
    description:
      "These are the practical rules that keep your team organized once the first project is live and multiple people are editing secrets across environments.",
    body: (
      <>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">When to use dashboard entry</h4>
            <p>
              Use single-secret creation when you are adding a small number of keys, checking labels carefully, or deciding visibility one secret at a time.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">When to use bulk import</h4>
            <p>
              Use bulk import when migrating an existing <InlineCode>.env</InlineCode> file into Synkrypt. Review the selected environment first so values are not loaded into the wrong cluster.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">When to make a secret restricted</h4>
            <p>
              Mark a secret restricted if it should never be exposed in the browser or written to a local <InlineCode>.env</InlineCode> file. Developers can still receive it through runtime injection if they are allowed.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">When to use environment sync</h4>
            <p>
              Use sync when you intentionally want to promote a known-good set of values from one environment to another. Avoid using it as a shortcut for experimenting.
            </p>
          </div>
        </div>

        <Callout title="Practical rollout order">
          A good default is to create secrets in <InlineCode>dev</InlineCode>, validate them locally with <InlineCode>synkrypt run</InlineCode>, then move only the approved values into <InlineCode>staging</InlineCode>, and only after verification promote to <InlineCode>prod</InlineCode>.
        </Callout>
      </>
    ),
  },
  {
    id: "security-model",
    label: "Security Model",
    group: "Operations",
    icon: Lock,
    title: "What Protects The Secrets",
    description:
      "The docs page should explain not only how to use the system, but also why the platform is designed the way it is.",
    body: (
      <>
        <p>
          Synkrypt uses layered encryption so the application can store encrypted material without storing plaintext secret values. Each project has a dedicated project key, and individual secret handling is built around encrypted payloads and grants.
        </p>

        <div className="space-y-3">
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h5 className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Layer 1: Server Secret</h5>
            <p>Protects the project keys stored by the platform.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h5 className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Layer 2: Project Key</h5>
            <p>Each project has its own key, which isolates one project from another.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h5 className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Layer 3: Secret Value Encryption</h5>
            <p>Secret payloads are encrypted using authenticated encryption so the system can detect tampering as well as protect confidentiality.</p>
          </div>
        </div>

        <Callout tone="warning" title="Security behavior to remember">
          The safest developer workflow is runtime injection, not long-lived plaintext files. If a secret should remain tightly controlled, keep it restricted and ask developers to use <InlineCode>synkrypt run</InlineCode> instead of relying on pulled <InlineCode>.env</InlineCode> files.
        </Callout>
      </>
    ),
  },
  {
    id: "cli-reference",
    label: "CLI Reference",
    group: "Reference",
    icon: TerminalSquare,
    title: "CLI Commands You Will Actually Use",
    description:
      "These are the commands exposed by the current CLI implementation and the situations where each one is useful.",
    body: (
      <>
        <CodeBlock label="bash">{`# Authenticate
synkrypt login
synkrypt whoami
synkrypt logout

# Link current repository to a dashboard project
synkrypt use <project-key>

# Pull only viewable secrets into a local .env file
synkrypt pull --env dev

# Inject all accessible secrets and run a child process
synkrypt run --env dev -- bun run dev
synkrypt run --env staging -- bun test
synkrypt run --env prod -- bun run build`}</CodeBlock>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">login</h4>
            <p>Creates a local authenticated CLI session tied to your Synkrypt account.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">use</h4>
            <p>Stores the current project link in the repository so future commands know which project to target.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">pull</h4>
            <p>Writes a local <InlineCode>.env</InlineCode> file containing only secrets that are viewable for your account.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/25 bg-background/60 p-5">
            <h4 className="mb-2 font-bold text-foreground">run</h4>
            <p>Injects the environment into a child process without requiring you to store everything in plaintext on disk.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    group: "Reference",
    icon: Users,
    title: "Common Problems And How To Unblock Them",
    description:
      "Most onboarding issues come from membership, project linking, environment mismatch, or misunderstanding the difference between pulled and runtime-only secrets.",
    body: (
      <>
        <StepList
          steps={[
            {
              title: "You can log in, but use or pull fails",
              body: (
                <p>
                  Confirm that the project key is correct and that you ran <InlineCode>synkrypt use &lt;project-key&gt;</InlineCode> from the root of the correct repository.
                </p>
              ),
            },
            {
              title: "A developer can open the dashboard but cannot access secrets",
              body: (
                <p>
                  Check that the person is both an organization member and a project member, then verify that the expected environment clearance is enabled in the project’s team tab.
                </p>
              ),
            },
            {
              title: "A value is missing after pull",
              body: (
                <p>
                  The secret is probably restricted. Ask the admin whether the key is intentionally marked non-viewable, then use <InlineCode>synkrypt run</InlineCode> instead of relying on the generated <InlineCode>.env</InlineCode> file.
                </p>
              ),
            },
            {
              title: "A process starts but still cannot see the expected environment values",
              body: (
                <p>
                  Make sure you used the correct environment flag such as <InlineCode>--env dev</InlineCode> or <InlineCode>--env prod</InlineCode>. Environment mismatches are one of the easiest ways to inject the wrong set of secrets.
                </p>
              ),
            },
            {
              title: "CLI commands cannot reach the server",
              body: (
                <p>
                  Verify that the Synkrypt server is running and reachable at <InlineCode>http://localhost:2809</InlineCode>, or set the correct backend URL in your shell before running commands if your deployment is hosted elsewhere.
                </p>
              ),
            },
          ]}
        />
      </>
    ),
  },
];

const groups = Array.from(new Set(sections.map((section) => section.group)));

export default function DocsPage() {
  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-border/30 bg-card/30 p-7 shadow-xl shadow-primary/5 backdrop-blur-xl md:p-8">
        <div className="max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary/80">
            <ShieldCheck className="size-3" />
            <span>Synkrypt Documentation</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Admin and developer playbook</h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            This documentation is designed to help a team go from first setup to daily usage. It covers how to run the platform, what admins need to configure, and what developers need to do in the CLI to work safely with secrets.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Admin workflow
            </div>
            <div className="rounded-full border border-border/40 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Developer workflow
            </div>
            <div className="rounded-full border border-border/40 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              CLI reference
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[250px_1fr]">
        <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[1.75rem] border border-border/20 bg-muted/10 p-5">
            <p className="mb-6 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/50">Documentation Map</p>
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group}>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/70">{group}</p>
                  <div className="space-y-1">
                    {sections
                      .filter((section) => section.group === group)
                      .map((section) => (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
                        >
                          <section.icon className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                          <span>{section.label}</span>
                        </a>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="max-w-5xl space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
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
