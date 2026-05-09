# Digital Platform for Startup Ecosystem

## 🚀 Project Overview
Digital Platform for Startup Ecosystem is a full-stack collaboration platform that connects students, founders, mentors, and ecosystem enablers in one structured workspace.
It streamlines discovery, mentorship, meeting scheduling, idea validation, and startup tracking through a role-based, data-driven experience.
This matters because early-stage teams often fail due to fragmented tools, poor networking access, and weak execution visibility.

## ❗ Problem Statement
Startup ecosystems, especially in colleges and emerging communities, are often fragmented across messaging apps, spreadsheets, event groups, and disconnected platforms.

- Founders struggle to find the right mentors, teammates, and opportunities.
- Mentors and investors lack structured visibility into promising teams.
- Students with strong ideas face poor guidance, limited validation pathways, and weak accountability loops.

This project solves that fragmentation by creating one integrated digital ecosystem hub.

## 🎯 Importance
Solving this problem improves startup success probability by making support systems discoverable, measurable, and actionable.

- Increases collaboration velocity between stakeholders.
- Reduces mentorship and networking friction.
- Improves decision-making using analytics and structured progress data.
- Creates stronger pipelines from idea stage to execution and showcase readiness.

## 🔄 Workflow / How It Works
1. User registers and logs in with role-based access (student, mentor, admin, etc.).
2. User completes profile and explores relevant ecosystem modules.
3. Founders/students create ideas, manage milestones/tasks, and track progress.
4. Mentors and peers discover startups and connect through guided interactions.
5. Meetings are scheduled via built-in calendar workflows with optional auto-generated Google Meet links.
6. Platform analytics and dashboard modules surface engagement, growth, and ecosystem trends.
7. Admin tools monitor quality, moderation, and platform-level operations.

## ⚙️ Features & Core Logic
### Key Features
- Role-based authentication and protected routes.
- Startup and idea management workflows.
- Mentor and participant discovery modules.
- Meeting scheduler with calendar sync support.
- News/trends/discover sections for ecosystem awareness.
- Dashboard and analytics for activity and progress tracking.
- Profile and settings management.
- Admin controls for moderation and ecosystem governance.
- AI-assisted modules for smarter recommendations and insights.

### Core Logic
- Role-aware authorization controls visibility and actions across modules.
- Conflict-aware meeting scheduling prevents overlapping confirmed slots.
- Calendar integration syncs meeting events and supports Meet link handling.
- Analytics aggregation provides actionable KPIs from platform activity.
- Modular API architecture separates controllers, routes, services, and middleware for maintainability.

## 🛠️ Tech Stack
### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS (or utility-first styling patterns)

### Backend
- Node.js
- Express.js
- TypeScript
- REST API architecture

### Database
- MySQL (via mysql2)

### Tools / APIs / Libraries
- Google Calendar API (event sync, meeting links)
- Axios (API communication)
- ESLint + TypeScript tooling
- Authentication middleware and custom service modules
- Optional AI integrations (Gemini-based service modules)

## 📸 Demo / Screenshots
### Live Demo
- Demo Link: [Add Live URL Here](https://example.com)

### Screenshots
- Dashboard View: ![Dashboard Screenshot](./docs/screenshots/dashboard.png)
- Meeting Scheduler: ![Meeting Scheduler Screenshot](./docs/screenshots/meeting-scheduler.png)
- Discover/Startup Listing: ![Discover Screenshot](./docs/screenshots/discover.png)

## 💡 Unique Selling Proposition (USP)
- End-to-end startup ecosystem workflow in one platform, not just a single-purpose tool.
- Combines collaboration, mentorship, scheduling, discovery, and analytics in a unified experience.
- Built with role intelligence and ecosystem context, making it highly suitable for incubators, colleges, and startup communities.
- Practical balance of operational features plus AI-enabled insights.

## 🔮 Future Scope
- Reputation and trust scoring for contributors and mentors.
- Advanced startup health scoring and predictive risk analytics.
- Multi-tenant support for universities, incubators, and accelerators.
- In-app messaging and notification orchestration.
- Public startup showcase pages with investor-ready metrics.
- Mobile app support and offline-first capabilities.
- Deeper integrations: GitHub, Slack, LinkedIn, and funding platforms.

---

## 🗄️ Database Setup

### Prerequisites
- MySQL 8.0+ running locally (or accessible via TCP)
- A MySQL user with `CREATE`, `ALTER`, `INDEX`, and `INSERT` privileges

### Connection
```
Host     : 127.0.0.1 (use -h 127.0.0.1, NOT localhost, to force TCP)
User     : rishit@vm
Database : startup_ecosystem
```

### Running the Scripts (in order)

```bash
# 1. Create the database
mysql -h 127.0.0.1 -u 'rishit@vm' -p < database/01_create_database.sql

# 2. Create all 27 tables (full DDL)
mysql -h 127.0.0.1 -u 'rishit@vm' -p < database/02_schema.sql

# 3. Add full-text & performance indexes (idempotent — safe to re-run)
mysql -h 127.0.0.1 -u 'rishit@vm' -p < database/03_indexes.sql

# 4. Seed the default admin user
mysql -h 127.0.0.1 -u 'rishit@vm' -p < database/04_seed_admin.sql

# 5. (Optional) Seed demo / development sample data — DO NOT run in production
mysql -h 127.0.0.1 -u 'rishit@vm' -p < database/05_seed_sample_data.sql

# 6. Run incremental migrations (safe for existing databases, idempotent)
mysql -h 127.0.0.1 -u 'rishit@vm' -p < database/06_migrations.sql
```

### Schema Overview

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Core accounts (student / mentor / admin) |
| 2 | `otp_codes` | Temporary OTP codes for auth flows |
| 3 | `user_profiles` | Extended profile data |
| 4 | `user_gamification` | XP / level / badge tracking |
| 5 | `trends_cache` | AI trend lookup cache |
| 6 | `startups` | Core startup records |
| 7 | `startup_members` | User ↔ startup membership with roles |
| 8 | `startup_mentor_access_requests` | Mentor access requests |
| 9 | `startup_milestones` | Stage-based milestones |
| 10 | `startup_upvotes` | One upvote per user per startup |
| 11 | `open_roles` | Open positions within startups |
| 12 | `role_applications` | Applications to open roles |
| 13 | `pitch_decks` | AI-generated pitch deck content |
| 14 | `barter_listings` | Skill-barter marketplace listings |
| 15 | `barter_applications` | Applications to barter listings |
| 16 | `ideas` | Community idea board |
| 17 | `idea_feedback` | Comments / feedback on ideas |
| 18 | `peer_reviews` | Peer-to-peer reviews (1–5 stars) |
| 19 | `meetings` | One-on-one meeting scheduling |
| 20 | `office_hours` | Mentor recurring weekly office hours |
| 21 | `office_hour_bookings` | Student bookings for office hours |
| 22 | `verification_badges` | Admin-granted verification badges |
| 23 | `featured_works` | Featured / showcase works |
| 24 | `kanban_tasks` | Personal Kanban task board per user |
| 25 | `ecosystem_snapshots` | Daily aggregate analytics snapshots |
| 26 | `news` | Platform news posts by admins |
| 27 | `github_cache` | Cached GitHub stats per startup |

### Default Admin Credentials
| Field | Value |
|-------|-------|
| Email | `admin@gmail.com` |
| Password | `rishit@159753` |

> ⚠️ **Change the admin password immediately after first login.**

### Demo Seed Data (05_seed_sample_data.sql)
| User | Role | Email |
|------|------|-------|
| Alice Student | student | `student1@demo.com` |
| Bob Builder | student | `student2@demo.com` |
| Carol Mentor | mentor | `mentor1@demo.com` |

All demo users have password: `Test@123456`

---

## Quick Customization Guide
Replace placeholders below before publishing:

- Update the admin credentials in `database/04_seed_admin.sql`
- Set your database connection string in `backend/.env`
- Replace the demo screenshots in `docs/screenshots/`
- Any stack details that differ in your deployment setup