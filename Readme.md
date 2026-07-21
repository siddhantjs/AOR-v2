# AOR-v2

Canadian immigration timeline tracker.

## Layout

| Directory | Role |
|-----------|------|
| `frontend/` | Next.js UI |
| `backend/` | Express API + tracker/DB scripts |

## Getting started

```bash
# API
cd backend
npm i
cp .env.example .env   # fill secrets
npm run dev            # :4000

# UI (separate terminal)
cd frontend
npm i
# ensure .env.local has NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev            # :3000
```

Tracker / DB scripts: `cd backend && npm run tracker:seed` (see `backend/package.json`).

Open [http://localhost:3000](http://localhost:3000).
