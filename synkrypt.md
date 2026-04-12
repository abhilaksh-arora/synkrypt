# Synkrypt Usage Guide

This guide reflects the current implementation in this repo.

## Core Workflow

### 1. Initialize identity

Each user creates a local RSA identity. The CLI stores it in `~/.synkrypt/keys.json`. The private key can be passphrase-protected.

```bash
synkrypt init
```

### 2. Create an organization

Projects now live under organizations.

```bash
synkrypt org-create acme
```

### 3. Create a project and link the directory

```bash
synkrypt project-create api --org acme
synkrypt link api --org acme
```

### 4. Add members and policies

```bash
synkrypt org-add-member user-123 --org acme --role developer
synkrypt rule-template-create dev-default --org acme --dev-read --dev-write --staging-read
synkrypt add-member user-123 --role project_developer --template dev-default
```

### 5. Store secrets

Project secret:

```bash
synkrypt set DB_PASSWORD=super-secret -e dev
```

Project secret with secret-level grants:

```bash
synkrypt set STRIPE_KEY=sk_live_xxx -e prod --read-users user-a,user-b --write-users user-a
```

Organization secret:

```bash
synkrypt org-secret-set API_BASE=https://shared.example.com --org acme -e dev
```

### 6. Resolve secrets

When you call `pull` or `run` for a linked project, Synkrypt resolves:

1. org-scoped secrets for that environment
2. project-scoped secrets for that environment
3. project values override org values on key collisions

```bash
synkrypt pull -e dev
synkrypt run -e dev -- bun run index.ts
```

## Security Notes

### Request signing

Every CLI request is signed with the local private key. The server validates signatures using the registered public key.

### Secret access

The implementation supports both:

- legacy shared project-key secrets
- per-secret wrapped keys with per-user grants

Legacy secrets can be migrated:

```bash
synkrypt migrate-legacy-secrets --all
```

### Member revocation

Revocation is currently client-driven:

- re-encrypt secrets
- re-wrap keys for remaining members
- remove the target member

Commands:

```bash
synkrypt revoke-member user-123
synkrypt offboard user-123 --org acme
```

This works, but it is not yet the final ideal model. Server-side versioned rotation is still a future improvement.

## GitHub Repo Metadata

Projects can store linked GitHub repo metadata:

```bash
synkrypt project-link-github --repo acme/api
```

This is metadata only right now. It does not yet provide GitHub App sync or CI integration.

## Current Limits

- `canUse` without `canView` is weak on developer machines
- there is no UI yet
- rotation is not yet server-orchestrated
- GitHub integration is still metadata only
