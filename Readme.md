# AOR-v2

Canadian immigration timeline tracker (Next.js UI).

Live APIs are served by an **external immigration server** (outside this repo). This app only needs that host URL.

## Getting started

```bash
npm i
cp env.example .env.local
# set NEXT_PUBLIC_API_URL to the immigration API host (no path), e.g. https://api.example.com
npm run dev                    # :3000
```

`ApiClient` calls `{NEXT_PUBLIC_API_URL}/api/aor-track/v1/...` — see `AGENTS.md` for the route table.

Open [http://localhost:3000](http://localhost:3000).
