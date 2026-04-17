# Synkrypt: Simplified Secrets Management

[![Platform: Self-Hostable](https://img.shields.io/badge/Platform-Self--Hostable-blueviolet?style=flat-square)](https://github.com/abhilaksh-arora/synkrypt)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**Synkrypt** is a zero-trust secrets manager that injects configuration directly into your applications at runtime. Security that stays out of your way.

---

## ⚡️ Quick Install

Install the standalone binary with a single command:

| Platform          | Installation Command                                                         |
| :---------------- | :--------------------------------------------------------------------------- |
| **macOS / Linux** | `curl -fsSL https://synkrypt.abhilaksharora.com/install.sh \| bash`          |
| **Windows**       | `powershell -c "irm https://synkrypt.abhilaksharora.com/install.ps1 \| iex"` |

---

## 🗺 Workflow Overview

Before using the CLI, follow these steps in the [Synkrypt Dashboard](https://synkrypt.abhilaksharora.com):

1. **Dashboard Login**: Sign up and create your organization.
2. **Initialize Organization**: You must create or join an **Organization/Team** first. This is the cryptographic home for all your projects.
3. **Create Project**: Once your organization is ready, start a new project to get your unique **Project Key**.
4. **Add Secrets**: Enter your environment variables (Dev, Staging, or Prod) for that project.
5. **CLI Integration**: Use the CLI to auth and inject these secrets into your apps.

---

## 🚀 Quick Start (5 Minutes)

### 1. Authenticate

```bash
synkrypt login
```

### 2. Link your Project

Navigate to your project folder and link it using your Project Key (found in the dashboard).

```bash
synkrypt use <project-key>
```

### 3. Run Securely

Inject your environment variables directly into your process.

```bash
# Run in development
synkrypt run --env dev bun run dev

# Run in production
synkrypt run --env prod -- bun run start

# Docker Compose with staging environment
synkrypt run --env staging -- docker-compose up
```

---

## 🛠 Command Reference

| Command                             | Description                                |
| :---------------------------------- | :----------------------------------------- |
| `synkrypt login`                    | Authenticate your local device.            |
| `synkrypt use <key>`                | Link the current directory to a project.   |
| `synkrypt run --env <env> -- <cmd>` | Inject secrets and execute a command.      |
| `synkrypt pull`                     | Sync cloud secrets to a local `.env` file. |
| `synkrypt push`                     | Bulk upload a local `.env` to the cloud.   |
| `synkrypt update`                   | Self-update to the latest version.         |
| `synkrypt uninstall`                | Cleanly remove Synkrypt from your system.  |

---

## 🛡 High-Security by Default

- **Zero-Trust Isolation**: Each project has its own unique cryptographic master key.
- **Runtime Injection**: Secrets are injected into memory. No unencrypted `.env` files lying around.
- **Client-Side Encryption**: Personal files are protected with unique RSA/ECDH keypairs.
- **Automatic Revocation**: Grant temporary access with TTLs—access expires automatically.

---

## 🏠 Self-Hosting (Advanced)

Synkrypt is fully self-hostable for organizations requiring absolute data sovereignty.

### Node Setup

```bash
git clone https://github.com/abhilaksh-arora/synkrypt.git
cd synkrypt
bun install
```

### Server Configuration

Set up your `server/.env`:

```bash
PORT=2809
DATABASE_URL=postgresql://user:pass@localhost:5432/synkrypt
SERVER_SECRET=<64_char_hex_root_key>
JWT_SECRET=<64_char_hex_key>
```

### Launch

```bash
cd server && bun run src/db/migrate.ts && bun run dev
cd web && bun run dev
```

Dashboard available at `http://localhost:5173`.

---

## 📘 Detailed Documentation

### Security Architecture

Synkrypt does not use simple symmetric encryption. It relies on a multi-tiered cryptographic derivation pipeline combining global root keys with strict project-level isolation:

1. **Layer 1: Server Root Key**: A master 64-character hex key generated at setup via HKDF. This never rests in the database and must be provided via the backend environment.
2. **Layer 2: Project Master Key (PMK)**: A unique 256-bit AES key generated whenever a new project is created.
3. **Layer 3: AES-256-GCM AEAD**: Each individual secret is encrypted using Advanced Encryption Standard in Galois/Counter Mode, ensuring both confidentiality and data authenticity.
4. **Layer 4: Personal Vault RSA**: Developer-specific files are hybrid-encrypted using unique client-side RSA/ECDH keypairs.

### Multi-Tenant Organization Scoping

Synkrypt is a multi-tenant platform. Every project, secret, and member is scoped to an **Organization**. This allows multiple teams to share a single platform node while maintaining absolute data sovereignty between organizational boundaries.

- **Hierarchical Role Matrix**: Every user holds a specific role within their organization:
  - **Owner**: Full lifecycle control over the organization, billing, and membership.
  - **Admin**: Can create projects, manage environments, and provision access for members within the org.
  - **Member**: Baseline access to specific projects they are assigned to. Read/pull rights are environment-guarded.
- **Platform Administration**: A separate `Platform Admin` flag handles system-wide concerns like managing users across all organizations, audit auditing, and system configuration.
- **Temporary TTL Access**: Set expiration dates (Time-To-Live) for members. The moment the TTL hits zero, the user's session terminates and all their local ciphertexts are cryptographically invalidated by the server.

### Professional Dashboard

A clean, high-performance interface for managing configuration and team access.

- **Direct Navigation**: Access your projects and variables immediately after login.
- **Interactive Audit Logs**: A high-fidelity timeline of every secret access and configuration change.
- **Security Alerts**: Real-time notifications for sensitive resource access and permission shifts.
- **Access Presets**: Standardized "Team Tags" (Senior Dev, PM, etc.) for rapid, one-click provisioning.

### User Registration & SaaS Mode

- **Managed SaaS Mode**: Public registration is open. Anyone can visit `/login`, toggle to "Create Account," and join.
- **Private/Enterprise Mode**: Public sign-ups are disabled after bootstrap. New users must be invited by a Platform Administrator.

### Production Deployment

Synkrypt is designed for high-availability production environments. We provide pre-configured templates for **PM2** and **Caddy**.

1. **Backend**: Use `ecosystem.config.js` to manage the process via PM2.
2. **Reverse Proxy**: Use the provided `Caddyfile` for automated SSL and API routing.
3. **Automated Updates**: Use the included `deploy.sh` script to pull changes, rebuild, and restart the server.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
