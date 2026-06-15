# UI/UX & Component Architecture

> **Design System**: Light-first editorial with orange accent  
> **Framework**: Next.js 16 App Router + React 19 + Tailwind CSS v4  
> **Font Stack**: Playfair Display (display), Space Grotesk (UI), Source Serif 4 (body), Bebas Neue (condensed)

---

## 1. Layout & Theme System

### 1.1 Design Tokens

All tokens are defined via CSS custom properties in `globals.css` and loaded through `@theme inline` for Tailwind v4 consumption.

#### Color Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Orange (Accent) | `#F7941D` | `--orange` | CTAs, eyebrow labels, progress fills, selection, hover states |
| Deep Blue | `#003580` | `--deep-blue` | Secondary CTAs, alternate accent |
| White | `#FFFFFF` | `--white` | Page background, card backgrounds |
| Off-White | `#F5F4F0` | `--off-white` | Alternate section backgrounds, input variants |
| Charcoal | `#1C1C1C` | `--charcoal` | Body text, borders, primary text |
| Light Grey | `#E0E0E0` | `--light-grey` | Progress bar tracks, dividers |
| Mid Grey | `#555555` | `--mid-grey` | Secondary text |
| Danger Red | `#CC0000` | -- | Error strips, danger buttons |

#### Light-Only Mode

The design is explicitly light-first. Dark mode preference is overridden:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #FFFFFF;
    --foreground: #1C1C1C;
  }
}
```

### 1.2 Typography Scale

Four Google Fonts loaded via `next/font/google` in `app/layout.tsx`:

| Font | CSS Variable | Import Weights | Role |
|------|-------------|----------------|------|
| Playfair Display | `--font-playfair-import` | 400, 700, 800, 900 (+ italic) | Display headings, panel headings |
| Space Grotesk | `--font-space-import` | 300, 400, 500, 600, 700 | UI text, labels, buttons, inputs, tags |
| Source Serif 4 | `--font-serif-import` | 300, 400, 600, 700 (+ italic) | Body copy, reading text |
| Bebas Neue | `--font-bebas-import` | 400 | Condensed display numbers |

All fonts use `display: swap`. Font fallback chains:

```css
--font-playfair: var(--font-playfair-import, 'Playfair Display', Georgia, serif);
--font-space:    var(--font-space-import, 'Space Grotesk', system-ui, sans-serif);
--font-serif:    var(--font-serif-import, 'Source Serif 4', Georgia, serif);
--font-bebas:    var(--font-bebas-import, 'Bebas Neue', 'Arial Narrow', sans-serif);
```

### 1.3 Utility Class System

Tailwind v4 via `@import "tailwindcss"` (no `tailwind.config.js`). Custom utility classes in `globals.css`:

| Class | Font | Purpose |
|-------|------|---------|
| `.eco-input` | Space Grotesk | Flat 2px bordered input, no rounding, focus orange |
| `.eco-btn` | Space Grotesk 700 | Uppercase button, 0.1em letter-spacing, transition |
| `.eco-btn-primary` | -- | Orange bg, white text, hover charcoal |
| `.eco-btn-dark` | -- | Charcoal bg, white text, hover orange |
| `.eco-btn-blue` | -- | Deep blue bg, white text, hover charcoal |
| `.eco-btn-ghost` | -- | Transparent, grey border, hover charcoal |
| `.eco-btn-danger` | -- | Red border/text, hover red bg |
| `.eco-label` | Space Grotesk | Uppercase 0.625rem field label |
| `.eco-eyebrow` | Space Grotesk | Orange uppercase 0.6875rem category label |
| `.eco-panel-heading` | Playfair Display 900 italic | Section heading |
| `.eco-error` | Space Grotesk | Red left border error strip |
| `.eco-tag` | Space Grotesk | Flat square chip, accent variant |
| `.eco-progress-bar` | -- | 4px flat bar with orange fill transition |
| `.eco-stat-grid` | -- | 2px border grid with internal dividers |
| `.eco-marquee` | -- | Infinite horizontal scroll animation, 35s, pause on hover |
| `.link-underline` | Inherits | Hover-underline from 0 to 100% width |

### 1.4 Scrollbar & Selection

```css
::selection { background: #F7941D; color: #FFFFFF; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #F5F4F0; }
::-webkit-scrollbar-thumb { background: #1C1C1C; }
::-webkit-scrollbar-thumb:hover { background: #F7941D; }
```

---

## 2. Component Hierarchy

### 2.1 Directory Structure

```
apps/frontend/
|-- components/                    # 22 reusable components
|   |-- Avatar.tsx                 # Circular image or initials, 4 sizes, verified badge
|   |-- AIMatches.tsx              # AI discovery panel (mentor/cofounder)
|   |-- DashboardLayout.tsx        # Dashboard shell: topbar, hero, body
|   |-- DataPanel.tsx              # Panel + DataCard + PanelDivider + Tag
|   |-- EcoTable.tsx               # 12-col grid table + EcoRow + StatusBadge
|   |-- EmptyState.tsx             # Search icon + message + hint
|   |-- FilterChip.tsx             # Active/inactive toggle pill
|   |-- FindMentor.tsx             # Browse + AI mentor discovery
|   |-- FindTeammate.tsx           # Skills input + browse + AI match
|   |-- GamificationWidgets.tsx    # 12-badge achievement grid
|   |-- GitHubWidget.tsx           # Repo analytics card
|   |-- HiringStartups.tsx         # Hiring filter + cards
|   |-- LevelUpToast.tsx           # Confetti modal on level up
|   |-- MeetingCalendarPanel.tsx   # Month grid + scheduling
|   |-- NotificationBell.tsx       # Socket.IO notification dropdown
|   |-- PressNewsSection.tsx       # Article card grid
|   |-- ReadmeRenderer.tsx         # Markdown + Mermaid renderer
|   |-- SkeletonLoader.tsx         # Loading placeholders (card/radar/text)
|   |-- SkillHeatmap.tsx           # Scarcity heatmap (red/yellow/green)
|   |-- SubNav.tsx                 # Breadcrumbs + step tabs
|   |-- TrendRadar.tsx             # AI trend sector cards
|   |-- UserCard.tsx               # Profile discovery card
|
|-- lib/
|   |-- auth.ts                    # useAuth() hook
|   |-- axios.ts                   # API client
|
|-- app/                           # 34 page routes (App Router)
|   |-- layout.tsx
|   |-- page.tsx
|   |-- globals.css
|   |-- login/page.tsx
|   |-- register/*/page.tsx        # (register, verify, complete)
|   |-- forgot-password/*/page.tsx # (forgot, verify, reset)
|   |-- dashboard/page.tsx
|   |-- mentor/page.tsx
|   |-- admin/*/page.tsx           # (admin, verifications)
|   |-- analytics/page.tsx
|   |-- calendar/page.tsx
|   |-- discover/page.tsx
|   |-- ideas/page.tsx
|   |-- leaderboard/page.tsx
|   |-- meetings/page.tsx
|   |-- mentors/*/page.tsx         # (mentors, [id]/impact)
|   |-- office-hours/page.tsx
|   |-- profile/*/page.tsx         # (setup, me/edit, [userId])
|   |-- roles/page.tsx
|   |-- settings/page.tsx
|   |-- showcase/page.tsx
|   |-- startups/*/page.tsx        # (page, new, [id], [id]/*)
|   |-- trends/page.tsx
|
|-- proxy.ts                       # Edge auth guard
|-- types/index.ts                 # Re-exports @startup-ecosystem/shared
|-- next.config.ts                 # transpilePackages, turbopack.root
|-- postcss.config.mjs             # @tailwindcss/postcss
```

### 2.2 Component Classification

**Atomic UI Primitives:** Avatar, FilterChip, EmptyState, SkeletonLoader, DataPanel (DataCard, PanelDivider, Tag)

**Composite Domain Components:** AIMatches, FindMentor, FindTeammate, HiringStartups, GitHubWidget, SkillHeatmap, TrendRadar, UserCard

**Layout Components:** DashboardLayout, SubNav, EcoTable (EcoRow, StatusBadge)

**Feature Components:** MeetingCalendarPanel, LevelUpToast, NotificationBell, ReadmeRenderer, GamificationWidgets, PressNewsSection

---

## 3. State Management & Data Fetching

### 3.1 Architecture

No Next.js API routes exist. All data flows browser-to-Express:

```
Browser -> Express :5000/api -> Prisma/mysql2 -> MySQL
```

Components use `"use client"` with `useEffect` + `api.get/post/etc` pattern.

### 3.2 Auth State

`useAuth()` hook in `lib/auth.ts`:

1. On mount: check localStorage for token -> setToken()
2. If none: silent POST /auth/refresh
3. Fetch GET /profile/me
4. Return { user, loading }

### 3.3 API Client (`lib/axios.ts`)

| Feature | Implementation |
|---------|---------------|
| Base URL | `NEXT_PUBLIC_API_URL` or `http://localhost:5000/api` |
| Token Storage | In-memory variable (XSS-safe) |
| Auto-Refresh | 401 -> POST /auth/refresh -> retry original request |
| Cookies | `credentials: 'include'` for httpOnly refresh cookies |
| JSON Resilience | Strips BOM, XSSI guards, invalid primitives; extracts embedded JSON |

Methods: `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`

### 3.4 State Pattern

| State | Treatment |
|-------|-----------|
| Loading | SkeletonLoader (type: card/radar/text) |
| Empty | EmptyState (icon + message + hint) |
| Error | eco-error strip |
| Success | Content render |

### 3.5 Optimistic Updates

- Upvotes: toggle immediately, confirm async
- Kanban tasks: drag-and-drop via @dnd-kit updates status locally
- Notifications: Socket.IO events update badge count without refresh

---

## 4. Responsive Grid Guidelines

### 4.1 Tailwind v4 Default Breakpoints

| Breakpoint | Min-Width | Target |
|------------|-----------|--------|
| sm | 640px | Phone landscape |
| md | 768px | Tablet |
| lg | 1024px | Laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Ultra-wide |

### 4.2 Container Patterns

- Landing page full-bleed: `w-full max-w-none px-4 sm:px-8 lg:px-16`
- Dashboard body: `max-w-[1280px] mx-auto px-6`
- Startup cards grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- Table views: 12-column CSS grid via EcoTable
- Profile forms: `max-w-2xl mx-auto` (single column, centered)

No custom breakpoints are defined. All responsive behavior uses Tailwind defaults.
