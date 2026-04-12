# 🛡️ Synkrypt: The Localized Secrets Nexus

[![Platform: Self-Hostable](https://img.shields.io/badge/Platform-Self--Hostable-blueviolet?style=flat-square)](https://github.com/synkrypt/synkrypt)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Typography: Professional](https://img.shields.io/badge/Typography-Bold--Professional-orange?style=flat-square)](https://synkrypt.com)

**Synkrypt** is a localized, high-security universal secrets manager designed for maximum cryptographic isolation and client-side runtime injection. It pivots away from centralized services to provide a self-hostable **Vortex Infrastructure** that you control entirely.

---

## 💎 Core Philosophy

Standard secrets management often involves vendor lock-in and complex permissions. Synkrypt simplifies the protocol:
- **Localized First**: Your secrets live on your node, following your security rules.
- **Zero-Knowledge Architecture**: Every project generates a unique cryptographic Master Key. The server never stores your raw secrets in plaintext.
- **CLI-Native Workflow**: Inject secrets directly into child processes at runtime. No more unencrypted `.env` files lingering on developer machines.

## 🚀 Key Features

### 🔐 Vortex Infrastructure
Project-centric encryption isolation. A breach in one project container does not compromise the cryptographic integrity of others.

### 🌓 Premium Dashboard
A professional, localized dashboard featuring a high-fidelity cream/white theme, refined typography, and a glassmorphism design system. 
- **Universal Breadcrumbs**: High-precision navigation across organizations, projects, and documentation.
- **Real-time Audit Nexus**: Monitor cryptographic handshakes and secret accesses in real-time.

### 🐚 CLI Nexus
The primary interface for developers. Seamlessly transition from development to production clusters.
- `synkrypt login`: Secure administrative handshake.
- `synkrypt run`: Execute any command with perfectly injected environment variables.

### 🛡️ Fine-Grained RBAC
Switch between **Admin** and **Developer** roles with localized permissions for `dev`, `staging`, and `prod` environments.

---

## 🛠️ Getting Started

### 1. Requirements
- [Bun](https://bun.sh) (v1.0.0+)
- PostgreSQL (Neon Recommended)

### 2. Infrastructure Setup
Clone the nexus and initialize the database.

```bash
git clone https://github.com/abhilaksh/synkrypt-poc.git
cd synkrypt-poc
```

#### Server Configuration
Configure the core node variables in `server/.env`:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/synkrypt
SERVER_SECRET=<64_char_hex_string>
JWT_SECRET=<64_char_hex_string>
```

#### Start the Node
```bash
cd server
bun install
bun run index.ts
```

### 3. Dashboard Deployment
```bash
cd ../web
bun install
bun run dev --port 5173
```
Accessible at `http://localhost:5173`.

---

## 🐚 CLI Vortex Usage

Authenticate your local terminal with the active node.

### Initial Configuration
```bash
cd ../cli
synkrypt login
```

### Injecting Secrets
Execute your application across different environmental clusters:

```bash
# Inject development secrets into Vite
synkrypt run --env dev -- bun run dev

# Deploy to production cluster
synkrypt run --env prod -- bun run build
```

---

## 🛡️ Security Handshake

1. **Layer 1 (Server Secret)**: Protects the encryption keys stored in the database.
2. **Layer 2 (Project Master Key)**: A unique 256-bit key per project.
3. **Layer 3 (AES-256-GCM)**: Authenticated encryption for individual secret payloads.

---

## 📜 Documentation

Detailed guides on technical nexus protocols, node deployment, and the encryption handshake are available directly within the **Dashboard Docs** at `/docs`.

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

<p align="center">
  Built with ⚡ by the Synkrypt Team
</p>
