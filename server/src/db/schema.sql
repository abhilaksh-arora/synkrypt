-- ============================================================
-- Synkrypt V2 Schema
-- ============================================================

-- Users (admins and developers)
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'developer')),
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Sessions (web + CLI)
CREATE TABLE IF NOT EXISTS user_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Org membership (all users who belong to an org, regardless of role)
CREATE TABLE IF NOT EXISTS organization_members (
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);

-- Projects (inside an org)
CREATE TABLE IF NOT EXISTS projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT,
    github_repo  TEXT,
    project_key  TEXT NOT NULL UNIQUE,   -- CLI identifier e.g. "pk_abc123def456"
    master_key   TEXT NOT NULL,          -- AES-256 key hex, encrypted with SERVER_SECRET
    created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Project membership with per-environment access
CREATE TABLE IF NOT EXISTS project_members (
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    environments  TEXT[] NOT NULL DEFAULT '{}',  -- ['dev', 'staging', 'prod']
    created_at    TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

-- Secrets (AES-256-GCM encrypted at rest)
CREATE TABLE IF NOT EXISTS secrets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment     TEXT NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    key             TEXT NOT NULL,
    encrypted_value JSONB NOT NULL,       -- { iv, content, tag }
    can_view        BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, environment, key)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
