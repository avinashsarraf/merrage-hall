# ─────────────────────────────────────────────────────────────────────────────
# MerrageHall — production image (Next.js standalone)
#
# Build:  docker build -t merragehall .
# Run:    docker run -p 3000:3000 -e DATABASE_URL="postgres://…" merragehall
#
# The container is stateless — point DATABASE_URL at Supabase (or any
# PostgreSQL) and it is ready to serve. See SUPABASE.md for the one-time
# `db:push` + `db:seed` setup.
# ─────────────────────────────────────────────────────────────────────────────

# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# ── 1) install all dependencies (build needs devDeps: typescript, tailwind…)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2) build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Pages are all dynamic — the builder never talks to the database.
# A placeholder keeps module init deterministic if anything probes it.
ENV DATABASE_URL="postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder"
# Inlined into client bundles at build time (venue subdomain display)
ARG NEXT_PUBLIC_ROOT_DOMAIN=merragehall.app
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
RUN npx next build

# ── 3) minimal runtime image (~150 MB)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# standalone server + static assets (public/ is a placeholder dir for now)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# /login renders without touching the DB, so this checks the app itself
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+ (process.env.PORT||3000) +'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
