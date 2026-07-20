<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AOR-v2 project conventions

## Component structure

- App Router routes live under `src/app/` (thin pages only).
- UI is component-based under `src/components/`.
- **Page-level components** live in `src/components/pages/<route>/` — one folder per page, composed of that page’s sections.
- Route files import the page component, e.g. `src/app/track/page.tsx` → `TrackPage`.
- Styling: **Tailwind only** (no CSS modules). Colors/tokens come from [`src/app/globals.css`](src/app/globals.css) via `var(--…)` (e.g. `bg-[var(--bg-muted)]`, `text-[var(--navy)]`).
- Shared UI primitives live in `src/components/ui/` (e.g. `Select`, `DashboardDatePicker`) — theme via globals tokens; reuse across pages.
- Username availability: `GET /api/username/check?username=` (unique among live users, `seededData: false`). Requires `MONGODB_URI` (+ optional `MONGODB_DB_NAME`, default `aor-v2`).
- Track start: `POST /api/track/start` — create user + cohort, run `AiEstimateService` (aor-only), return estimates for milestones UI. Requires `MONGODB_URI` + `GEMINI_API_KEY`.
- AI estimates (SCHEMA_V3 §7): `src/services/ai-estimate/` — `AiEstimateService.run(userId)` (load → phase/hash skip → Gemini → validate → save). Requires `GEMINI_API_KEY`; model default `gemini-2.5-flash`.

## HTML prototype → routes

Source prototype: `aor-tracker-final-version.html`.

| Prototype section | Route | Page component |
| ----------------- | ----- | -------------- |
| “Tell us about your application” (`#pg-app`) | `/track` | `src/components/pages/track/TrackPage.tsx` |
| “Your milestones” (`#pg-ms`) | `/track` (phase 2) | `src/components/pages/track/MilestonesStep.tsx` |
| Dashboard (`#pg-dash`) | TBD | — |
| Cohorts | TBD | — |

Schema / types: see `SCHEMA_V3.md` and `src/lib/schema/`.
