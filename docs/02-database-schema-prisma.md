# Database Schema & Prisma Layer

> **Provider**: MySQL 8.4  
> **ORM**: Prisma 6.19 (prisma-client-js)  
> **Package**: `@startup-ecosystem/db`  
> **Charset**: `utf8mb4` / `utf8mb4_unicode_ci`  
> **Engine**: InnoDB

---

## 1. Entity Relationship Overview

### 1.1 Core Domains

| Domain | Models | Key Relationships |
|--------|--------|-------------------|
| **User Management** | User, UserProfile, UserGamification, XpEvent, OtpCode | User 1:1->Profile, 1:1->Gamification, 1:N->XpEvent |
| **Startup Lifecycle** | Startup, StartupMember, StartupMilestone, StartupUpvote | User N:M Startup through StartupMember |
| **Mentorship** | StartupMentorAccessRequest, OfficeHour, OfficeHourBooking, PublicMentorSession | User 1:N OfficeHour, OfficeHour 1:N Booking |
| **Meetings** | Meeting | User N:M through organizer/attendee dual FKs |
| **Hiring** | OpenRole, RoleApplication | Startup 1:N OpenRole, OpenRole 1:N RoleApplication |
| **Marketplace** | BarterListing, BarterApplication | Startup 1:N BarterListing, BarterListing 1:N BarterApplication |
| **Community** | Idea, IdeaFeedback | User 1:N Idea, Idea 1:N IdeaFeedback |
| **Reviews** | PeerReview | Self-referential User N:M through reviewer/reviewee |
| **AI / Content** | PitchDeck, TrendsCache | Startup 1:N PitchDeck |
| **Admin** | VerificationBadge, FeaturedWork, News | User grants badges, creates featured works and news |
| **Infrastructure** | GithubCache, EcosystemSnapshot, KanbanTask | Per-startup GitHub cache, daily snapshots, personal tasks |

### 1.2 Table Inventory (29 tables)

```
users                          user_profiles                  user_gamification
xp_events                      otp_codes                      trends_cache
startups                       startup_members                startup_mentor_access_requests
startup_milestones             startup_upvotes                open_roles
role_applications              pitch_decks                    barter_listings
barter_applications            ideas                          idea_feedback
peer_reviews                   meetings                       office_hours
office_hour_bookings           verification_badges            featured_works
kanban_tasks                   ecosystem_snapshots            news
github_cache                   public_mentor_sessions
```

---

## 2. Prisma Schema Implementation

### 2.1 Enumerations (14)

| Enum | Values | Bound To |
|------|--------|----------|
| UserRole | student, mentor, admin | User.role |
| OAuthProvider | google | User.oauthProvider |
| StartupIntent | has_startup, finding_startup | User.startupIntent |
| StartupStage | idea, mvp, growth, funded | Startup.stage |
| OtpType | register, forgot_password | OtpCode.type |
| MilestoneStage | idea, prototype, mvp, beta, launch, funded | StartupMilestone.stage |
| MeetingStatus | pending, confirmed, rejected, cancelled, completed | Meeting.status |
| BarterStatus | open, closed | BarterListing.status |
| ApplicationStatus | pending, accepted, rejected | RoleApplication, BarterApplication |
| OfficeHourDay | Mon, Tue, Wed, Thu, Fri, Sat, Sun | OfficeHour.dayOfWeek |
| BookingStatus | pending, confirmed, cancelled | OfficeHourBooking.status |
| MentorRequestStatus | pending, approved, rejected | StartupMentorAccessRequest.status |
| TaskStatus | todo, in_progress, review, done, blocked | KanbanTask.status |
| TaskPriority | low, medium, high, urgent | KanbanTask.priority |

### 2.2 Core Model: User

```prisma
model User {
  id                          Int           @id @default(autoincrement())
  email                       String        @unique @db.VarChar(255)
  passwordHash                String        @map("password_hash") @db.VarChar(255)
  oauthProvider               OAuthProvider? @map("oauth_provider")
  oauthSub                    String?       @unique @map("oauth_sub") @db.VarChar(255)
  googleCalendarEmail         String?       @map("google_calendar_email") @db.VarChar(255)
  googleCalendarRefreshToken  String?       @map("google_calendar_refresh_token") @db.Text
  googleCalendarConnectedAt   DateTime?     @map("google_calendar_connected_at")
  role                        UserRole      @default(student)
  name                        String        @db.VarChar(255)
  phone                       String?       @db.VarChar(20)
  startupIntent               StartupIntent? @map("startup_intent")
  isVerified                  Boolean       @default(false) @map("is_verified")
  isEmailVerified             Boolean       @default(false) @map("is_email_verified")
  createdAt                   DateTime      @default(now()) @map("created_at")
  updatedAt                   DateTime      @updatedAt @map("updated_at")

  // Relations (25 outgoing)
  profile                     UserProfile?
  gamification                UserGamification?
  createdStartups             Startup[]     @relation("StartupCreator")
  startupMemberships          StartupMember[]
  mentorAccessRequestsAsStudent  StartupMentorAccessRequest[] @relation("StudentRequests")
  mentorAccessRequestsAsMentor   StartupMentorAccessRequest[] @relation("MentorRequests")
  barterListings              BarterListing[]
  barterApplications          BarterApplication[]
  postedIdeas                 Idea[]
  ideaFeedback                IdeaFeedback[]
  reviewsGiven                PeerReview[]  @relation("ReviewerRelation")
  reviewsReceived             PeerReview[]  @relation("RevieweeRelation")
  meetingsOrganized           Meeting[]     @relation("OrganizerRelation")
  meetingsAttended            Meeting[]     @relation("AttendeeRelation")
  officeHours                 OfficeHour[]
  officeHourBookings          OfficeHourBooking[]
  verificationBadges          VerificationBadge[] @relation("UserBadges")
  verificationBadgesGranted   VerificationBadge[] @relation("GranterBadges")
  featuredWorks               FeaturedWork[]
  kanbanTasks                 KanbanTask[]
  postedOpenRoles             OpenRole[]
  roleApplications            RoleApplication[]
  news                        News[]
  publicSessionsCreated       PublicMentorSession[]
  startupUpvotes              StartupUpvote[] @relation("UserUpvotes")
  xpEvents                    XpEvent[]

  @@map("users")
}
```

### 2.3 Key Pattern: Composite Primary Key

```prisma
model StartupUpvote {
  startupId Int      @map("startup_id")
  userId    Int      @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  startup   Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
  user      User     @relation("UserUpvotes", fields: [userId], references: [id], onDelete: Cascade)

  @@id([startupId, userId])
  @@map("startup_upvotes")
}
```

### 2.4 Key Pattern: Unique Composite Constraints

```prisma
model StartupMember {
  @@unique([startupId, userId])
  @@map("startup_members")
}

model BarterApplication {
  @@unique([listingId, applicantId])
  @@map("barter_applications")
}

model OfficeHourBooking {
  @@unique([officeHourId, bookedDate, studentId])
  @@map("office_hour_bookings")
}
```

### 2.5 Key Pattern: Self-Referential Relations (9 on User)

```prisma
model PeerReview {
  reviewerId Int      @map("reviewer_id")
  revieweeId Int      @map("reviewee_id")

  reviewer   User     @relation("ReviewerRelation", fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewee   User     @relation("RevieweeRelation", fields: [revieweeId], references: [id], onDelete: Cascade)

  @@map("peer_reviews")
}
```

Named relations on User: `StartupCreator`, `StudentRequests`, `MentorRequests`, `ReviewerRelation`, `RevieweeRelation`, `OrganizerRelation`, `AttendeeRelation`, `UserBadges`, `GranterBadges`, `UserUpvotes`.

### 2.6 Key Pattern: SET NULL on Optional FKs

```prisma
// Meeting.startup can be null on startup deletion
model Meeting {
  startup       Startup?      @relation(fields: [startupId], references: [id], onDelete: SetNull)
}

// Badge granter can be null on user deletion
model VerificationBadge {
  granter   User?    @relation("GranterBadges", fields: [grantedBy], references: [id], onDelete: SetNull)
}

model FeaturedWork {
  creator      User?    @relation(fields: [createdBy], references: [id], onDelete: SetNull)
}

model PublicMentorSession {
  creator         User?    @relation(fields: [createdBy], references: [id], onDelete: SetNull)
}
```

---

## 3. PrismaManager Singleton (Production)

`packages/db/src/index.ts` implements a connection manager with:

| Feature | Implementation |
|---------|---------------|
| Singleton | Static class with lazy init, globalThis caching in dev for hot-reload survival |
| Retry | 3 attempts, exponential backoff (100ms * 2^(attempt-1)), skips retry on validation/known-request errors |
| Log Levels | development: query+info+warn+error, test: warn+error, production: error only |
| Health Check | `SELECT 1` raw query, returns boolean |
| Graceful Shutdown | SIGINT/SIGTERM handlers call $disconnect() then process.exit(0) |
| DB URL | Explicitly passed from process.env (not inferred from .env path) |

```typescript
// Usage in backend controllers
import { prisma, initializeDatabase, shutdownDatabase, PrismaManager } from "../db";

// Health check
const healthy = await PrismaManager.healthCheck();

// Raw query fallback
const users = await prisma.$queryRaw<Array<{ id: number }>>`SELECT id FROM users`;
```

---

## 4. Data Integrity & Migrations

### 4.1 Migration Commands

| Environment | Command | Effect |
|------------|---------|--------|
| Development | `npm run db:migrate` | `prisma migrate dev` - creates + applies migration |
| Development | `npm run db:migrate:create` | `prisma migrate dev --create-only` - creates without applying |
| Production | `npm run db:migrate:deploy` | `prisma migrate deploy` - applies pending migrations |
| Any | `npm run db:validate` | `prisma validate` - validates schema syntax |
| Any | `npm run db:status` | `prisma migrate status` - shows applied/unapplied |
| Development | `npm run db:reset` | `prisma migrate reset` - drops DB, re-creates, re-runs all migrations |
| Development | `npm run db:push` | `prisma db push` - pushes schema directly (no migration file) |

### 4.2 Migration File Structure

```
packages/db/prisma/migrations/
|-- migration_lock.toml
|-- 20260612182135_init/
    |-- migration.sql     # 550 lines: 29 CREATE TABLE + 41 ALTER TABLE ADD FK
```

### 4.3 Migration Properties

| Property | Value |
|----------|-------|
| All tables | `ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` |
| Timestamps | `DATETIME(3)` - millisecond precision |
| Date-only | `DATE` type for snapshot_date, booked_date, session_date, due_date |
| JSON | Native MySQL `JSON` type for all JSON fields |
| Auto-increment | All integer PKs use `INTEGER NOT NULL AUTO_INCREMENT` |
| FK ON DELETE | 36 CASCADE + 5 SET NULL |
| FK ON UPDATE | All 41 use CASCADE |

### 4.4 Production Migration Workflow

```bash
# 1. Validate schema in CI
npx prisma validate

# 2. Generate migration locally
npx prisma migrate dev --create-only --name describe_your_change

# 3. Review generated SQL in prisma/migrations/<timestamp>_<name>/migration.sql

# 4. Commit migration file to version control

# 5. Deploy: apply migration in production
npx prisma migrate deploy

# 6. Monitor for errors
# Rollback: manual SQL reversal + mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

### 4.5 Referential Integrity Guarantees

- 41 foreign key constraints enforce referential integrity at the database level
- Cascade deletes ensure no orphaned records when users or startups are removed
- `onDelete: SetNull` protects optional relations (meeting startup, badge granter)
- Composite unique constraints prevent duplicate memberships, upvotes, applications, and bookings
- Application-layer checks (Prisma) provide additional validation before reaching the database
