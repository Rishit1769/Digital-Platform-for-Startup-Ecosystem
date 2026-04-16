# Digital Platform for Startup Ecosystem

A full-stack platform that helps students, founders, and mentors collaborate across startup discovery, idea validation, team building, scheduling, and ecosystem insights.

## Overview

This repository contains a monorepo with:
- `frontend`: Next.js 16 (App Router) web application
- `backend`: Node.js + Express + TypeScript API server
- `shared`: shared type definitions used across modules

The platform supports role-based experiences (student, mentor, admin) and includes features such as profile setup, startup management, mentor matching, meetings/office hours, analytics dashboards, and AI-assisted trend exploration.

## Key Features

- Role-based authentication and protected routes
- Profile setup and portfolio-style user identity
- Startup discovery and showcase workflows
- Idea board and collaboration flows
- Mentor discovery and access request pipeline
- Meeting, office-hour, and calendar scheduling modules
- Dashboard analytics (skill-gap heatmaps, trends, activity)
- News feed and ecosystem signals
- Admin tooling for moderation and verification

## Architecture

### Frontend
- Framework: Next.js 16 + React 19 + TypeScript
- Styling: Tailwind CSS 4
- Data visualization: Recharts
- DnD support: dnd-kit

### Backend
- Runtime: Node.js + Express 5 + TypeScript
- Database: MySQL (`mysql2`)
- Auth: JWT + cookies
- File storage: MinIO
- AI integrations: Google Gemini APIs
- Email: Nodemailer (SMTP)
- Scheduled jobs: node-cron

## Repository Structure

```text
.
|-- frontend/
|-- backend/
|-- shared/
|-- package.json
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+
- MinIO (optional for avatar/media workflows)

### 1) Install dependencies

From repository root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2) Configure environment variables

Create a `.env` file inside `backend/` with at least:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=startup_ecosystem

JWT_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_strong_refresh_secret

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_FROM=noreply@ecosystem.app

MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=startup-ecosystem-bucket

GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=optional_github_token
```

Create a `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3) Initialize database

```bash
node backend/setup-db.js
```

Start backend once to let schema bootstrap through app initialization/migrations, then seed admin (optional):

```bash
node backend/seed-admin.js
```

### 4) Run the app

From repository root:

```bash
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`

## Available Scripts

### Root

- `npm run dev`: Runs frontend and backend together using `concurrently`

### Backend (`backend/package.json`)

- `npm run dev --prefix backend`: Start backend in watch mode
- `npm run build --prefix backend`: Build TypeScript backend
- `npm run start --prefix backend`: Start compiled backend

### Frontend (`frontend/package.json`)

- `npm run dev --prefix frontend`: Start Next.js dev server
- `npm run build --prefix frontend`: Build frontend
- `npm run start --prefix frontend`: Start production frontend
- `npm run lint --prefix frontend`: Run ESLint

## API Surface (High-Level)

Core route groups include:
- `/api/auth`
- `/api/profile`
- `/api/admin`
- `/api/discover`
- `/api/analytics`
- `/api/ai`
- `/api/dashboard`
- `/api/startups`
- `/api/showcase`
- `/api/ideas`
- `/api/roles`
- `/api/users`
- `/api/meetings`
- `/api/office-hours`
- `/api/calendar`
- `/api/public`

## Brief Project Report

### Objective
Build a centralized digital ecosystem where early-stage builders can discover opportunities, connect with mentors/teammates, and execute startup journeys with data-backed guidance.

### Current Implementation Status
- Full-stack monorepo is in place and runnable locally
- Core role-based flows (student/mentor/admin) are implemented
- Discovery, collaboration, analytics, and scheduling modules are integrated
- AI and ecosystem data features are connected through backend services

### Strengths
- Clear separation between frontend and backend concerns
- Broad feature coverage for startup lifecycle support
- Extensible route/service architecture suitable for modular growth

### Risks / Gaps
- Environment and deployment hardening required for production
- Security and observability checks should be expanded (rate limiting, audit logs, monitoring)
- Test coverage and CI automation should be strengthened

### Recommended Next Milestones
1. Add end-to-end test coverage for auth, profile, startup, and scheduling flows.
2. Introduce CI/CD with lint, type-check, build, and test gates.
3. Harden production security: secret management, CORS policy review, and API throttling.
4. Add operational telemetry (metrics, structured logs, alerting).

## License

Currently marked as `ISC` in package metadata.