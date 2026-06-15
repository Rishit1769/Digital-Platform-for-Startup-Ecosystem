# API Endpoints & Route Handlers

> **Base URL**: `http://localhost:5000/api` (configurable via `PORT` and `NEXT_PUBLIC_API_URL`)  
> **Auth**: `Authorization: Bearer <access_token>`  
> **Refresh**: httpOnly cookie `refreshToken`  
> **Response Shape**: `{ success: boolean, data?: T, error?: string, message?: string }`

---

## 1. Global API Standards

### 1.1 Request/Response Format

All endpoints return JSON. The standard response envelope is defined in `@startup-ecosystem/shared`:

```typescript
interface ApiResponse<T> {
  success: boolean;    // true for 2xx, false for 4xx/5xx
  message?: string;    // Human-readable context
  data?: T;            // Payload (present on success)
  error?: string;      // Error description (present on failure)
}
```

### 1.2 HTTP Status Code Conventions

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 400 | Validation failure, missing required fields, bad request body |
| 401 | Missing or invalid/expired access token |
| 403 | Authenticated but insufficient role permissions |
| 404 | Requested resource not found |
| 409 | Conflict (meeting time overlap, duplicate application) |
| 500 | Internal server error (logged, not propagated) |

### 1.3 Auth Middleware

```typescript
// authenticate - JWT verification
// Extracts Bearer token -> verifies via verifyAccessToken()
// Looks up user in DB -> attaches req.user = { id, email, role, name }
// On failure: 401 { success: false, error: "Access denied. No token provided." }

// authorize(...roles) - Role-based access
// Checks req.user.role against allowed roles
// On failure: 403 { success: false, error: "Access denied. You do not have permission." }

// requireRole(role) - Alias for single-role authorize
```

### 1.4 Global Error Handler

```typescript
// Express error middleware (src/middleware/errorHandler.ts)
// Logs stack trace
// Returns { success: false, error: err.message }
// Sets status from err.statusCode or defaults to 500
```

---

## 2. Route Registry

### 2.1 Public Endpoints (No Auth)

#### `GET /api/health`

Health check.

**Response 200:**
```json
{ "success": true, "message": "Server is healthy" }
```

#### `GET /api/public/stats`

Landing page ecosystem stats.

**Response 200:**
```typescript
interface PublicStats {
  founders: number;     // Total users with startup_intent != null
  startups: number;     // Total startups
  ideas: number;        // Total ideas
  totalFunding?: number; // Sum of funding_raised (not yet implemented)
  mentorCount: number;  // Total mentors
  meetingCount: number; // Total completed meetings
}
```

**Response 200:** `{ success: true, data: PublicStats }`
**Response 500:** `{ success: false, error: "Failed to fetch public stats" }`

#### `GET /api/public/showcase`

Featured works or top-upvoted startups for landing page.

**Response 200:**
```typescript
interface ShowcaseItem {
  id: number;
  headline?: string;
  summary?: string;
  hero_image_url?: string;
  cta_label?: string;
  cta_url?: string;
  startup: { id: number; name: string; logo_url?: string; tagline?: string; domain?: string };
}
```

**Response 200:** `{ success: true, data: ShowcaseItem[] }`
**Error 500:** `{ success: false, error: string }`

#### `GET /api/public/mentors`

Top mentors by active office hour slots.

**Response 200:** `{ success: true, data: Mentor[] }`

#### `GET /api/public/ticker`

Recent activity ticker.

**Response 200:** `{ success: true, data: ActivityItem[] }`

#### `GET /api/public/sessions`

Active public mentor sessions (auto-deactivates past ones).

**Response 200:** `{ success: true, data: PublicMentorSession[] }`

#### `POST /api/public/sessions/:id/join`

Join a public mentor session. Increments `joined_count` if not full/expired.

**Response 200:** `{ success: true, data: { meetLink: string } }`
**Error 400:** `{ success: false, error: "Session is full or expired" }`
**Error 404:** `{ success: false, error: "Session not found" }`

#### `GET /api/public/startups`

Paginated public startup directory.

**Query Params:** `page?`, `limit?`, `search?`, `domain?`, `stage?`, `sort?`

**Response 200:**
```typescript
interface PaginatedStartups {
  startups: StartupSummary[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### `GET /api/public/mentors-list`

Paginated public mentor directory.

**Query Params:** `page?`, `limit?`, `search?`

**Response 200:** `{ success: true, data: PaginatedMentors }`

#### `GET /api/public/ideas`

Paginated public ideas list.

**Query Params:** `page?`, `limit?`, `domain?`, `search?`, `sort?`

**Response 200:** `{ success: true, data: PaginatedIdeas }`

#### `GET /api/news`

Public news feed.

**Query Params:** `page?`, `category?`

**Response 200:** `{ success: true, data: NewsArticle[] }`

---

### 2.2 Auth Endpoints

#### `POST /api/auth/send-otp`

Send 6-digit OTP email for registration or password reset.

**Request Body:**
```typescript
interface SendOtpRequest {
  email: string;                           // Valid email address
  type: "register" | "forgot_password";    // OTP purpose
  role?: "student" | "mentor";             // Required for register
  name?: string;                           // Required for register
  phone?: string;                          // Required for register
  password?: string;                       // Required for register
  startup_intent?: "has_startup" | "finding_startup"; // Optional student field
}
```

**Response 200:** `{ success: true, message: "OTP sent successfully" }`
**Error 400:** `{ success: false, error: "Email and type are required" }`
**Error 400:** `{ success: false, error: "Name, phone, and password are required for registration" }`
**Error 400:** `{ success: false, error: "An account with this email already exists." }`
**Error 500:** `{ success: false, error: string }`

#### `POST /api/auth/verify-otp`

Verify OTP code.

**Request Body:**
```typescript
interface VerifyOtpRequest {
  email: string;
  code: string;        // 6-digit code
  type: "register" | "forgot_password";
}
```

**Response 200:** `{ success: true, data: { verificationToken: string } }`
**Error 400:** `{ success: false, error: "Invalid or expired OTP" }`
**Error 400:** `{ success: false, error: "Email, code, and type are required" }`

#### `POST /api/auth/register`

Complete registration with verification token.

**Request Body:**
```typescript
interface RegisterRequest {
  verificationToken: string;
  name: string;
  password: string;  // Min 8 chars
}
```

**Response 200:**
```typescript
interface AuthTokens {
  accessToken: string;   // JWT, 15min expiry
  refreshToken: string;  // JWT, 7d expiry, also set as httpOnly cookie
  user: { id: number; email: string; name: string; role: string };
}
```
**Error 400:** `{ success: false, error: "Verification token is missing or invalid" }`
**Error 500:** `{ success: false, error: string }`

#### `POST /api/auth/login`

Authenticate via email/password.

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response 200:** `{ success: true, data: AuthTokens }`
**Error 401:** `{ success: false, error: "Invalid email or password" }`

#### `POST /api/auth/refresh`

Exchange refresh cookie for new access token.

**Cookie Required:** `refreshToken` (httpOnly)

**Response 200:** `{ success: true, data: { accessToken: string, user: AuthUser } }`
**Error 401:** `{ success: false, error: "Refresh token is missing" }`
**Error 401:** `{ success: false, error: "Invalid or expired refresh token" }`

#### `POST /api/auth/logout`

Clear refresh cookie.

**Response 200:** `{ success: true, message: "Logged out successfully" }`

#### `PATCH /api/auth/reset-password`

Reset password using OTP verification token.

**Request Body:**
```typescript
interface ResetPasswordRequest {
  email: string;
  password: string;       // New password (min 8 chars)
  verificationToken: string;
}
```

**Response 200:** `{ success: true, message: "Password reset successfully" }`
**Error 400:** `{ success: false, error: "Invalid or expired verification token" }`

---

### 2.3 Authenticated Endpoints (require `Authorization: Bearer <token>`)

#### Profile (`/api/profile`)

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/me` | getMyProfile | Returns authenticated user profile with badges |
| PUT | `/me` | updateMyProfile | Upserts profile fields (bio, skills, education, work) |
| POST | `/avatar` | uploadAvatar | Upload avatar to MinIO (multipart, field: "avatar") |
| GET | `/users` | getDiscoveryList | List users by role, paginated |
| GET | `/:userId` | getUserProfile | Public profile for any user |

**Response Shape:** `{ success: true, data: UserProfile }` / `{ error: "Profile not found" }`

#### Startups (`/api/startups`) - 34 endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create startup (auto-creates founder member) |
| GET | `/` | List startups (domain/stage filter, paginated) |
| GET | `/hiring` | Startups with unfilled open roles |
| GET | `/my` | Current user's startups |
| GET | `/:id` | Full startup detail (members, roles, upvotes, pulse) |
| PUT | `/:id` | Update startup (creator or admin only) |
| DELETE | `/:id` | Delete startup (creator or admin only) |
| POST | `/:id/logo` | Upload logo to MinIO (multipart, field: "logo") |
| POST | `/:id/invite` | Invite member by email (emits Socket.IO event) |
| DELETE | `/:id/members/:userId` | Remove member (creator only) |
| GET | `/:id/members` | List members with profiles |
| POST | `/:id/mentor-access-requests` | Request mentor access |
| PATCH | `/mentor-access-requests/:id/approve` | Approve mentor request |
| PATCH | `/mentor-access-requests/:id/reject` | Reject mentor request |
| POST | `/:id/mentor-volunteer` | Volunteer as mentor |
| GET | `/mentor-volunteer-requests/incoming` | Incoming volunteer requests |
| PATCH | `/mentor-volunteer-requests/:id/approve` | Approve volunteer |
| PATCH | `/mentor-volunteer-requests/:id/reject` | Reject volunteer |
| POST | `/:id/barter` | Create barter listing |
| GET | `/:id/barter` | List startup barter listings |
| GET | `/barter/marketplace` | All open barter listings from other startups |
| GET | `/:id/barter/matches` | AI barter match scores |
| POST | `/:id/barter/:listingId/apply` | Apply to barter listing |
| GET | `/:id/barter/:listingId/applications` | View barter applicants |
| POST | `/:id/suggest-milestones` | AI-suggested milestones |
| POST | `/:id/analyze-pitch` | AI pitch deck PDF analysis |
| POST | `/:id/generate-outline` | AI 10-slide pitch outline |
| POST | `/:id/github` | Link GitHub repo |
| DELETE | `/:id/github` | Unlink GitHub repo |
| GET | `/:id/github` | Cached GitHub data |
| GET | `/:id/github/refresh` | Refresh GitHub cache |
| GET | `/:id/github/readme` | Fetch repo README |
| GET | `/:id/activity-score` | Compute GitHub activity score |
| POST | `/:id/upvote` | Toggle upvote |
| GET | `/:id/upvote` | Check upvote status |

#### Meetings (`/api/meetings`) - 8 endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create with 3 proposed slots + email notification |
| POST | `/schedule` | Direct schedule (requires Google Calendar) |
| GET | `/` | List user meetings (status filter) |
| GET | `/:id` | Meeting detail (participants only) |
| PATCH | `/:id/confirm` | Confirm slot + conflict check + Google Calendar event |
| PATCH | `/:id/reject` | Reject meeting |
| PATCH | `/:id/cancel` | Cancel meeting |
| PATCH | `/:id/complete` | Mark complete |
| PATCH | `/:id/reschedule` | Reset to pending with 3 new slots |

#### Admin (`/api/admin`) - 13 endpoints

All require `authenticate` + `authorize('admin')`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/verification-requests` | Users without badges (verify candidates) |
| POST | `/verify/:userId` | Grant verification badge |
| DELETE | `/verify/:userId` | Revoke all badges |
| GET | `/public-sessions` | List all sessions |
| POST | `/public-sessions` | Create session |
| DELETE | `/public-sessions/:id` | Delete session |
| PATCH | `/public-sessions/:id/toggle` | Toggle isActive |
| GET | `/startup-leaders` | All startups with creator info |
| PATCH | `/startup-leaders/:id/contact` | Update startup contact email |
| GET | `/featured-work` | List all featured works |
| POST | `/featured-work` | Create featured work |
| DELETE | `/featured-work/:id` | Delete featured work |
| PATCH | `/featured-work/:id/toggle` | Toggle isActive |

---

## 3. Error Response Catalogue

| Scenario | Status | Response Body |
|----------|--------|---------------|
| Missing auth header | 401 | `{ "success": false, "error": "Access denied. No token provided." }` |
| Expired/invalid token | 401 | `{ "success": false, "error": "Invalid or expired token." }` |
| Deleted user still holding token | 401 | `{ "success": false, "error": "User no longer exists." }` |
| Insufficient role | 403 | `{ "success": false, "error": "Access denied. You do not have permission." }` |
| Resource not found | 404 | `{ "success": false, "error": "...not found" }` |
| Meeting time conflict | 409 | `{ "success": false, "error": "You already have a meeting in this time slot" }` |
| Duplicate barter application | 409 | Prisma unique constraint violation -> 409 |
| Validation failure | 400 | `{ "success": false, "error": "..." }` |
| Server error | 500 | `{ "success": false, "error": "Failed to..." }` |

---

## 4. Endpoint Count by Module

| Module | Enpoints | Auth Required |
|--------|----------|---------------|
| Public | 9 | No |
| Auth | 8 | No (except /me) |
| Profile | 5 | Yes |
| Users | 1 | Yes |
| Admin | 13 | Yes (admin only) |
| Startups | 34 | Yes |
| Showcase | 1 | Yes |
| Ideas | 5 | Yes |
| Roles | 5 | Yes |
| Meetings | 8 | Yes |
| Office Hours | 8 | Yes |
| News | 4 | Mixed |
| Discover | 1 | Yes |
| Dashboard | 1 | Yes |
| Calendar | 10 | Yes |
| Analytics | 5 | Yes |
| AI | 8 | Mixed (1 public, 7 auth) |
| **Total** | **106** | |
