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

## HTML prototype → routes

Source prototype: `aor-tracker-final-version.html`.

| Prototype section | Route | Page component |
| ----------------- | ----- | -------------- |
| “Tell us about your application” (`#pg-app`) | `/track` | `src/components/pages/track/TrackPage.tsx` |
| “Your milestones” (`#pg-ms`) | TBD (phase 2 of `/track`) | — |
| Dashboard (`#pg-dash`) | TBD | — |
| Cohorts | TBD | — |

Schema / types: see `SCHEMA_V3.md` and `src/lib/schema/`.
