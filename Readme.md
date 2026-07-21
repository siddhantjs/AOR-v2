# AOR-v2

Canadian immigration timeline tracker (Next.js UI).

## Layout

| Directory | Role |
|-----------|------|
| `frontend/` | Next.js UI — talks to the immigration API |
| `backend/` | Optional local / reference Express stub of the same API contract + tracker/DB scripts |

Live APIs are served by an **external immigration server** (outside this repo). This app only needs that host URL.

## Getting started

```bash
cd frontend
npm i
cp ../env.example .env.local   # or create .env.local
# set NEXT_PUBLIC_API_URL to the immigration API host (no path), e.g. https://api.example.com
npm run dev                    # :3000
```

`ApiClient` calls `{NEXT_PUBLIC_API_URL}/api/aor-track/v1/...` — see `AGENTS.md` for the route table.

### Optional: local API stub

```bash
cd backend
npm i
# set MONGODB_URI, GEMINI_API_KEY, etc. in backend/.env
npm run dev                    # :4000
# then NEXT_PUBLIC_API_URL=http://localhost:4000 in frontend/.env.local
```

Open [http://localhost:3000](http://localhost:3000).
