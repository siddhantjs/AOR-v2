<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AOR-v2 project conventions

## Architecture

- **App**: Next.js App Router at the repo root (`src/`). UI only — no API routes for tracker data.
- **API**: Live HTTP APIs are served by an **external immigration server** (not this repo). The FE talks to it via [`src/lib/api.ts`](src/lib/api.ts) (`ApiClient` / axios). All FE calls go through `api.*`.
- Set `NEXT_PUBLIC_API_URL` in `.env.local` to that host only (no path). The client appends `/api/aor-track/v1`. Example: `https://api.example.com` → `https://api.example.com/api/aor-track/v1/...`.

### Dev

```bash
# .env.local → NEXT_PUBLIC_API_URL=<immigration-api-host>
npm run dev   # Next :3000
```

### API contract (`/api/aor-track/v1`)

| Method | Path                                                 | Notes                                         |
| ------ | ---------------------------------------------------- | --------------------------------------------- |
| POST   | `/api/aor-track/v1/auth/login`                       | email + username → `/dashboard/[userId]`      |
| GET    | `/api/aor-track/v1/username/check?username=`         | unique among live users (`seededData: false`) |
| POST   | `/api/aor-track/v1/track/start`                      | create user + cohort + AI estimates           |
| POST   | `/api/aor-track/v1/track/submit`                     | save milestones / offices, re-estimate        |
| POST   | `/api/aor-track/v1/dashboard/:userId/details`        | update applicant details                      |
| GET    | `/api/aor-track/v1/dashboard/:userId`                | dashboard view                                |
| GET    | `/api/aor-track/v1/dashboard/:userId/edit-milestone` | edit milestones payload                       |
| GET    | `/api/aor-track/v1/dashboard/:userId/cohort`         | cohort page (`?c=`)                           |
| GET    | `/api/aor-track/v1/dashboard/:userId/all-cohorts`    | all cohorts                                   |

## Component structure

- App Router routes live under `src/app/` (thin pages only).
- UI is component-based under `src/components/`.
- **Page-level components** live in `src/components/pages/<route>/` — one folder per page, composed of that page’s sections.
- Route files import the page component, e.g. `src/app/track/page.tsx` → `TrackPage`.
- Styling: **Tailwind only** (no CSS modules). Colors/tokens come from [`src/app/globals.css`](src/app/globals.css) via `var(--…)`.
- Shared UI primitives live in `src/components/ui/`.
- Dashboard: `/dashboard/[userId]` — `src/components/pages/dashboard/DashboardPage.tsx`.

## HTML prototype → routes

Source prototype: `aor-tracker-final-version.html`.

| Prototype section                            | Route                                | Page component                                          |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| Landing (marketing home)                     | `/`                                  | `src/components/pages/landing/LandingPage.tsx`          |
| “Tell us about your application” (`#pg-app`) | `/track`                             | `src/components/pages/track/TrackPage.tsx`              |
| “Your milestones” (`#pg-ms`)                 | `/track` (phase 2)                   | `src/components/pages/track/MilestonesStep.tsx`         |
| Dashboard (`#pg-dash`)                       | `/dashboard/[userId]`                | `src/components/pages/dashboard/DashboardPage.tsx`      |
| Edit milestones (`#pg-ms` from dash)         | `/dashboard/[userId]/edit-milestone` | `src/components/pages/dashboard/EditMilestonesPage.tsx` |
| My cohort (`#pg-cd`)                         | `/dashboard/[userId]/cohort`         | `src/components/pages/dashboard/CohortPage.tsx`         |
| All cohorts (`#pg-cohorts`)                  | `/dashboard/[userId]/all-cohorts`    | `src/components/pages/dashboard/AllCohortsPage.tsx`     |
| Cohorts                                      | TBD                                  | —                                                       |

Schema / types: see `SCHEMA_V3.md` and `src/lib/schema/`.
