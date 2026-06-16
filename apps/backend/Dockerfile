# --- Production Runner Stage ---
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libc6-dev && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# Bring over root structures and the freshly generated host build targets
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Run clean install without triggering background scripts
RUN npm ci --ignore-scripts

# Generate the engine mapping context using the validated schema path
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start", "--workspace=@startup-ecosystem/backend"]
