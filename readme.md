# 🛡️ Synkrypt: Simplified Secrets Management

[![Platform: Self-Hostable](https://img.shields.io/badge/Platform-Self--Hostable-blueviolet?style=flat-square)](https://github.com/abhilaksh/synkrypt)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Typography: Professional](https://img.shields.io/badge/Typography-Professional-orange?style=flat-square)](https://synkrypt.com)

**Synkrypt** is a localized, high-security secrets manager designed for project isolation and client-side runtime injection. It provides a professional, self-hostable alternative to centralized secret stores, giving you full control over your sensitive configuration.

---

## 💎 Core Philosophy

Professional secrets management should stay out of your way. Synkrypt focuses on clarity and security:

- **Localized Control**: Your secrets live on your infrastructure, following your security rules.
- **Zero-Knowledge Architecture**: Every project generates a unique cryptographic Master Key. The server never stores your raw secrets in plaintext.
- **CLI-Native Workflow**: Inject secrets directly into child processes at runtime. No more unencrypted `.env` files on developer machines.

## 🚀 Key Features

### 🔐 Project-Based Isolation

Each project is a security boundary. A compromise in one project does not affect the cryptographic integrity of others.

### 🌓 Professional Dashboard

A clean, high-performance interface for managing configuration and team access.

- **Direct Navigation**: Access your projects and variables immediately after login.
- **Interactive Audit Logs**: A high-fidelity timeline of every secret access and configuration change.
- **Security Alerts**: Real-time notifications for sensitive resource access and permission shifts.
- **Access Presets**: Standardized "Team Tags" (Senior Dev, PM, etc.) for rapid, one-click provisioning.
- **Developer Aesthetics**: Built with professional typography (**Inter**) and high-contrast monospace (**JetBrains Mono**) for a premium developer experience.

### 🐚 Developer CLI

The primary interface for engineering teams. Seamlessly transition from development to production.

- `synkrypt login`: Securely authenticate your local machine.
- `synkrypt run`: Execute any command with injected environment variables.
- `synkrypt pull`: Safely sync viewable variables to a local `.env` file.

### ⚡ Sub-millisecond Performance

Validated sub-millisecond injection overhead. Synkrypt ensures security never slows down your development cycle or production boot times.

---

## 🛠️ Getting Started

### 1. Requirements

- [Bun](https://bun.sh) (v1.0.0+)
- PostgreSQL

### 2. Server Setup

Clone the repository and initialize the database.

```bash
git clone https://github.com/abhilaksh/synkrypt.git
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

## 🐚 CLI Usage

### Installation

#### 📦 One-Line Global Install (Recommended)
Install the Synkrypt CLI globally with a single command:

```bash
curl -fsSL https://synkrypt.abhilaksharora.com/install.sh | bash
```

*Note: This downloads a standalone binary. No Node.js or Bun required on the client machine.*

#### 🛠️ Local Development (Using Bun)
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

### Run with Secrets

```bash
synkrypt run --env dev -- bun run dev
```

---

## 🚢 Production Deployment

Synkrypt is designed for high-availability production environments. We provide pre-configured templates for **PM2** and **Caddy**.

1. **Backend**: Use `ecosystem.config.js` to manage the process via PM2.
2. **Reverse Proxy**: Use the provided `Caddyfile` for automated SSL and API routing.

For a detailed step-by-step guide, see our [Production Deployment Guide](docs/deployment.md).

## 🛡️ Security Layers

1. **Layer 1 (Server Secret)**: Protects project encryption keys in the database.
2. **Layer 2 (Project Master Key)**: A unique 256-bit key generated per project.
3. **Layer 3 (AES-256-GCM)**: Authenticated encryption for individual secret payloads.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
