# 🗄️ Database — Digital Platform for Startup Ecosystem

This folder contains all SQL scripts for the **startup_ecosystem** MySQL database.

## 📁 Folder Structure

```
database/
├── 01_create_database.sql      # Create the database
├── 02_schema.sql               # All table definitions (DDL)
├── 03_indexes.sql              # Full-text & performance indexes
├── 04_seed_admin.sql           # Seed default admin user
├── 05_seed_sample_data.sql     # Optional: sample/demo data
├── 06_migrations.sql           # Incremental ALTER TABLE migrations
└── README.md                   # This file
```

## ⚙️ Setup Instructions

### Prerequisites
- MySQL 8.0+ or MariaDB 10.5+
- A MySQL client (CLI or GUI like DBeaver / MySQL Workbench)

### Quick Setup (run in order)

```bash
mysql -u root -p < database/01_create_database.sql
mysql -u root -p startup_ecosystem < database/02_schema.sql
mysql -u root -p startup_ecosystem < database/03_indexes.sql
mysql -u root -p startup_ecosystem < database/04_seed_admin.sql
# Optional:
mysql -u root -p startup_ecosystem < database/05_seed_sample_data.sql
```

> ⚠️ **Note:** If upgrading an existing database (not a fresh install), run `06_migrations.sql` instead of `02_schema.sql` to apply incremental changes safely.

## 🗂️ Table Overview

| Table | Description |
|---|---|
| `users` | Core user accounts (student / mentor / admin) |
| `otp_codes` | OTP codes for email verification & password reset |
| `user_profiles` | Extended user profile data |
| `user_gamification` | Points, badges & XP tracking |
| `trends_cache` | Cached AI trend data |
| `startups` | Startup records |
| `startup_members` | Many-to-many: users ↔ startups |
| `startup_mentor_access_requests` | Mentor access / volunteer requests |
| `startup_milestones` | Startup stage milestones |
| `startup_upvotes` | Upvote system for startups |
| `open_roles` | Open positions within startups |
| `role_applications` | Applications to open roles |
| `pitch_decks` | AI-generated pitch deck content |
| `barter_listings` | Startup skill barter marketplace |
| `barter_applications` | Applications to barter listings |
| `ideas` | Community idea board |
| `idea_feedback` | Feedback/comments on ideas |
| `peer_reviews` | Peer-to-peer startup reviews |
| `meetings` | Meeting scheduling between users |
| `office_hours` | Mentor recurring office hours |
| `office_hour_bookings` | Bookings for office hours |
| `verification_badges` | Admin-granted badges |
| `featured_works` | Featured/showcase works |
| `kanban_tasks` | Personal Kanban task board |
| `ecosystem_snapshots` | Daily analytics snapshots |
| `news` | Platform news posts |
| `github_cache` | Cached GitHub repo stats |

## 🔐 Default Admin Credentials

After running `04_seed_admin.sql`:

| Field | Value |
|---|---|
| Email | `admin@gmail.com` |
| Password | `rishit@159753` |
| Role | `admin` |

> ⚠️ Change the admin password immediately after first login in production.
