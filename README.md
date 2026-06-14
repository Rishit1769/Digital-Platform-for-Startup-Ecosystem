# Digital Platform for Startup Ecosystem

> **Monorepo** — Next.js 16 + Express 5 + MySQL 8.4 + Prisma 6  
> A full-stack collaboration platform connecting students, founders, mentors, and ecosystem enablers in one structured workspace.

---

## Table of Contents

1. [Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Repository Architecture](#-repository-architecture)
4. [Entity Relationship Diagram](#-entity-relationship-diagram)
5. [System Metrics](#-system-metrics)
6. [Sequence Diagrams](#-sequence-diagrams)
7. [Tech Stack](#%EF%B8%8F-tech-stack)
8. [Quick Start](#-quick-start)
9. [Prisma Database Setup](#-prisma-managed-database)
10. [API Reference](#-api-reference)
11. [Deployment Topology](#-deployment-topology)
12. [Architecture Decision Records](#-architecture-decision-records)
13. [Monitoring & Observability](#-monitoring--observability)
14. [Risk Assessment](#-risk-assessment)
15. [Technical Debt Register](#-technical-debt-register)
16. [Contributing](#-contributing)

---

## 🚀 Project Overview

Digital Platform for Startup Ecosystem consolidates startup ecosystem operations—discovery, mentorship, meeting scheduling, idea validation, startup tracking, and analytics—into a role-based data-driven experience.

### Core Capabilities

| Capability | Description |
|---|---|
| **Role-Based Auth** | Student, mentor, admin flows with JWT access + refresh tokens |
| **Startup Lifecycle** | Create, manage milestones, track GitHub activity, AI pitch analysis |
| **Mentorship** | Office hours, mentor access requests, impact scoring |
| **Meeting Scheduler** | Conflict-aware slot proposals, Google Calendar sync, Meet links |
| **Barter Marketplace** | Skill/service barter between startups with AI matching |
| **Idea Board** | Community ideas with upvoting and threaded feedback |
| **Open Roles** | Job/role board for startup hiring |
| **Analytics** | Ecosystem health, mentor impact, startup success scoring |
| **Ecosystem Dashboard** | Admin console, public stats, verified badges, featured works |
| **AI Integration** | Gemini-powered pitch analysis, mentor matching, trend radar |

---

## ❗ Problem Statement

Startup ecosystems in colleges and emerging communities are fragmented across messaging apps, spreadsheets, event groups, and disconnected platforms:

- Founders struggle to find mentors, teammates, and opportunities.
- Mentors and investors lack structured visibility into promising teams.
- Students with strong ideas face poor guidance, limited validation, and weak accountability.

This project solves that fragmentation by creating one integrated digital ecosystem hub.

---

## 📐 Repository Architecture

```
startup-ecosystem/
├── apps/
│   ├── frontend/                  # Next.js 16 (App Router)
│   │   ├── app/                   # Route pages (34 routes)
│   │   │   ├── admin/             # Admin console, verifications
│   │   │   ├── analytics/         # Ecosystem health dashboard
│   │   │   ├── calendar/          # Kanban tasks + calendar view
│   │   │   ├── dashboard/         # Student dashboard (role-aware)
│   │   │   ├── discover/          # User discovery + AI matching
│   │   │   ├── ideas/             # Community idea board
│   │   │   ├── login/             # Authentication pages
│   │   │   ├── meetings/          # Meeting manager
│   │   │   ├── mentor/            # Mentor dashboard
│   │   │   ├── mentors/           # Mentor directory + impact
│   │   │   ├── office-hours/      # Office hour bookings
│   │   │   ├── profile/           # User profile (edit/setup/settings)
│   │   │   ├── register/          # Registration + OTP verify
│   │   │   ├── roles/             # Open roles board
│   │   │   ├── showcase/          # Startup showcase
│   │   │   ├── startups/          # Startup CRUD, milestones, pitch deck
│   │   │   ├── trends/            # AI trend radar
│   │   │   ├── globals.css        # Tailwind v4 global styles
│   │   │   ├── layout.tsx         # Root layout (4 Google Fonts)
│   │   │   └── page.tsx           # Landing page
│   │   ├── components/            # 22 reusable components
│   │   │   ├── AIMatches.tsx      # AI mentor/cofounder discovery
│   │   │   ├── Avatar.tsx         # Avatar with initials fallback
│   │   │   ├── DashboardLayout.tsx # Dashboard UI shell
│   │   │   ├── DataPanel.tsx      # Metrics panel + DataCard
│   │   │   ├── EcoTable.tsx       # Table component
│   │   │   ├── EmptyState.tsx     # Empty state placeholder
│   │   │   ├── FilterChip.tsx     # Toggle filter chip
│   │   │   ├── FindMentor.tsx     # Mentor discovery widget
│   │   │   ├── FindTeammate.tsx   # Teammate discovery widget
│   │   │   ├── GamificationWidgets.tsx # Badge grid
│   │   │   ├── GitHubWidget.tsx   # GitHub repo analytics widget
│   │   │   ├── HiringStartups.tsx # Hiring startups filter
│   │   │   ├── LevelUpToast.tsx   # Gamification toast overlay
│   │   │   ├── MeetingCalendarPanel.tsx # Calendar + scheduling
│   │   │   ├── NotificationBell.tsx # Real-time notifications
│   │   │   ├── PressNewsSection.tsx # News/PR grid
│   │   │   ├── ReadmeRenderer.tsx # GitHub README renderer
│   │   │   ├── SkeletonLoader.tsx # Loading placeholders
│   │   │   ├── SkillHeatmap.tsx   # Skill gap heatmap
│   │   │   ├── SubNav.tsx         # Breadcrumbs + tabs
│   │   │   ├── TrendRadar.tsx     # AI trend cards
│   │   │   └── UserCard.tsx       # Profile cards
│   │   ├── lib/
│   │   │   ├── auth.ts            # useAuth() hook
│   │   │   └── axios.ts           # API client with auto-refresh
│   │   ├── proxy.ts               # Edge-level auth proxy
│   │   └── types/index.ts         # Re-exports @startup-ecosystem/shared
│   │
│   └── backend/                   # Express 5 REST API
│       ├── src/
│       │   ├── index.ts           # Entry point: CORS, routes, init
│       │   ├── config/env.ts      # dotenv loader
│       │   ├── controllers/       # 20 controller files (157 exported functions)
│       │   ├── routes/            # 17 route files (~106 API endpoints)
│       │   ├── middleware/
│       │   │   ├── auth.ts        # JWT authenticate + role authorize
│       │   │   └── errorHandler.ts # Global error handler
│       │   ├── services/
│       │   │   ├── cron.ts        # 2 cron jobs (daily snapshot, 6h GitHub refresh)
│       │   │   ├── email.ts       # Nodemailer SMTP (4 email types)
│       │   │   ├── geminiClient.ts # Gemini 2.5 Flash client
│       │   │   ├── githubService.ts # GitHub API integration
│       │   │   ├── googleCalendar.ts # Google Calendar OAuth + events
│       │   │   ├── minio.ts       # S3-compatible object storage
│       │   │   ├── minioDocumentService.ts # PDF text extraction
│       │   │   ├── realtime.ts    # Socket.IO real-time
│       │   │   └── startupAIService.ts # Gemini pitch/trend AI functions
│       │   └── utils/
│       │       ├── jwt.ts         # Token generation + verification
│       │       ├── otp.ts         # 6-digit OTP generation
│       │       └── startupHealth.ts # Pulse + success score calculation
│       └── db/index.ts            # Re-exports prisma + pool
│
├── packages/
│   ├── db/                        # @startup-ecosystem/db
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # 29 models, 14 enums, 41 FKs
│   │   │   ├── seed.ts            # 3 seed users (admin, mentor, student)
│   │   │   └── migrations/        # 1 migration: 20260612182135_init
│   │   └── src/
│   │       ├── index.ts           # PrismaManager singleton
│   │       └── env.ts             # dotenv loader
│   │
│   └── shared/                    # @startup-ecosystem/shared
│       └── src/index.ts           # 11 exported TypeScript types
│
├── database/                      # Legacy raw SQL (for reference only)
│   ├── 01_create_database.sql     # CREATE DATABASE
│   ├── 02_schema.sql              # All tables DDL
│   ├── 03_indexes.sql             # Performance indexes
│   ├── 04_seed_admin.sql          # Legacy seed
│   ├── 05_seed_sample_data.sql    # Sample data
│   └── 06_migrations.sql          # Incremental schema changes
│
├── docker-compose.yml             # MySQL 8.4 service
├── package.json                   # npm workspaces + turbo scripts
├── turbo.json                     # Turbo pipeline (15 tasks)
└── tsconfig.base.json             # Shared TS config (ES2022, strict)
```

---

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| UserProfile : "has extended profile"
    User ||--o| UserGamification : "tracks XP & levels"
    User ||--o{ XpEvent : "generates XP events"
    User ||--o{ OtpCode : "requests OTPs"
    User ||--o{ Startup : "creates startups"
    User ||--o{ StartupMember : "joins startups"
    User ||--o{ StartupMentorAccessRequest : "requests as student"
    User ||--o{ StartupMentorAccessRequest : "receives as mentor"
    User ||--o{ Meeting : "organizes meetings"
    User ||--o{ Meeting : "attends meetings"
    User ||--o{ OfficeHour : "hosts office hours"
    User ||--o{ OfficeHourBooking : "books office hours"
    User ||--o{ Idea : "posts ideas"
    User ||--o{ IdeaFeedback : "provides feedback"
    User ||--o{ PeerReview : "gives reviews"
    User ||--o{ PeerReview : "receives reviews"
    User ||--o{ BarterListing : "creates listings"
    User ||--o{ BarterApplication : "applies to barter"
    User ||--o{ KanbanTask : "owns tasks"
    User ||--o{ OpenRole : "posts roles"
    User ||--o{ RoleApplication : "applies to roles"
    User ||--o{ News : "writes news (admin)"
    User ||--o{ VerificationBadge : "receives badges"
    User ||--o{ VerificationBadge : "grants badges (admin)"
    User ||--o{ FeaturedWork : "creates featured works"
    User ||--o{ PublicMentorSession : "creates sessions"
    User ||--o{ StartupUpvote : "upvotes startups"

    Startup ||--o{ StartupMember : "has members"
    Startup ||--o{ StartupMentorAccessRequest : "receives access requests"
    Startup ||--o{ StartupMilestone : "tracks milestones"
    Startup ||--o{ StartupUpvote : "receives upvotes"
    Startup ||--o{ OpenRole : "has open roles"
    Startup ||--o{ PitchDeck : "has pitch decks"
    Startup ||--o{ BarterListing : "creates barter listings"
    Startup ||--o{ PeerReview : "receives reviews"
    Startup ||--o{ Meeting : "associated with meetings"
    Startup ||--o{ FeaturedWork : "featured in works"
    Startup ||--o| GithubCache : "cached GitHub stats"

    OpenRole ||--o{ RoleApplication : "receives applications"
    BarterListing ||--o{ BarterApplication : "receives applications"
    Idea ||--o{ IdeaFeedback : "has feedback threads"
    OfficeHour ||--o{ OfficeHourBooking : "has bookings"

    TrendsCache ||--|| TrendsCache : "standalone cache"
    EcosystemSnapshot ||--|| EcosystemSnapshot : "standalone analytics"
```

**Notes:**
- **User** is the central entity with 25 outgoing relations—the platform's actor model.
- **Startup** is the second-most connected entity, acting as the aggregation root for startup-specific features.
- Cascade deletes are used throughout; `SET NULL` is applied on optional FKs (meeting startup, badge granter, featured work creator, public session creator).
- All composite/unique constraints prevent double-upvotes, duplicate members, duplicate barter applications, and duplicate booking slots.

---

## 📈 System Metrics

### Backend

| Metric | Count |
|--------|-------|
| Total route files | 17 |
| Total API endpoints | 106 |
| Total controllers | 20 |
| Total exported controller functions | 157 |
| Total service modules | 9 |
| Total middleware | 2 |
| Total utility modules | 3 |
| Total cron jobs | 2 |
| Total environment variables | 28 |

### Database (Prisma)

| Metric | Count |
|--------|-------|
| Total models | 29 |
| Total enums | 14 |
| Total table columns | ~218 |
| Total foreign key constraints | 41 |
| Total unique constraints | 9 |
| Total composite primary keys | 1 |
| Total single-field indexes | 1 |
| Self-referential relations on User | 9 |
| Cascade delete FKs | 36 |
| SET NULL FKs | 5 |

### Frontend

| Metric | Count |
|--------|-------|
| Total page routes | 34 |
| Total reusable components | 22 |
| Total lib modules | 2 |
| Total Google Fonts loaded | 4 |
| Total npm dependencies | 15 |
| Edge proxy routes | 1 |

### Shared Package

| Metric | Count |
|--------|-------|
| Exported TypeScript types | 12 |
| Exported interfaces | 10 |
| Exported type aliases | 2 (Role, generic ApiResponse) |

### Monorepo

| Metric | Count |
|--------|-------|
| Total source files (excl. node_modules/dist) | ~185 |
| Workspace packages | 4 (apps/frontend, apps/backend, packages/db, packages/shared) |
| Turbo tasks defined | 15 |
| User roles | 3 (student, mentor, admin) |
| Deployment services (docker-compose) | 1 (MySQL) |

### API Routes by Module

| Module | Endpoints |
|--------|-----------|
| Public (landing, stats) | 9 |
| Auth (register, login, OTP, refresh) | 8 |
| Profile (read, update, avatar, discovery) | 5 |
| Users | 1 |
| Admin (verification, sessions, featured, news) | 13 |
| Startups (CRUD, milestones, roles, barter, GitHub) | 34 |
| Showcase | 1 |
| Ideas | 5 |
| Roles | 5 |
| Meetings | 8 |
| Office Hours | 8 |
| News | 4 |
| Discover | 1 |
| Dashboard | 1 |
| Calendar (events, Google, tasks) | 10 |
| Analytics (ecosystem, skill gaps, startup) | 5 |
| AI (trends, recommendations, pitch) | 8 |

---

## 🔄 Sequence Diagrams

### Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js (Frontend)
    participant API as Express (Backend)
    participant Prisma
    participant SMTP as SMTP Server

    Note over Browser,SMTP: Registration
    Browser->>NextJS: POST /register (name, email, phone, password, role)
    NextJS->>API: POST /api/auth/send-otp (email, type=register, payload)
    API->>Prisma: Invalidate prior unused OTPs
    API->>Prisma: INSERT otp_code (6-digit code, 10min expiry)
    API->>SMTP: sendMail(email, "Your OTP code: XXXXXX")
    API-->>NextJS: { success: true }
    NextJS-->>Browser: Redirect to /register/verify

    Browser->>NextJS: Enter 6-digit OTP
    NextJS->>API: POST /api/auth/verify-otp (email, code, type=register)
    API->>Prisma: Find valid, unused, non-expired OTP
    alt OTP valid
        API->>Prisma: Mark OTP as used
        API-->>NextJS: { data: { verificationToken } }
        NextJS-->>Browser: Redirect to /register/complete
    else OTP invalid/expired
        API-->>NextJS: 400 error
    end

    Browser->>NextJS: Enter name + password
    NextJS->>API: POST /api/auth/register (verificationToken, name, password)
    API->>Prisma: CREATE user (bcrypt hash, 12 rounds)
    API->>Prisma: CREATE user_profile
    API-->>NextJS: { data: { accessToken, refreshToken } }
    NextJS-->>Browser: Set token, redirect to /dashboard

    Note over Browser,SMTP: Login
    Browser->>NextJS: POST /login (email, password)
    NextJS->>API: POST /api/auth/login
    API->>Prisma: Find user by email
    API->>API: bcrypt.compare(password, hash)
    alt Valid credentials
        API->>API: generateAccessToken ({ id, role }) [15min]
        API->>API: generateRefreshToken ({ id }) [7d]
        API-->>NextJS: { data: { accessToken, refreshToken, user } }
        NextJS-->>Browser: Store token, redirect (role-based)
    else Invalid
        API-->>NextJS: 401 error
    end
```

### Startup Creation Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant API as Express API
    participant Prisma
    participant MinIO

    Browser->>API: POST /api/startups (name, tagline, domain, stage, description)
    Note over API: authenticate middleware
    API->>Prisma: CREATE startup (createdBy = req.user.id)
    API->>Prisma: INSERT startup_member (startup.id, req.user, role='Founder')
    API-->>Browser: { data: { startup } }

    opt Upload Logo
        Browser->>API: POST /api/startups/:id/logo (multipart/form-data)
        API->>MinIO: putObject(startups/logo_{id}.{ext})
        MinIO-->>API: objectName, etag
        API->>Prisma: UPDATE startup (logoUrl, logoObjectName, logoVersion)
        API-->>Browser: { data: { logoUrl } }
    end

    opt Link GitHub Repository
        Browser->>API: POST /api/startups/:id/github (repoUrl)
        API->>API: Parse owner/repo from URL
        API->>Prisma: UPDATE startup (githubRepoUrl, githubRepoOwner, githubRepoName)
        API->>GitHub: GET /repos/:owner/:repo (commits, contributors, languages)
        GitHub-->>API: Repo data
        API->>Prisma: UPSERT github_cache
        API-->>Browser: { data: { repo } }
    end

    opt Post First Open Role
        Browser->>API: POST /api/startups/:id/roles (title, skills, description)
        API->>Prisma: CREATE open_role
        API-->>Browser: { data: { role } }
    end
```

### Meeting Scheduling Workflow

```mermaid
sequenceDiagram
    participant Organizer
    participant API as Express API
    participant Prisma
    participant SMTP
    participant Google as Google Calendar
    participant Attendee

    Organizer->>API: POST /api/meetings (attendeeId, title, proposedSlots[3])
    API->>Prisma: CREATE meeting (status=pending)
    API->>SMTP: sendMeetingRequestedEmail(to=attendee, fromName, title)
    API-->>Organizer: { data: { meeting } }
    Note over Attendee: Email notification sent

    Attendee->>API: PATCH /api/meetings/:id/confirm (selectedSlotIndex)
    API->>Prisma: Check for time conflicts
    alt Conflict detected
        API-->>Attendee: 409 Conflict
    else No conflict
        API->>Prisma: UPDATE meeting (status=confirmed, confirmedSlot, confirmedEnd)
        opt User has Google Calendar connected
            API->>Google: createCalendarEvent(refreshToken, summary, start, end, attendees)
            alt No meeting link provided
                Google-->>API: { meetLink: "https://meet.google.com/..." }
                API->>Prisma: UPDATE meeting (meetingLink)
            end
        else No Google Calendar
            API->>API: Generate Jitsi meet link
            API->>Prisma: UPDATE meeting (meetingLink)
        end
        API->>SMTP: sendMeetingStatusEmail(to=both, title, 'confirmed', time)
        API-->>Attendee: { data: { meeting, meetingLink } }
    end
```

### Barter Matchmaking Flow

```mermaid
sequenceDiagram
    participant FounderA as Startup A Founder
    participant API
    participant Prisma
    participant FounderB as Startup B Founder

    FounderA->>API: POST /api/startups/:id/barter (offer, need, details)
    API->>Prisma: CREATE barter_listing (status=open, createdBy=user)
    API-->>FounderA: { data: { listing } }

    FounderB->>API: GET /api/startups/:id/barter/matches
    API->>Prisma: Find own needs, other startups' offers
    API->>API: Text matching (keyword overlap scoring)
    API-->>FounderB: { data: [{ matchingListing, matchScore, matchedTerms }] }

    FounderB->>API: POST /api/startups/:id/barter/:listingId/apply (message)
    API->>Prisma: INSERT barter_application (status=pending)
    API-->>FounderB: { data: { application } }

    FounderA->>API: GET /api/startups/:id/barter/:listingId/applications
    API->>Prisma: Find applications with applicant profile
    API-->>FounderA: { data: [{ application, applicant }] }

    FounderA->>API: PATCH application status (accept/reject)
    API->>Prisma: UPDATE barter_application (status)
    API-->>FounderA: { data: { application } }
```

### AI Pitch Deck Generation (SSE Streaming)

```mermaid
sequenceDiagram
    participant Browser
    participant API as Express API
    participant Gemini as Gemini 2.5 Flash
    participant Prisma

    Browser->>API: POST /api/startups/:id/analyze-pitch
    API->>MinIO: getObject(pitchPdf)
    MinIO-->>API: PDF Buffer
    API->>API: pdf-parse extracts text
    API->>Gemini: analyzePitchTextWithAI(pitchText)
    Gemini-->>API: { clarity, market_size, value_proposition, overall_summary }
    API-->>Browser: { data: { analysis } }

    Browser->>API: POST /api/startups/:id/generate-outline
    API->>Prisma: Fetch startup data
    API->>Gemini: generatePitchOutlineWithAI(startupInfo)
    Gemini-->>API: [{ slide_number, title, objective, bullets }]
    API-->>Browser: { data: { outline } }

    Browser->>API: POST /api/startups/:id/pitch/:startupId/generate
    Note over API: SSE streaming
    API->>Prisma: Fetch startup data
    API->>Gemini: generateStreamFromGemini(prompt)
    Note over API,Gemini: AsyncGenerator yields chunks
    loop Each chunk
        Gemini-->>API: delta text
        API-->>Browser: SSE event: chunk text
    end
    API->>Prisma: INSERT pitch_deck (content={fullSlides}, version=N)
    API-->>Browser: SSE event: done with deck ID
```

### Email Queue / Background Processing

```mermaid
sequenceDiagram
    participant Controller as Express Controller
    participant Prisma
    participant SMTP as SMTP Server
    participant User

    Controller->>Controller: Trigger (meeting created / status change / booking)
    Controller->>Prisma: Execute primary operation
    alt Email configured (SMTP_HOST set)
        Controller->>SMTP: sendMail() [non-blocking, errors caught]
        alt Success
            SMTP-->>User: Email delivered
        else Failure
            SMTP-->>Controller: Error logged, not propagated
        end
    else Email not configured
        Note over Controller: Silently skip (no error)
    end
    Controller-->>Client: Return API response immediately
```

### Showcase / Featured Work Flow

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant Prisma
    participant PublicUser as Public Visitor

    Admin->>API: POST /api/admin/featured-work (startupId, headline, summary, heroImage, ctaUrl)
    Note over Admin: authenticate + authorize('admin')
    API->>Prisma: CREATE featured_work
    API-->>Admin: { data: { work } }

    Admin->>API: PATCH /api/admin/featured-work/:id/toggle (isActive toggle)
    API->>Prisma: UPDATE featured_work (isActive = !isActive)
    API-->>Admin: { data: { work } }

    PublicUser->>API: GET /api/public/showcase
    Note over PublicUser: No auth required
    API->>Prisma: Find active featured works with startup info
    alt Has featured works
        API-->>PublicUser: { data: [{ work, startup }] }
    else Fallback
        API->>Prisma: Find top-upvoted startups
        API-->>PublicUser: { data: fallbackStartups }
    end
```

### File Upload Flow (Avatar / Logo)

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js Frontend
    participant API as Express API
    participant MinIO
    participant Prisma

    Browser->>NextJS: Select file via input (multipart/form-data)
    NextJS->>API: POST /api/profile/avatar (FormData: avatar file)
    Note over API: authenticate middleware
    Note over API: multer single('avatar') parses multipart
    API->>MinIO: putObject(bucket, "avatars/avatar_{userId}_{timestamp}.{ext}", buffer, size, contentType)
    MinIO-->>API: etag
    API->>API: buildObjectUrl(bucket, objectName)
    API->>Prisma: UPSERT user_profiles (avatarUrl = presigned URL)
    API-->>NextJS: { data: { avatarUrl } }
    NextJS-->>Browser: Update avatar display
```

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router) |
| UI Runtime | React 19.2.4 |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS v4 + PostCSS |
| Icons | lucide-react |
| Charts | recharts |
| Drag & Drop | @dnd-kit |
| Markdown | react-markdown + remark-gfm |
| Mermaid | mermaid (client-side diagram render) |
| Confetti | canvas-confetti |
| Real-time | socket.io-client |
| Auth | JWT (access + refresh tokens) |
| Fonts | Playfair Display, Space Grotesk, Source Serif 4, Bebas Neue |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (via ts-node-dev) |
| Framework | Express 5 |
| Language | TypeScript 5.x |
| Auth | jsonwebtoken + bcrypt (12 salt rounds) |
| ORM | Prisma 6.19 |
| Database | MySQL 8.4 (mysql2) |
| Email | nodemailer (SMTP) |
| AI | @google/generative-ai (Gemini 2.5 Flash) |
| Object Storage | MinIO (S3-compatible) |
| Real-time | Socket.IO |
| Calendar | googleapis (Calendar v3) |
| GitHub | GitHub REST API |
| PDF | pdf-parse |
| HTTP Client | axios |
| File Upload | multer |
| Scheduling | node-cron |

### Infrastructure
| Layer | Technology |
|---|---|
| Monorepo | npm workspaces |
| Task Runner | Turbo 2.x |
| Database Container | Docker (MySQL 8.4) |
| Package Manager | npm 11.x |
| CI/CD | GitHub (via git remote) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 11+
- MySQL 8.0+ (native or Docker)
- Git

### Option A: Local MySQL

```bash
# 1. Clone & install
git clone https://github.com/Rishit1769/Digital-Platform-for-Startup-Ecosystem.git
cd Digital-Platform-for-Startup-Ecosystem
npm install

# 2. Configure environment
cp .env.example .env                # Root env vars
cp apps/backend/.env.example .env   # Backend specific (create if needed)

# 3. Set up database (Prisma will create tables)
npm run db:migrate                  # Apply migrations

# 4. Seed initial data
npm run db:seed                     # Creates admin, mentor, student users

# 5. Start development
npm run dev                         # Turbo runs frontend + backend
```

### Option B: Docker MySQL

```bash
# 1. Start MySQL container
docker compose up -d

# 2. Update .env for Docker port
#    DATABASE_URL="mysql://root:startup123@localhost:3307/startup_ecosystem"

# 3. Follow steps 1-5 from Option A above
```

### Default Seed Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@startup-ecosystem.com | Admin@123 |
| Mentor | mentor@startup-ecosystem.com | Mentor@123 |
| Student | student@startup-ecosystem.com | Student@123 |

> ⚠️ Change all default passwords immediately in production.

---

## 🗄️ Prisma-Managed Database

This project uses **Prisma 6** as the ORM and migration tool. The schema lives in `packages/db/prisma/schema.prisma` and the Prisma client is shared across the monorepo via the `@startup-ecosystem/db` workspace package.

### Connection String

Configure `DATABASE_URL` in one of these locations (checked in order):

1. `packages/db/.env` — Prisma-specific (overrides others)
2. `apps/backend/.env` — Backend runtime
3. Root `.env` — Fallback

### Migration Commands

```bash
# Development: create + apply migration
npm run db:migrate                              # prisma migrate dev

# Production: apply pending migrations
npm run db:migrate:deploy                       # prisma migrate deploy

# Validate schema without applying
npm run db:validate                             # prisma validate

# View migration status
npm run db:status --workspace=packages/db       # prisma migrate status

# Reset database (destroys all data)
npm run db:reset                                # prisma migrate reset

# Generate Prisma Client (auto-runs on npm install)
npm run db:generate                             # prisma generate

# Open Prisma Studio GUI
npm run db:studio                               # prisma studio

# Seed database with sample data
npm run db:seed                                 # ts-node prisma/seed.ts
```

### Migration History

| Migration | Name | Applied | Content |
|-----------|------|---------|---------|
| `20260612182135_init` | init | ✅ Current | Full initial schema: 29 tables, 41 FKs, utf8mb4 |

### Legacy SQL Scripts

The `database/` directory contains raw SQL scripts from the project's pre-Prisma era. These are preserved for reference. **Do not use them for new setups** — use the Prisma migration flow instead. The scripts are:

- `01_create_database.sql` — CREATE DATABASE IF NOT EXISTS
- `02_schema.sql` — Full DDL for all 27 tables (legacy, 2 fewer than Prisma)
- `03_indexes.sql` — Full-text and performance indexes
- `04_seed_admin.sql` — Legacy admin seed (admin@gmail.com / rishit@159753)
- `05_seed_sample_data.sql` — Demo data for development
- `06_migrations.sql` — Incremental ALTER TABLE statements for existing databases

### Schema Overview (29 Models)

| # | Model | Table | Domain |
|---|-------|-------|--------|
| 1 | User | users | Core accounts |
| 2 | UserProfile | user_profiles | Extended profile |
| 3 | UserGamification | user_gamification | XP, levels, badges |
| 4 | XpEvent | xp_events | Gamification audit log |
| 5 | OtpCode | otp_codes | Auth OTPs |
| 6 | TrendsCache | trends_cache | AI trend cache |
| 7 | Startup | startups | Core startup records |
| 8 | StartupMember | startup_members | Memberships |
| 9 | StartupMentorAccessRequest | startup_mentor_access_requests | Mentor access |
| 10 | StartupMilestone | startup_milestones | Stage milestones |
| 11 | StartupUpvote | startup_upvotes | Upvotes (composite PK) |
| 12 | OpenRole | open_roles | Hiring roles |
| 13 | RoleApplication | role_applications | Role applications |
| 14 | PitchDeck | pitch_decks | AI-generated decks |
| 15 | BarterListing | barter_listings | Skill barter offers |
| 16 | BarterApplication | barter_applications | Barter applications |
| 17 | Idea | ideas | Idea board |
| 18 | IdeaFeedback | idea_feedback | Idea comments |
| 19 | PeerReview | peer_reviews | 1–5 star reviews |
| 20 | Meeting | meetings | Meeting scheduling |
| 21 | OfficeHour | office_hours | Recurring slots |
| 22 | OfficeHourBooking | office_hour_bookings | Slot bookings |
| 23 | VerificationBadge | verification_badges | Admin badges |
| 24 | FeaturedWork | featured_works | Showcase items |
| 25 | KanbanTask | kanban_tasks | Personal task board |
| 26 | EcosystemSnapshot | ecosystem_snapshots | Daily analytics |
| 27 | News | news | Platform news |
| 28 | GithubCache | github_cache | Cached repo stats |
| 29 | PublicMentorSession | public_mentor_sessions | Public sessions |

All tables use `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`.

---

## 📡 API Reference

All endpoints are mounted under `/api`. Authentication is via `Authorization: Bearer <token>` header, with refresh tokens sent as httpOnly cookies.

### Public (No Auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/public/stats` | Landing page ecosystem stats |
| GET | `/api/public/showcase` | Featured works / top startups |
| GET | `/api/public/mentors` | Top mentors |
| GET | `/api/public/ticker` | Recent activity ticker |
| GET | `/api/public/sessions` | Active mentor sessions |
| POST | `/api/public/sessions/:id/join` | Join a session |
| GET | `/api/public/startups` | Public startup directory |
| GET | `/api/public/mentors-list` | Full mentor directory |
| GET | `/api/public/ideas` | Public ideas list |
| GET | `/api/news` | News feed |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/send-otp` | Send OTP for register/forgot-password |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/register` | Complete registration via verification token |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Clear refresh cookie |
| PATCH | `/api/auth/reset-password` | Reset password with verification token |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Protected (Auth Required)

Full route documentation is available in the source at `apps/backend/src/routes/`. Key module groupings:

| Module | Base Path | Endpoints |
|--------|-----------|-----------|
| Profile | `/api/profile` | 5 endpoints (me, avatar, discovery, user) |
| Users | `/api/users` | 1 endpoint (reviews) |
| Admin | `/api/admin` | 13 endpoints (verification, sessions, featured) |
| Startups | `/api/startups` | 34 endpoints (full CRUD + milestones + barter + GitHub + AI) |
| Showcase | `/api/showcase` | 1 endpoint (list) |
| Ideas | `/api/ideas` | 5 endpoints (CRUD, upvote, feedback) |
| Roles | `/api/roles` | 5 endpoints (apply, manage) |
| Meetings | `/api/meetings` | 8 endpoints (create, confirm, status, reschedule) |
| Office Hours | `/api/office-hours` | 8 endpoints (CRUD, book, cancel) |
| News | `/api` | 4 endpoints (news + settings) |
| Discover | `/api/discover` | 1 endpoint (user search) |
| Dashboard | `/api/dashboard` | 1 endpoint (feed) |
| Calendar | `/api/calendar` | 10 endpoints (events, Google, tasks) |
| Analytics | `/api/analytics` | 5 endpoints (ecosystem, skill gaps, startup) |
| AI | `/api/ai` | 8 endpoints (trends, recommendations, pitch) |

---

## 🏗️ Deployment Topology

```mermaid
graph TB
    subgraph Browser["Browser"]
        UI[Next.js App]
    end

    subgraph Edge["Edge / CDN"]
        PROXY[Next.js Edge Proxy]
        PROXY -->|Auth check| ROUTE{Has refresh cookie?}
        ROUTE -->|No| LOGIN[Redirect /login]
        ROUTE -->|Yes| DECODE[Decode JWT role]
        DECODE -->|student| DASH[/dashboard]
        DECODE -->|mentor| MENTOR[/mentor]
        DECODE -->|admin| ADMIN[/admin]
    end

    subgraph Application["Application Layer"]
        NEXT[Next.js Server]
        EXPRESS[Express API Server :5000]
        WS[Socket.IO Server]
    end

    subgraph Storage["Storage Layer"]
        DB[(MySQL 8.4<br/>startup_ecosystem)]
        MINIO[MinIO<br/>S3-Compatible]
        REDIS[Redis Cache<br/>(AI Trends)]
    end

    subgraph External["External Services"]
        GMAIL[SMTP / Gmail]
        GG_CAL[Google Calendar API]
        GG_AI[Gemini 2.5 Flash]
        GH[GitHub REST API]
    end

    Browser -->|HTTP/HTTPS :3000| NEXT
    NEXT -->|Server Actions| EXPRESS
    Browser -->|API Calls :5000/api| EXPRESS
    Browser -->|WebSocket| WS

    EXPRESS -->|Prisma ORM| DB
    EXPRESS -->|mysql2 pool| DB
    EXPRESS -->|get/putObject| MINIO
    EXPRESS -->|nodemailer| GMAIL
    EXPRESS -->|googleapis| GG_CAL
    EXPRESS -->|@google/generative-ai| GG_AI
    EXPRESS -->|axios| GH

    WS -->|emitToUser| Browser

    MINIO -->|Build Object URL| CDN[CDN / Public URL]
```

### Request Flow

1. **Page request**: Browser → Next.js server (renders SSG/SSR pages)
2. **API call**: Browser/Next.js → Express API `:5000/api/*` with JWT in `Authorization` header and refresh token in `httpOnly` cookie
3. **Auth validation**: Express `authenticate` middleware verifies JWT → attaches `req.user` → controller reads user from `req.user.id`
4. **Database access**: Controllers use `prisma` (from `@startup-ecosystem/db`) or `pool` (mysql2) for data operations
5. **External calls**: AI (Gemini), email (SMTP), calendar (Google), GitHub API are async and non-blocking
6. **File uploads**: Multipart → multer → MinIO → URL stored in database
7. **Real-time**: Socket.IO rooms (`user:{userId}`) for notifications

---

## 🧩 Architecture Decision Records

### ADR-001: Why Next.js (App Router)

**Decision**: Use Next.js 16 with App Router for the frontend.

| Aspect | Detail |
|--------|--------|
| Rationale | App Router provides server components, streaming, and edge runtime. The landing page (`/`) fetches public data via server components; authenticated pages use `useAuth()` client hook. |
| Tradeoff | No API routes in Next.js — all data goes to Express backend. This separates concerns cleanly (Next.js = UI, Express = API) but adds network latency. |
| Alternative | Remix, Create React App, Vite. Not chosen because App Router's server components and streaming are critical for the data-heavy dashboard. |

### ADR-002: Why Prisma (with mysql2 fallback)

**Decision**: Use Prisma 6 as the primary ORM, with a mysql2 connection pool as fallback for legacy raw SQL queries.

| Aspect | Detail |
|--------|--------|
| Rationale | Prisma provides type-safe queries, auto-generated client, migrations, and a shared DB package across the monorepo. The mysql2 pool exists because ~60% of controller code still uses raw SQL queries. |
| Tradeoff | Dual database access pattern — some code uses `prisma.user.findUnique()` while other code uses `pool.query('SELECT ...')`. This creates inconsistency and potential desync. |
| Migration Path | Convert raw SQL controllers to Prisma queries incrementally. New code should use Prisma exclusively. |

### ADR-003: Why MySQL (vs PostgreSQL)

**Decision**: Use MySQL 8.4 with InnoDB engine.

| Aspect | Detail |
|--------|--------|
| Rationale | Existing project data and infrastructure were MySQL-based. MySQL's JSON column type, ENUM support, and utf8mb4 collation meet all requirements. |
| Tradeoff | No native array type (stored as JSON), no native UUID type (using auto-increment ints), no partial indexes, no `RETURNING` clause. None of these are blocking for this domain. |
| Alternative | PostgreSQL would offer richer data types. The Prisma schema could be migrated to PG with minimal changes. |

### ADR-004: Why MinIO (vs AWS S3)

**Decision**: Use MinIO for S3-compatible object storage.

| Aspect | Detail |
|--------|--------|
| Rationale | Self-hosted, S3-compatible API, free, zero external dependency for development. Supports optional CDN base URL configuration. |
| Tradeoff | Not scalable without additional infrastructure; no built-in CDN. For production, configure `MINIO_CDN_BASE_URL` to point to a CloudFront/Cloudflare distribution. |
| Feature flag | `MINIO_ENABLED=false` disables MinIO entirely (development mode without file storage). |

### ADR-005: Why JWT (Two-Token SSO)

**Decision**: Use access token (15min) + refresh token (7 day, httpOnly cookie) pattern.

| Aspect | Detail |
|--------|--------|
| Rationale | Stateless auth scalable across instances. Short-lived access tokens minimize exposure. httpOnly refresh cookie prevents XSS token theft. |
| Tradeoff | No server-side session revocation — compromised refresh token is valid until expiry. Mitigated by keeping refresh window to 7 days. |
| Auto-refresh | Frontend's `lib/axios.ts` auto-refreshes on 401 — transparent to users. |

### ADR-006: Why Standalone Deployment (Single Express Process)

**Decision**: Express backend runs as a single Node process with Socket.IO attached to the same HTTP server.

| Aspect | Detail |
|--------|--------|
| Rationale | Simplicity — no separate WebSocket server, no message broker. Socket.IO shares the same port as Express (via `createServer`). |
| Tradeoff | Not horizontally scalable without sticky sessions or a Redis-backed Socket.IO adapter. For production, deploy behind a load balancer with `socket.io-redis` adapter. |
| Cron | Two node-cron jobs run in-process. For production, consider extracting into a separate worker. |

### ADR-007: Why Background Email (Fire-and-Forget)

**Decision**: Email sending is non-blocking within the request cycle — errors are caught and logged, not returned to the client.

| Aspect | Detail |
|--------|--------|
| Rationale | Email delivery is not critical to API success (the DB operation already succeeded). Returning email errors to the client would create unnecessary failure surface. |
| Tradeoff | No retry mechanism for failed email sends. Failed emails are silently dropped. |
| Improvement | Implement a proper email queue (Bull/BullMQ with Redis) for reliable delivery. |

### ADR-008: Why Gemini 2.5 Flash (AI Provider)

**Decision**: Use Google's Gemini 2.5 Flash model for all AI features.

| Aspect | Detail |
|--------|--------|
| Rationale | Generous free tier, low latency, JSON output mode, streaming support for pitch deck generation. |
| Tradeoff | Single provider lock-in. All AI calls go through `geminiClient.ts` which could be refactored to support multiple providers. |
| Rate limit | Mentor recommendations have a 10-request-per-hour rate limit (`aiController.ts`). |

### ADR-009: Why Turborepo + npm Workspaces

**Decision**: Use Turborepo for task orchestration with npm workspaces for package management.

| Aspect | Detail |
|--------|--------|
| Rationale | Turborepo provides caching, parallel execution, and dependency-aware task ordering. npm workspaces ships with npm 11 (no extra install). |
| Tradeoff | Turbo's local caching can cause stale builds. All DB tasks explicitly set `cache: false`. |
| `packageManager` | `npm@11.9.0` is pinned via `package.json` to ensure consistent behavior. |

---

## 📊 Monitoring & Observability

### Current Implementation

| Area | Mechanism | Detail |
|------|-----------|--------|
| **Database** | Prisma logging | `development`: query, info, warn, error. `production`: error only. Via `PrismaManager.createPrismaClient()`. |
| **API Errors** | Express error handler | `middleware/errorHandler.ts` logs stack traces, returns `{ success: false, error }` with appropriate status codes. |
| **Email** | Console logging | Failed sends are caught and logged with `console.error`. No persistent email log. |
| **MinIO** | Error logging | Connection failures logged during `initializeMinio()`. Respects `MINIO_STRICT` flag. |
| **Cron** | Console logging | Snapshot and GitHub refresh jobs log success/failure counts. |
| **WebSocket** | Socket.IO | Events emitted for `member_invite` and `mentor_access_request`. No metric tracking. |
| **AI** | Rate limiting | `aiController.ts` logs rate limit hits. No persistent metric. |

### Recommended Improvements

| Area | Recommendation | Priority |
|------|---------------|----------|
| **Structured Logging** | Replace `console.log/error` with a structured logger (pino, winston) that outputs JSON with correlation IDs. | High |
| **APM** | Add OpenTelemetry instrumentation for Express, Prisma, and external HTTP calls. | Medium |
| **Database Metrics** | Expose Prisma connection pool stats via `/api/admin/metrics` (or a health endpoint). | Low |
| **Queue Monitoring** | If implementing an email queue (Bull), add Bull Board for real-time queue visibility. | Medium |
| **Dashboard** | Add a `/api/admin/metrics` endpoint returning: active users, daily API calls, error rate, email success rate. | Medium |
| **Health Check** | Current `/api/health` is trivial. Enhance to check DB connectivity (`PrismaManager.healthCheck()`), MinIO reachability, and SMTP connectivity. | High |
| **Log Retention** | Use environment-specific log rotation or ship to a centralized logging service (Datadog, Grafana Loki, ELK). | Medium |

---

## ⚠️ Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Database Failure** (MySQL crash/network) | **Critical** — entire platform unavailable. Data loss if unreplicated. | Low (MySQL is battle-tested) | PrismaManager with 3-retry exponential backoff. Docker healthcheck. Regular backups. |
| **SMTP Outage** | **Medium** — email notifications fail silently. Auth OTPs, meeting invites, password resets stop working. | Moderate (SMTP relays fail) | Non-blocking email (errors caught, not propagated). Users can retry OTP. Add email queue with retry. |
| **MinIO Outage** | **Medium** — avatar/logos/news images stop uploading/displaying. | Low (MinIO is stable) | `MINIO_ENABLED=false` disables file operations entirely. Graceful degradation — existing URLs still serve. |
| **Authentication Outage** (JWT secret compromise) | **Critical** — all tokens forgeable. Full account access. | Very Low | Secrets must be rotated, unique per environment, never committed. Short 15min access token window limits damage. |
| **Gemini API Key Expiry / Rate Limit** | **Low-Medium** — AI features (pitch analysis, recommendations, trend radar) degrade or fail. | Moderate (free tier limits) | All AI calls are non-critical. Trend radar has 24h cache. Rate limit (10/h) is explicit. User-facing fallbacks display cached/empty states. |
| **Deployment Failure** | **Medium** — broken build released, causing downtime or partial functionality. | Low with CI | Monorepo structure enables scoped deployment. Turbo catches build errors. |
| **Misconfiguration** (wrong .env values, CORS misconfig) | **Medium-High** — cross-origin errors, wrong database targeted, email sent from wrong domain. | Moderate | `.env.example` templates document every variable. FRONTEND_URL controls CORS explicitly. |

---

## 🧹 Technical Debt Register

| # | Issue | Location | Impact | Priority |
|---|-------|----------|--------|----------|
| 1 | **Raw SQL in controllers** | 15 controllers use `pool.query()` instead of Prisma | Inconsistent data access, no type safety, harder to maintain. This is the largest debt item (~60% of controllers). | High |
| 2 | **Missing `mysql2` dependency declaration** | `packages/db` imports `dotenv` in `src/env.ts` but never declares it | Works via hoisting from root, but breaks if `packages/db` is installed independently. | Low |
| 3 | **Duplicate shared type files** | `packages/shared/types.ts` duplicates `packages/shared/src/index.ts` | Confusion about the canonical source — `types.ts` contains identical code but is not compiled by tsconfig. | Low |
| 4 | **No email queue** | `services/email.ts` is fire-and-forget | Failed email sends go unreported; no retry mechanism. | Medium |
| 5 | **Console-based logging** | `console.log/error` throughout the codebase | No log levels, no structured output, no correlation IDs. Makes debugging in production difficult. | High |
| 6 | **No automated tests** | No test files found in any workspace package | Zero test coverage. Regression risk on every change. | Critical |
| 7 | **No CI/CD pipeline** | Only `git push origin main` | No automated build, lint, or test gates. | High |
| 8 | **No TypeScript project references** | `tsconfig.base.json` uses deprecated `moduleResolution: "Node"` | TypeScript 5.0 deprecation warning suppressed via `ignoreDeprecations: "5.0"`. Should migrate to `Node16`/`NodeNext`. | Medium |
| 9 | **Seed password hardcoded** | `package.json` preinstall script kills all Node processes | Aggressive cleanup could kill other running Node apps on the dev machine. | Low |
| 10 | **No database migration rollback strategy** | Migrations use `prisma migrate dev` | Production rollback is manual (no migration down files). | Medium |
| 11 | **Missing input validation** | Controllers trust `req.body` | No schema validation on request payloads. Mitigated by Prisma's server-side validation for DB operations. | Medium |
| 12 | **Gamification engine inactive** | `UserGamification` and `XpEvent` models exist, `LevelUpToast` component exists | No code emits `levelUp` events — gamification is structurally present but functionally dead. The `LevelUpToast` listens for a custom `levelUp` window event that is never dispatched. | Low |
| 13 | **Rate limiting for AI** | Only `recommendMentors` has explicit rate limit (10/h) | Other AI endpoints (`recommendCofounders`, `recommendTeammates`) have no protection against abuse. | Medium |

---

## 🤝 Contributing

### Development Workflow

```bash
# Install dependencies (also generates Prisma client)
npm install

# Run both frontend + backend in dev mode
npm run dev

# Run frontend only
npm run dev --workspace=apps/frontend

# Run backend only
npm run dev --workspace=apps/backend

# Apply new Prisma migration after schema change
npm run db:migrate

# Build all packages
npm run build
```

### Code Style

- TypeScript strict mode enforced via `tsconfig.base.json`
- All new database code should use Prisma, not raw SQL via `pool`
- API responses follow `{ success: boolean, data?: T, error?: string }` convention
- Environment variables documented in `.env.example` before use

### Commit Convention

This project uses conventional commits:

```
feat: new feature
fix: bug fix
refactor: code change without feature/fix
docs: documentation only
chore: tooling, config, dependencies
```

---

*Generated from repository state at commit `df63780` (feat: restructure into monorepo with production-grade Prisma integration).*
