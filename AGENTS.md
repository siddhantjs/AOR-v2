<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AOR-v2 project conventions

## Architecture

- **Frontend**: Next.js App Router under [`frontend/`](frontend/) (UI only).
- **Backend**: Express API under [`backend/`](backend/) (MongoDB, Gemini, all HTTP APIs). Tracker/DB scripts live in [`backend/scripts/`](backend/scripts/).
- **HTTP client**: [`frontend/src/lib/api.ts`](frontend/src/lib/api.ts) — `ApiClient` class (axios). All FE calls go through `api.*`.
- Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (default `http://localhost:4000`). Backend uses `MONGODB_URI`, `MONGODB_DB_NAME`, `GEMINI_API_KEY`, `PORT`, `CORS_ORIGIN` in `backend/.env`.

### Dev

```bash
cd backend && npm run dev    # Express :4000
cd frontend && npm run dev   # Next :3000
```

Tracker/DB scripts: `cd backend && npm run tracker:seed` (etc.).

### APIs (Express)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/aor-track/v1/auth/login` | email + username → `/dashboard/[userId]` |
| GET | `/api/aor-track/v1/username/check?username=` | unique among live users (`seededData: false`) |
| POST | `/api/aor-track/v1/track/start` | create user + cohort + AI estimates |
| POST | `/api/aor-track/v1/track/submit` | save milestones / offices, re-estimate |
| POST | `/api/aor-track/v1/dashboard/:userId/details` | update applicant details |
| GET | `/api/aor-track/v1/dashboard/:userId` | dashboard view |
| GET | `/api/aor-track/v1/dashboard/:userId/edit-milestone` | edit milestones payload |
| GET | `/api/aor-track/v1/dashboard/:userId/cohort` | cohort page (`?c=`) |
| GET | `/api/aor-track/v1/dashboard/:userId/all-cohorts` | all cohorts |

AI estimates live in `backend/src/services/ai-estimate/` (`AiEstimateService.run`).

## Component structure

- App Router routes live under `frontend/src/app/` (thin pages only).
- UI is component-based under `frontend/src/components/`.
- **Page-level components** live in `frontend/src/components/pages/<route>/` — one folder per page, composed of that page’s sections.
- Route files import the page component, e.g. `frontend/src/app/track/page.tsx` → `TrackPage`.
- Styling: **Tailwind only** (no CSS modules). Colors/tokens come from [`frontend/src/app/globals.css`](frontend/src/app/globals.css) via `var(--…)`.
- Shared UI primitives live in `frontend/src/components/ui/`.
- Dashboard: `/dashboard/[userId]` — `frontend/src/components/pages/dashboard/DashboardPage.tsx`.

## HTML prototype → routes

Source prototype: `aor-tracker-final-version.html`.

| Prototype section                            | Route                                | Page component                                          |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| Landing (marketing home)                     | `/`                                  | `frontend/src/components/pages/landing/LandingPage.tsx`          |
| “Tell us about your application” (`#pg-app`) | `/track`                             | `frontend/src/components/pages/track/TrackPage.tsx`              |
| “Your milestones” (`#pg-ms`)                 | `/track` (phase 2)                   | `frontend/src/components/pages/track/MilestonesStep.tsx`         |
| Dashboard (`#pg-dash`)                       | `/dashboard/[userId]`                | `frontend/src/components/pages/dashboard/DashboardPage.tsx`      |
| Edit milestones (`#pg-ms` from dash)         | `/dashboard/[userId]/edit-milestone` | `frontend/src/components/pages/dashboard/EditMilestonesPage.tsx` |
| My cohort (`#pg-cd`)                         | `/dashboard/[userId]/cohort`         | `frontend/src/components/pages/dashboard/CohortPage.tsx`         |
| All cohorts (`#pg-cohorts`)                  | `/dashboard/[userId]/all-cohorts`    | `frontend/src/components/pages/dashboard/AllCohortsPage.tsx`     |
| Cohorts                                      | TBD                                  | —                                                       |

Schema / types: see `SCHEMA_V3.md` and `frontend/src/lib/schema/` (FE) / `backend/src/lib/schema/` (BE).
