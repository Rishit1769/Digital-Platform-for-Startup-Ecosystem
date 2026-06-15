# Docker & Containerization Workflow

> **Database**: MySQL 8.4 via Docker Compose  
> **Frontend**: Next.js 16 standalone output  
> **Backend**: Express 5 (separate container or bare metal)  
> **Storage**: MinIO S3-compatible (optional)

---

## 1. Multi-Stage Dockerfile

The following `Dockerfile` is designed for the Next.js frontend using the `standalone` output mode, which produces a minimal production image (~150MB) with only the required runtime files.

```dockerfile
# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./
COPY turbo.json tsconfig.base.json ./

# Copy workspace packages (only those needed for build)
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/

# Copy app package
COPY apps/frontend/package.json apps/frontend/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=apps/frontend --workspace=packages/shared

# =============================================================================
# Stage 2: Build
# =============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY package.json turbo.json tsconfig.base.json ./

# Copy all source files needed
COPY apps/frontend/ apps/frontend/
COPY packages/shared/ packages/shared/
COPY packages/db/prisma/schema.prisma packages/db/prisma/schema.prisma

# Set build-time env
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js with standalone output
RUN npx next build --experimental-build-mode=compile apps/frontend

# =============================================================================
# Stage 3: Production Runner
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/frontend/.next/standalone ./

# Copy static assets (public dir, static chunks)
COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/frontend/public ./apps/frontend/public

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The standalone entry point is generated at apps/frontend/server.js
CMD ["node", "apps/frontend/server.js"]
```

### Build & Run Commands

```bash
# Build the image
docker build -t startup-ecosystem-frontend:latest .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com/api \
  -e NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id \
  startup-ecosystem-frontend:latest
```

---

## 2. Docker Compose Orchestration

### Production `docker-compose.yml`

```yaml
version: "3.9"

networks:
  ecosystem-net:
    driver: bridge

services:
  # ─── MySQL 8.4 Database ─────────────────────────────────────
  mysql:
    image: mysql:8.4
    container_name: startup-ecosystem-db
    restart: unless-stopped
    networks:
      - ecosystem-net
    ports:
      - "3307:3306"           # Host 3307 maps to container 3306
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-startup123}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-startup_ecosystem}
      MYSQL_CHARSET: utf8mb4
      MYSQL_COLLATION: utf8mb4_unicode_ci
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/01_create_database.sql:/docker-entrypoint-initdb.d/01_create_database.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD:-startup123}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-authentication-plugin=mysql_native_password
      - --max_connections=200
      - --innodb_buffer_pool_size=256M

  # ─── MinIO Object Storage (Optional) ────────────────────────
  minio:
    image: minio/minio:latest
    container_name: startup-ecosystem-storage
    restart: unless-stopped
    networks:
      - ecosystem-net
    ports:
      - "9000:9000"           # API port
      - "9001:9001"           # Console port
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Backend API (Express 5) ────────────────────────────────
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    container_name: startup-ecosystem-api
    restart: unless-stopped
    networks:
      - ecosystem-net
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: mysql://root:${MYSQL_ROOT_PASSWORD:-startup123}@mysql:3306/startup_ecosystem?connection_limit=20
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
      MINIO_BUCKET: ${MINIO_BUCKET:-startup-ecosystem}
      MINIO_ENABLED: ${MINIO_ENABLED:-false}
    depends_on:
      mysql:
        condition: service_healthy
    # Run Prisma migrations before starting the server
    command: sh -c "npx prisma migrate deploy && node dist/src/index.js"

  # ─── Next.js Frontend ───────────────────────────────────────
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    container_name: startup-ecosystem-ui
    restart: unless-stopped
    networks:
      - ecosystem-net
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:5000/api}
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
    depends_on:
      - backend

volumes:
  mysql_data:
    driver: local
  minio_data:
    driver: local
```

### Development Override `docker-compose.override.yml`

```yaml
version: "3.9"

services:
  mysql:
    ports:
      - "3307:3306"      # Expose MySQL on host port 3307

  minio:
    ports:
      - "9000:9000"      # Expose MinIO API
      - "9001:9001"      # Expose MinIO Console
```

---

## 3. Environment Variable Matrix

### Database

| Variable | Local Default | Staging | Production | Purpose |
|----------|---------------|---------|------------|---------|
| `DATABASE_URL` | `mysql://root:startup123@localhost:3307/startup_ecosystem` | Managed secret | Managed secret | Prisma connection string |
| `MYSQL_ROOT_PASSWORD` | `startup123` | Managed secret | Managed secret | MySQL root password (Docker) |
| `MYSQL_DATABASE` | `startup_ecosystem` | `startup_ecosystem` | `startup_ecosystem` | MySQL database name |

### Backend

| Variable | Local Default | Staging | Production | Purpose |
|----------|---------------|---------|------------|---------|
| `PORT` | `5000` | `5000` | `5000` | Express server port |
| `NODE_ENV` | `development` | `staging` | `production` | Environment mode |
| `FRONTEND_URL` | `http://localhost:3000` | `https://staging.example.com` | `https://example.com` | CORS origin |

### Authentication

| Variable | Local Default | Staging/Production | Purpose |
|----------|---------------|--------------------|---------|
| `JWT_SECRET` | Auto-generated | Managed secret | Access token signing |
| `JWT_REFRESH_SECRET` | Auto-generated | Managed secret | Refresh token signing |
| `GOOGLE_CLIENT_ID` | From GCP console | From GCP console | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | From GCP console | Managed secret | Google OAuth client secret |

### Email (SMTP)

| Variable | Local Default | Staging/Production | Purpose |
|----------|---------------|--------------------|---------|
| `SMTP_HOST` | `smtp.mailtrap.io` | Production SMTP | SMTP server |
| `SMTP_PORT` | `2525` | `587` | SMTP port |
| `SMTP_USER` | Mailtrap user | SendGrid/Mailgun user | SMTP auth |
| `SMTP_PASS` | Mailtrap pass | Managed secret | SMTP password |
| `SMTP_FROM` | `noreply@ecosystem.app` | `noreply@example.com` | From address |

### AI

| Variable | Local Default | Staging/Production | Purpose |
|----------|---------------|--------------------|---------|
| `GEMINI_API_KEY` | From Google AI Studio | Managed secret | Gemini API key |

### MinIO (Object Storage)

| Variable | Local Default | Staging/Production | Purpose |
|----------|---------------|--------------------|---------|
| `MINIO_ENABLED` | `false` | `true` | Feature flag |
| `MINIO_STRICT` | `false` | `true` | Fail on MinIO unavailable |
| `MINIO_ENDPOINT` | `localhost` | `minio.example.com` | MinIO server host |
| `MINIO_PORT` | `9000` | `9000` | MinIO API port |
| `MINIO_ACCESS_KEY` | `minioadmin` | Managed secret | Access key |
| `MINIO_SECRET_KEY` | `minioadmin` | Managed secret | Secret key |
| `MINIO_BUCKET` | `startup-ecosystem` | `startup-ecosystem` | Bucket name |
| `MINIO_CDN_BASE_URL` | (none) | CDN domain | CDN prefix for object URLs |

### Frontend

| Variable | Local Default | Staging | Production |
|----------|---------------|---------|------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | `https://staging-api.example.com/api` | `https://api.example.com/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | From GCP console | From GCP console | From GCP console |

---

## 4. Container Startup Order

```mermaid
sequenceDiagram
    participant Docker
    participant MySQL
    participant MinIO
    participant Backend
    participant Frontend

    Docker->>MySQL: Start container
    Note over MySQL: Image: mysql:8.4
    MySQL->>Docker: Health check: mysqladmin ping
    Note over MySQL: Wait until healthy (up to 30s)

    Docker->>MinIO: Start container
    Note over MinIO: Image: minio/minio
    MinIO->>Docker: Health check: curl /minio/health/live

    Docker->>Backend: Start after mysql healthy
    Note over Backend: npx prisma migrate deploy
    Note over Backend: Then: node dist/src/index.js
    Backend->>MySQL: Prisma migrate deploy (apply pending)
    Backend->>MySQL: $connect() with retry (3 attempts)
    Backend->>Backend: Start Express on :5000

    Docker->>Frontend: Start (no depends_on health)
    Frontend->>Frontend: Start Next.js on :3000
```

### Dependency Graph

```
mysql (healthcheck)
  |-- backend (depends_on: mysql_healthy)
  |     |-- frontend (depends_on: backend)
minio (optional, healthcheck)
  |-- backend (depends_on: minio_healthy if MINIO_ENABLED=true)
```

---

## 5. Production Deployment Checklist

- [ ] Generate strong unique JWT secrets (use openssl rand -hex 64)
- [ ] Set NODE_ENV=production (disables verbose Prisma logging, enables production error handling)
- [ ] Configure `DATABASE_URL` with connection pooling params for Prisma
- [ ] Enable MinIO or replace with S3 (configure MINIO_ENABLED=true, set CDN URL)
- [ ] Configure SMTP for production email provider (SendGrid, Mailgun, SES)
- [ ] Set GOOGLE_CLIENT_ID/SECRET from production GCP project
- [ ] Set GEMINI_API_KEY from production Google AI project
- [ ] Apply Prisma migrations: `npx prisma migrate deploy`
- [ ] Run database seed: `npx ts-node prisma/seed.ts`
- [ ] Place behind reverse proxy (Nginx/Caddy/Cloudflare) with SSL termination
- [ ] Configure `docker-compose.override.yml` for env-specific overrides (DO NOT commit)
- [ ] Set up database backup cron job (mysqldump or automated snapshot)
