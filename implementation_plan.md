# Synkrypt V2 — Simplified Architecture

A clean-slate redesign: self-hostable, open-source, two roles, web for admins, CLI for developers.

**Decisions locked:**
- Web UI: **React + Vite**
- First admin: **Open registration only when users table is empty** — first account auto-becomes admin. Registration locked after that.
- Invite model: **Admin creates developer accounts** from the web UI (sets email + temp password, shares out-of-band). No SMTP required.

---

## Core Design Principles

| Principle | Decision |
| :--- | :--- |
| Auth | Email + password (bcrypt + JWT). No OAuth dependency. |
| Roles | `admin` or `developer`. Admins manage via web, devs use CLI. |
| Encryption | Server-side AES-256-GCM. Secrets encrypted at rest with a per-project master key. Delivered over HTTPS. |
| Access control | Server-enforced. Project membership + environment-level permissions + `can_view` per secret. |
| Project identity | A `project_key` (short unique slug e.g. `pk_abc123`) used by the CLI to identify the project. |
| Self-hostable | One `.env` file. One Postgres DB. One `bun run dev`. |

---

## New Database Schema

```sql
-- Users (both admins and developers)
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'developer')),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sessions (CLI and web)
CREATE TABLE user_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,      -- SHA-256 of the raw token
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Organizations
CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Organization membership
CREATE TABLE organization_members (
    org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (org_id, user_id)
);

-- Projects (inside an org)
CREATE TABLE projects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    github_repo   TEXT,                    -- optional metadata: "owner/repo"
    project_key   TEXT NOT NULL UNIQUE,    -- CLI identifier, e.g. "pk_abc123def456"
    master_key    TEXT NOT NULL,           -- AES-256 key (hex), stored encrypted via SERVER_SECRET
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Which users have access to which project + which environments
CREATE TABLE project_members (
    project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    environments  TEXT[] NOT NULL DEFAULT '{}',   -- e.g. ['dev', 'staging']
    PRIMARY KEY (project_id, user_id)
);

-- Secrets
CREATE TABLE secrets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    environment     TEXT NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    key             TEXT NOT NULL,
    encrypted_value JSONB NOT NULL,         -- { iv, content, tag } from AES-256-GCM
    can_view        BOOLEAN NOT NULL DEFAULT TRUE,  -- if false, value hidden in web/pull; usable in run only
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, environment, key)
);

-- Audit log
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,   -- 'secret_read', 'secret_write', 'member_add', 'member_remove'
    details     TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

### What's Removed vs Current
- ❌ `rule_templates` / `rule_template_rules` → replaced by `environments[]` array on `project_members`
- ❌ `secret_user_access` (per-user wrapped keys) → server-enforced access control
- ❌ RSA public keys stored per user → not needed; email/password auth
- ❌ `github_id`, `github_login`, GitHub OAuth → removed

---

## Encryption Model

```
SERVER_SECRET (env var) ─── used to encrypt/decrypt each project's master_key

project.master_key ─────── used to AES-256-GCM encrypt/decrypt each secret value
```

- All encryption/decryption happens **on the server**.
- Secrets are stored as `{ iv, content, tag }` JSON in the DB.
- Delivery is over **HTTPS** — TLS in transit, AES in rest.
- `can_view = false` secrets: server delivers them **only** via the `run` command (env injection), never in `pull` response or the web UI.

> **Self-hosting note**: `SERVER_SECRET` must be set in `.env` and must never be committed. If it's lost, secrets cannot be decrypted.

---

## Server API

### Auth
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Create account (admin-only invite or open depending on config) |
| `POST` | `/auth/login` | Email + password → set session cookie + return JWT |
| `POST` | `/auth/logout` | Invalidate session |
| `GET` | `/auth/me` | Return current user info |

### Organizations
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/orgs` | Create org (admin) |
| `GET` | `/orgs` | List orgs for current user |
| `GET` | `/orgs/:id` | Get org detail |
| `POST` | `/orgs/:id/members` | Add member to org |
| `DELETE` | `/orgs/:id/members/:userId` | Remove member |

### Projects
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/orgs/:id/projects` | Create project — generates `project_key` + `master_key` |
| `GET` | `/orgs/:id/projects` | List projects |
| `GET` | `/projects/:id` | Get project detail |
| `POST` | `/projects/:id/members` | Add/update member + environments |
| `DELETE` | `/projects/:id/members/:userId` | Remove member |
| `GET` | `/projects/by-key/:projectKey` | Resolve project from CLI key |

### Secrets
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/projects/:id/secrets?env=dev` | List secrets (masked if `can_view=false`) |
| `POST` | `/projects/:id/secrets` | Create or update a secret |
| `DELETE` | `/projects/:id/secrets/:secretId` | Delete a secret |
| `GET` | `/projects/:id/secrets/pull?env=dev` | **CLI** — return decrypted values the caller can access. Enforces `can_view`. |
| `GET` | `/projects/:id/secrets/run?env=dev` | **CLI** — return all accessible decrypted values including `can_view=false` ones. |

---

## Web UI — Admin Dashboard

**Tech**: React (Vite) or simple HTML/CSS (your call). Admin flag = `user.role === 'admin'`. Developers see a login page with "Access via CLI" message.

### Screens

```
/ (Login)
├── /dashboard              ← org overview, quick stats
├── /orgs/:id
│   ├── /overview           ← name, members list
│   ├── /projects           ← list of projects
│   │   └── /projects/:pid
│   │       ├── /overview   ← project key display, GitHub repo, copy key button
│   │       ├── /secrets    ← env tabs (dev/staging/prod), add/edit/delete secrets, can_view toggle
│   │       └── /members    ← add member, assign environments, remove member
│   └── /members            ← org-level member management
└── /settings               ← account, change password
```

### Key UI interactions
- **Project Key**: Shown once on creation with a "Copy" button. Always visible in project overview.
- **Secrets table**: A row per secret. Value column shows `••••••` if `can_view=false`, real value otherwise. Toggle `can_view` inline.
- **Members**: Multi-select checkbox for which environments (`dev`, `staging`, `prod`) the developer can access.

---

## CLI — Developer Workflow

```bash
# One-time login (saves session token to ~/.synkrypt/session.json)
synkrypt login

# Link a project directory to a project (saved to .synkrypt/config.json)
synkrypt use pk_abc123def456

# Pull secrets into a .env file
synkrypt pull -e dev
synkrypt pull -e prod

# Inject secrets and run a process (can_view=false secrets included here)
synkrypt run -e dev -- node server.js
synkrypt run -e prod -- bun run start
```

### CLI auth flow
```
synkrypt login
  → prompts email + password
  → POST /auth/login
  → saves session token to ~/.synkrypt/session.json

synkrypt pull -e dev
  → reads project_key from .synkrypt/config.json
  → GET /projects/by-key/:key  (resolve project id)
  → GET /projects/:id/secrets/pull?env=dev  (with session token in Authorization header)
  → writes to .env
```

---

## What to Reuse from Current Codebase

| Current file | Verdict |
| :--- | :--- |
| `cli/src/utils/crypto.ts` | ✅ **Keep** — `encryptSymmetric`, `decryptSymmetric` are solid AES-256-GCM |
| `server/src/db/db.ts` | ✅ **Keep** — pool + audit log helper |
| `server/src/db/migrate.ts` | ✅ **Keep** — just point to new schema |
| `server/src/app.ts` | ✅ **Refactor** — CORS + route wiring |
| `server/src/middleware/` | ✅ **Refactor** — update auth middleware to use JWT/session |
| `server/src/controllers/authController.ts` | 🔄 **Rewrite** — remove GitHub OAuth, add email/password |
| `server/src/controllers/projectController.ts` | 🔄 **Heavy refactor** — simplify, add `project_key` generation |
| `server/src/controllers/secretController.ts` | 🔄 **Heavy refactor** — swap per-user wrapped keys for server-side decrypt |
| `cli/src/commands/secret.ts` | 🔄 **Refactor** — simplify, remove RSA wrapping logic |
| `cli/src/commands/project.ts` | 🔄 **Refactor** — simplify, drop key rotation/revoke flows |
| `cli/src/utils/config.ts` | 🔄 **Refactor** — remove RSA identity, keep project config |
| `rule_templates` everything | ❌ **Delete** |
| `secret_user_access` everything | ❌ **Delete** |
| RSA key gen / signing | ❌ **Delete** |

---

## Environment Variables (self-host .env)

```env
# Required
DATABASE_URL=postgresql://...
SERVER_SECRET=<random 64-char hex>   # used to protect master_keys at rest
JWT_SECRET=<random 64-char hex>       # used to sign session tokens

# Optional
PORT=3000
CORS_ORIGIN=http://localhost:5173
REGISTRATION_OPEN=false              # if false, only admins can invite
```

---

## Build Order

### Phase 1 — Server (Backend)
1. Wipe old schema, write new `schema.sql`
2. Update `db.ts` (keep pool, update audit helper)
3. Rewrite `authController` — email/password, bcrypt, JWT, first-user auto-admin logic
4. Rewrite `organizationController` — CRUD, members
5. Rewrite `projectController` — CRUD, `project_key` generation, `master_key` generation
6. Rewrite `secretController` — server-side AES encrypt/decrypt, `can_view` enforcement, `pull` vs `run` endpoints
7. Add `membersController` — manage project membership + environments
8. Update `app.ts` with new routes
9. Delete: `ruleTemplateController`, `ruleTemplateRoutes`, old user RSA logic

### Phase 2 — Web UI (Vite + React)
1. Bootstrap Vite React app in `/web`
2. Auth screens: Login, first-run Register
3. Dashboard / Org overview
4. Project screens: list, create, detail (project key display)
5. Secrets manager: env tabs, add/edit/delete, `can_view` toggle
6. Members manager: add developer, assign environments, remove
7. Account settings (change password)

### Phase 3 — CLI Simplification
1. Remove RSA identity, key rotation, revoke-member logic
2. Rewrite `login` command — email/password → session token stored locally
3. Rewrite `use` command — takes `project_key`, saves to `.synkrypt/config.json`
4. Rewrite `pull` command — fetch + decrypt via `/secrets/pull`
5. Rewrite `run` command — fetch via `/secrets/run`, inject into process env
6. Delete: `org-*`, `rule-template-*`, `revoke-member`, `offboard`, `migrate-legacy-secrets` commands

