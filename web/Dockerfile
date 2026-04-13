# Stage 1: Build
FROM oven/bun:latest as build-stage

WORKDIR /app

# Copy package files
COPY package.json ./
# Note: If you have a lockfile, copy it too
# COPY bun.lock ./

RUN bun install

# Copy source and build
COPY . .
RUN bun run build

# Stage 2: Serve
FROM nginx:stable-alpine

# Copy built files from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
