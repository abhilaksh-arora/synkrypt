# Synkrypt: Simplified Secrets Management

[![Platform: Self-Hostable](https://img.shields.io/badge/Platform-Self--Hostable-blueviolet?style=flat-square)](https://github.com/abhilaksh-arora/synkrypt)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Typography: Professional](https://img.shields.io/badge/Typography-Professional-orange?style=flat-square)](https://synkrypt.com)

**Synkrypt** is a high-security secrets management platform available as a **Managed Cloud Service** or a **Self-Hosted Enterprise Node**. Designed for zero-trust project isolation and client-side runtime injection, it provides a professional, localized alternative to centralized secret stores.

---

## Core Philosophy

Professional secrets management should stay out of your way. Synkrypt focuses on clarity and security:

- **Localized Control**: Your secrets live on your infrastructure, following your security rules.
- **Zero-Knowledge Architecture**: Every project generates a unique cryptographic Master Key. The server never stores your raw secrets in plaintext.
- **CLI-Native Workflow**: Inject secrets directly into child processes at runtime. No more unencrypted `.env` files on developer machines.

## Key Features

### Project-Based Isolation & Air-Gapped Capable

Each project acts as an isolated cryptographic boundary. A compromise in one project does not affect the cryptographic integrity of others. Furthermore, Synkrypt operates cleanly inside Private VPCs and Air-Gapped networks. It does not communicate with external analytics or telemetry servers.

### Security Architecture

Synkrypt does not use simple symmetric encryption. It relies on a multi-tiered cryptographic derivation pipeline combining global root keys with strict project-level isolation:

1. **Layer 1: Server Root Key**: A master 64-character hex key generated at setup via HKDF. This never rests in the database and must be provided via the backend environment.
2. **Layer 2: Project Master Key (PMK)**: A unique 256-bit AES key generated whenever a new project is created.
3. **Layer 3: AES-256-GCM AEAD**: Each individual secret is encrypted using Advanced Encryption Standard in Galois/Counter Mode, ensuring both confidentiality and data authenticity.
4. **Layer 4: Personal Vault RSA**: Developer-specific files are hybrid-encrypted using unique client-side RSA/ECDH keypairs.

### Multi-Tenant Organization Scoping

Synkrypt is now a multi-tenant platform. Every project, secret, and member is scoped to an **Organization**. This allows multiple teams to share a single platform node while maintaining absolute data sovereignty between organizational boundaries.

- **Hierarchical Role Matrix**: Every user holds a specific role within their organization:
    - **Owner**: Full lifecycle control over the organization, billing, and membership.
    - **Admin**: Can create projects, manage environments, and provision access for members within the org.
    - **Member**: Baseline access to specific projects they are assigned to. Read/pull rights are environment-guarded.
- **Platform Administration**: A separate `Platform Admin` flag handles system-wide concerns like managing users across all organizations, audit auditing, and system configuration.
- **Temporary TTL Access**: Set expiration dates (Time-To-Live) for members. The moment the TTL hits zero, the user's session terminates and all their local ciphertexts are cryptographically invalidated by the server.
- **Organization Revoke**: Instantly remove a user from an organization. All related projects beome inaccessible instantly.

### Professional Dashboard

A clean, high-performance interface for managing configuration and team access.

- **Direct Navigation**: Access your projects and variables immediately after login.
- **Interactive Audit Logs**: A high-fidelity timeline of every secret access and configuration change.
- **Security Alerts**: Real-time notifications for sensitive resource access and permission shifts.
- **Access Presets**: Standardized "Team Tags" (Senior Dev, PM, etc.) for rapid, one-click provisioning.
- **Developer Aesthetics**: Built with professional typography (**Inter**) and high-contrast monospace (**JetBrains Mono**) for a premium developer experience.

### Developer CLI

The primary interface for engineering teams. Seamlessly transition from development to production.

- `synkrypt login`: Securely authenticate your local machine.
- `synkrypt use <project-key>`: Link a project repository.
- `synkrypt run --env dev -- <command>`: Inject variables into process memory (e.g., `synkrypt run -- bun run dev` or `synkrypt run -- docker-compose up`).
- `synkrypt pull`: Safely sync viewable variables to a local `.env` file (for legacy stacks).
- `synkrypt push`: Bulk upload local variables to a project environment.

### Sub-millisecond Performance

Validated sub-millisecond injection overhead. Synkrypt ensures security never slows down your development cycle or production boot times.

---

## Getting Started

### Path A: Managed Cloud (Recommended)

The fastest way to secure your infrastructure.

1. **Sign Up**: Create an account at [synkrypt.abhilaksharora.com](https://synkrypt.abhilaksharora.com).
2. **Install CLI**:
   ```bash
   curl -fsSL https://synkrypt.abhilaksharora.com/install.sh | bash
   ```
3. **Login & Run**:
   ```bash
   synkrypt login
   synkrypt run --env dev -- <your-command>
   ```

---

### Path B: Self-Hosted Enterprise Node (Air-Gapped)

For organizations requiring total infrastructure sovereignty.

#### 1. Requirements

- [Bun](https://bun.sh) (v1.0.0+)
- PostgreSQL

### 2. Server Setup

Clone the repository and initialize the database.

```bash
git clone https://github.com/abhilaksh-arora/synkrypt.git
cd synkrypt
bun install
```

#### Configuration

Set your core variables in `server/.env`:

```bash
PORT=2809
DATABASE_URL=postgresql://user:pass@localhost:5432/synkrypt
SERVER_SECRET=<64_char_hex_string>
JWT_SECRET=<64_char_hex_string>
PUBLIC_REGISTRATION_ENABLED=false
```

#### Run Migration & Start

```bash
cd server
bun run src/db/migrate.ts
bun run dev
```

### 3. Dashboard Access

```bash
cd web
bun run dev
```

Accessible at `http://localhost:5173`. Create your admin account to get started.

---

## CLI Usage

### Installation

#### One-Line Global Install (Recommended)

Install the Synkrypt CLI globally with a single command:

```bash
curl -fsSL https://synkrypt.abhilaksharora.com/install.sh | bash
```

_Note: This downloads a standalone binary. No Node.js or Bun required on the client machine._

#### Install From GitHub Releases

Download the correct `synkrypt-<os>-<arch>.tar.gz` asset from the release and place it on your `PATH`.

macOS example (Apple Silicon):

```bash
# 1) Download from GitHub Releases (replace URL/tag as needed)
curl -L -o synkrypt-macos-arm64.tar.gz "<RELEASE_ASSET_URL>"

# 2) Extract (archive contains a single `synkrypt` binary)
tar -xzf synkrypt-macos-arm64.tar.gz

# 3) Install
chmod +x synkrypt
sudo mv synkrypt /usr/local/bin/synkrypt

# 4) Verify
synkrypt --help
```

If your release includes `SHA256SUMS.txt`, verify checksums before installing:

```bash
shasum -a 256 -c SHA256SUMS.txt
```

#### Local Development (Using Bun)

If you prefer to run from source:

```bash
cd cli
bun link
```

### Authentication

```bash
synkrypt login
```

### Project Linking

```bash
synkrypt use <project-key>
```

> [!TIP]
> **Team Collaboration**: Synkrypt supports checking the `.synkrypt/config.json` file into version control. This allows your team to sync project links automatically—anyone who clones the repo can immediately run `synkrypt run` without manual setup.

### Sync Secrets (.env)

#### Pull
```bash
synkrypt pull --env dev
```

#### Push
```bash
# Push local .env to staging
synkrypt push --env staging

# Push personal secrets (private scope)
synkrypt push .env.personal --env dev --personal
```

### Run with Secrets

```bash
synkrypt run --env dev -- <your-command>
```

### System Management

Keep your toolset up-to-date or remove it cleanly:

- **Update**: `synkrypt update` (Runs the official installer)
- **Uninstall**: `synkrypt uninstall` (Removes the global binary)

---

## User Registration & SaaS Mode

Synkrypt can be configured to operate as a private internal tool or a public-facing service.

### Registration Toggle

The platform's sign-up behavior is controlled by the `PUBLIC_REGISTRATION_ENABLED` environment variable in the server configuration.

- **Managed SaaS Mode (`true`)**: Public registration is open. Anyone can visit `/login`, toggle to "Create Account," and join your infrastructure as a `developer`.
- **Private/Enterprise Mode (`false`)**: Public sign-ups are disabled after the initial system bootstrap. New users must be invited by a Platform Administrator via the dashboard.

### First-User Bootstrap

The Synkrypt protocol includes an intelligent bootstrap mechanism. The very first account registered on a fresh database is automatically assigned the **Platform Admin** status, regardless of the registration toggle setting. This ensures you can always securely initialize and configure your node.

---

## Production Deployment

Synkrypt is designed for high-availability production environments. We provide pre-configured templates for **PM2** and **Caddy**.

1. **Backend**: Use `ecosystem.config.js` to manage the process via PM2.
2. **Reverse Proxy**: Use the provided `Caddyfile` for automated SSL and API routing.
3. **Automated Updates**: Use the included `deploy.sh` script to pull changes, rebuild, and restart the server in one command.

For a detailed step-by-step guide, see our [Production Deployment Guide](docs/deployment.md).

## Security Layers

1. **Layer 1 (Server Secret)**: Protects project encryption keys in the database.
2. **Layer 2 (Project Master Key)**: A unique 256-bit key generated per project.
3. **Layer 3 (AES-256-GCM)**: Authenticated encryption for individual secret payloads.

---

## Development & Releasing

To package and release new versions of the CLI to GitHub:

```bash
cd cli
bun run publish
```

This automated script will:
1. Increment the version in `package.json`.
2. Compile binaries for all supported platforms.
3. Package assets and generate checksums.
4. Create a new GitHub Release with the correct tag.
5. Upload all assets to the release automatically.

## License

Distributed under the MIT License. See `LICENSE` for more information.
