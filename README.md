# Digital Platform for Startup Ecosystem

A full-stack startup ecosystem platform that connects students, founders, mentors, and administrators across discovery, collaboration, mentoring, and execution workflows.

## Executive Summary

This repository is a monorepo with a modern web frontend and a TypeScript API backend. The platform supports role-aware journeys (student, mentor, admin), startup discovery, idea collaboration, meetings and office hours, ecosystem analytics, and AI-assisted insights.

## Core Capabilities

- Role-based authentication and authorization
- Profile and identity management
- Startup discovery, showcase, and leaderboard modules
- Idea management and collaboration workflows
- Mentor matching and office-hours scheduling
- Calendar and meeting management integrations
- Dashboard and analytics views
- News and ecosystem trend exploration
- Admin operations and verification flows
- Real-time features via Socket.IO

## Technology Stack

### Frontend

- Next.js 16.2.3 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- ESLint 9 + eslint-config-next
- Recharts for visual analytics
- dnd-kit for drag and drop interactions
- Mermaid + react-markdown + remark-gfm for rich content rendering
- socket.io-client for real-time interactions

### Backend

- Node.js + Express 5.2.1
- TypeScript 6
- MySQL via mysql2
- JWT authentication (jsonwebtoken)
- Cookie-based session helpers (cookie-parser)
- File upload and storage (multer + MinIO)
- Email service (nodemailer)
- Scheduled jobs (node-cron)
- Google integrations (googleapis, google-auth-library)
- AI integrations (@google/genai, @google/generative-ai)
- Realtime server support (socket.io)

### Monorepo Tooling

- npm workspaces style orchestration via root scripts
- concurrently for unified local development

## Current Repository Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |   |-- adminRoutes.ts
|   |   |   |-- aiRoutes.ts
|   |   |   |-- analyticsRoutes.ts
|   |   |   |-- authRoutes.ts
|   |   |   |-- calendarRoutes.ts
|   |   |   |-- dashboardRoutes.ts
|   |   |   |-- discoverRoutes.ts
|   |   |   |-- ideaRoutes.ts
|   |   |   |-- meetingRoutes.ts
|   |   |   |-- newsRoutes.ts
|   |   |   |-- officeHourRoutes.ts
|   |   |   |-- profileRoutes.ts
|   |   |   |-- publicRoutes.ts
|   |   |   |-- roleRoutes.ts
|   |   |   |-- showcaseRoutes.ts
|   |   |   |-- startupRoutes.ts
|   |   |   `-- userRoutes.ts
|   |   |-- services/
|   |   |-- utils/
|   |   `-- index.ts
|   |-- init.ts
|   |-- seed-admin.js
|   |-- setup-db.js
|   |-- package.json
|   `-- tsconfig.json
|-- frontend/
|   |-- app/
|   |   |-- admin/
|   |   |-- analytics/
|   |   |-- calendar/
|   |   |-- dashboard/
|   |   |-- discover/
|   |   |-- forgot-password/
|   |   |-- ideas/
|   |   |-- leaderboard/
|   |   |-- login/
|   |   |-- meetings/
|   |   |-- mentor/
|   |   |-- mentors/
|   |   |-- office-hours/
|   |   |-- profile/
|   |   |-- register/
|   |   |-- roles/
|   |   |-- settings/
|   |   |-- showcase/
|   |   |-- startups/
|   |   |-- trends/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   `-- globals.css
|   |-- components/
|   |-- lib/
|   |-- public/
|   |-- types/
|   `-- package.json
|-- shared/
|   |-- types.ts
|   `-- types.js
|-- fix-calendar.js
|-- package.json
`-- README.md
```

## API Modules (Backend)

The API is organized by domain route groups:

- /api/admin
- /api/ai
- /api/analytics
- /api/auth
- /api/calendar
- /api/dashboard
- /api/discover
- /api/ideas
- /api/meetings
- /api/news
- /api/office-hours
- /api/profile
- /api/public
- /api/roles
- /api/showcase
- /api/startups
- /api/users

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+
- MinIO (optional, required for object storage flows)

### Installation

Run from repository root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Environment Configuration

Create backend/.env:

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

Create frontend/.env.local:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Database Initialization

```bash
node backend/setup-db.js
node backend/seed-admin.js
```

### Run in Development

```bash
npm run dev
```

Default local endpoints:

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/api/health

## Scripts

### Root

- npm run dev: Runs backend and frontend concurrently

### Backend

- npm run dev --prefix backend: Starts backend with ts-node-dev
- npm run build --prefix backend: Builds backend TypeScript
- npm run start --prefix backend: Starts compiled backend output

### Frontend

- npm run dev --prefix frontend: Starts Next.js development server
- npm run build --prefix frontend: Builds production frontend
- npm run start --prefix frontend: Starts production frontend
- npm run lint --prefix frontend: Runs ESLint

## License

This project is currently licensed as ISC (as defined in package metadata).