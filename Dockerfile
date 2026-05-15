# LPDoctor — multi-stage build
# Targets:
#   - server : Node Express backend on :3001
#   - web    : Vite static build served by nginx on :80
# Mirrors the pattern xrplens uses on the same VPS so the global Caddy
# routing already in place can be extended without surprises.

# ─── Stage 1: Base with pnpm ─────────────────────────────────
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update && apt-get install -y openssl git python3 build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ─── Stage 2: Install dependencies ───────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mcp-server/package.json apps/mcp-server/
COPY packages/core/package.json packages/core/
COPY packages/agent/package.json packages/agent/
RUN pnpm install --frozen-lockfile

# ─── Stage 3: Build every workspace once ─────────────────────
FROM deps AS build
COPY . .
# Prisma client generation — required before tsc on the server
RUN pnpm --filter @lpdoctor/server exec prisma generate
# Workspace build order: core → agent → server → mcp-server → web
RUN pnpm --filter @lpdoctor/core run build
RUN pnpm --filter @lpdoctor/agent run build
RUN pnpm --filter @lpdoctor/server run build
RUN pnpm --filter @lpdoctor/mcp-server run build
RUN pnpm --filter @lpdoctor/web run build

# ─── Stage 4: Production server image ────────────────────────
FROM base AS server
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Copy node_modules first (deps stage has the pnpm content-addressable
# store with all symlinks) then the WHOLE workspace packages so the
# pnpm symlinks resolve cleanly. Copying just dist/+package.json breaks
# the .pnpm/ workspace links.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/packages/core ./packages/core
COPY --from=build /app/packages/agent ./packages/agent
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/prisma ./apps/server/prisma
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
RUN cd apps/server && npx prisma generate
WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]

# ─── Stage 5: Production web image (nginx) ──────────────────
FROM nginx:alpine AS web
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
