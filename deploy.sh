#!/bin/bash
set -e

echo "Starting deployment..."

# 1. Pull latest changes
echo "Pulling latest changes..."
git pull

# 2. Install dependencies
echo "Installing dependencies..."
bun install

# 3. Build project
echo "Building project..."
bun run build

# 4. Restart server via PM2
echo "Restarting server..."
# Check if the process is already running in PM2
if pm2 list | grep -q "synkrypt-server"; then
    pm2 restart synkrypt-server
else
    pm2 start ecosystem.config.js
fi

echo "Deployment complete!"
