# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends libc6-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

RUN corepack enable

COPY package.json package-lock.json ./
COPY packages/ ./packages/

RUN npm ci --ignore-scripts

# --- Stage 2: Builder ---
FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Trigger schema engine generations inside the workspace pipeline
RUN npm run db:generate --workspace=packages/db || true
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# --- Stage 3: Runner ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Bring over all required runtime node dependency trees & configurations
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Execute next directly using the binary inside the installed node_modules path
CMD ["./node_modules/.bin/next", "start", "./apps/frontend"]
