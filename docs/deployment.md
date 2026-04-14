# Production Deployment Guide: Synkrypt

This guide covers the deployment of Synkrypt on a production Linux server (Ubuntu/Debian) using **PM2** and **Caddy**.

## Prerequisites

Before starting, ensure your server has the following installed:
- **Bun**: `curl -fsSL https://bun.sh/install | bash`
- **PM2**: `npm install -g pm2`
- **Caddy**: [Install Instructions](https://caddyserver.com/docs/install)
- **PostgreSQL**: Local or a managed service like Neon.

---

## Step 1: Server Preparation

Clone your repository to the server (e.g., `/var/www/synkrypt`) and install dependencies:

```bash
cd /var/www/synkrypt
bun install
```

### Environment Setup
Create a `.env` file in the `server/` directory:

```bash
# /var/www/synkrypt/server/.env
DATABASE_URL=postgresql://user:password@localhost:5432/synkrypt
SERVER_SECRET=your_64_char_hex_secret
JWT_SECRET=your_other_64_char_hex_secret
CORS_ORIGIN=https://vault.yourdomain.com
PORT=2809
```

---

## Step 2: Build & Migrate

Build both the frontend and backend using Turbo:

```bash
# From the root directory
bun run build
```

Run the database migrations:

```bash
cd server
bun run src/db/migrate.ts
```

---

## Step 3: Start the Backend (PM2)

We use the `ecosystem.config.js` provided in the root to manage the server process.

```bash
# From the root directory
pm2 start ecosystem.config.js

# Ensure it starts on system reboot
pm2 save
pm2 startup
```

Check status with `pm2 status`. Logs are available in `./server/logs/`.

---

## Step 4: Configure the Reverse Proxy (Caddy)

Edit the `Caddyfile` in the root (or copy it to `/etc/caddy/Caddyfile`) and update your domain:

```caddy
# /var/www/synkrypt/Caddyfile
vault.yourdomain.com {
    # Serve the static frontend
    root * /var/www/synkrypt/web/dist
    file_server
    try_files {path} /index.html

    # Reverse proxy API requests
    handle_path /api/* {
        reverse_proxy localhost:2809
    }

    encode gzip zstd
}
```

Apply the configuration:

```bash
sudo caddy reload --config /var/www/synkrypt/Caddyfile
```

---

## Security Check

1. **Firewall**: Ensure ports `80` (HTTP) and `443` (HTTPS) are open.
2. **CORS**: Verify that `CORS_ORIGIN` in your server `.env` exactly matches your frontend URL.
3. **Secrets**: Use `openssl rand -hex 32` to generate secure hex strings for your secrets.

---

## Updates

To deploy updates in the future:

```bash
git pull
bun install
bun run build
pm2 restart synkrypt-server
```

> [!TIP]
> **Monitoring**: Use `pm2 monit` to see real-time CPU/Memory usage of your Synkrypt instance.
