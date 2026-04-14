-- ============================================================
-- Synkrypt V3.5 Schema - Professional Identity & Access
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Organization Members (with roles)
CREATE TABLE IF NOT EXISTS organization_members (
    org_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);

-- Access Presets (Team Tags)
CREATE TABLE IF NOT EXISTS access_presets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    environments TEXT[] NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- User Assets (PEM files, VPN configs, SSH keys assigned to specific users)
CREATE TABLE IF NOT EXISTS user_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL, -- e.g. "Rick's Production SSH Key"
    type            TEXT NOT NULL DEFAULT 'file' CHECK (type IN ('file', 'vpn', 'ssh', 'other')),
    encrypted_value JSONB NOT NULL,       -- { iv, content, tag }
    metadata        JSONB DEFAULT '{}',   -- { filename, size, mime, expires }
    issued_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    description  TEXT,
    github_repo  TEXT,
    project_key  TEXT NOT NULL UNIQUE,
    master_key   TEXT NOT NULL, -- AES key for project-level secrets
    org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    environments  TEXT[] NOT NULL DEFAULT '{}',
    preset_name   TEXT,
    expires_at    TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

-- Project Secrets
CREATE TABLE IF NOT EXISTS secrets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    environment     TEXT NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    type            TEXT NOT NULL DEFAULT 'env' CHECK (type IN ('env', 'file')),
    key             TEXT NOT NULL,
    encrypted_value JSONB NOT NULL,
    metadata        JSONB DEFAULT '{}',
    can_view        BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, environment, key, user_id) 
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    details     TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);
