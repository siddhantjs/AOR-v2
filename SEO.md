# AOR-v2 SEO / AEO / GEO

How marketing pages get crawled, indexed, and structured - and what to do when you add a route.

**Site origin:** `NEXT_PUBLIC_SITE_URL` (see `env.example`). Resolved in [`src/lib/site-url.ts`](src/lib/site-url.ts).

---

## Public vs private

| Kind | Examples | Index? | Sitemap? | robots |
|------|----------|--------|----------|--------|
| **Public / marketing** | `/`, future guides | Yes | Yes | Allow |
| **App / private** | `/track`, `/login`, `/dashboard/*`, `/api/*`, `/s/*` | **No** | No | Disallow |

Single source of truth for lists: [`src/lib/sitemap-paths.ts`](src/lib/sitemap-paths.ts)

- `SITEMAP_PUBLIC_PATHS` → used by [`src/app/sitemap.ts`](src/app/sitemap.ts)
- `ROBOTS_DISALLOW_PATHS` → used by [`src/app/robots.ts`](src/app/robots.ts)

---

## File map

| File | Role |
|------|------|
| `src/lib/site-url.ts` | Absolute URLs (`getSiteUrl`, `absoluteUrl`) |
| `src/lib/sitemap-paths.ts` | Public paths + robots disallow prefixes |
| `src/lib/marketing-metadata.ts` | `buildPageMetadata`, `buildNoIndexMetadata`, OG defaults, `MARKETING_CONTENT_DATE_MODIFIED` |
| `src/lib/faq-content.ts` | Plain-text FAQ for JSON-LD (keep in sync with UI FAQ) |
| `src/lib/marketing-seo.tsx` | JSON-LD helpers + `<JsonLd />` |
| `src/app/robots.ts` | Crawl rules |
| `src/app/sitemap.ts` | Sitemap XML |
| `public/og/*.png` | Share cards (1200×630) |

Analytics (GA / Clarity) live under `src/components/seo/tags/` - measurement only, not ranking.

---

## Checklist: new **public** page

Example: add `/aor-to-ppr` as a marketing guide.

1. **Route** - `src/app/<path>/page.tsx` (thin page; UI in `src/components/pages/...`).
2. **Metadata** - export metadata with `buildPageMetadata`:

   ```ts
   import type { Metadata } from "next";
   import { buildPageMetadata } from "@/lib/marketing-metadata";

   export const metadata: Metadata = buildPageMetadata({
     title: "… · AORTrack",
     description: "…", // ~150–160 chars, factual
     path: "/your-path",
     keywords: ["…"],
     // ogImage: "/og/your-page.png", // optional; defaults to /og/home.png
   });
   ```

3. **Sitemap** - add `"/your-path"` to `SITEMAP_PUBLIC_PATHS` in `sitemap-paths.ts`.
4. **Do not** add the path to `ROBOTS_DISALLOW_PATHS`.
5. **OG image** (recommended) - add `public/og/<name>.png` (1200×630) and pass `ogImage`.
6. **On-page** - real H1/H2, short factual intro; if you have FAQ UI, add matching entries to `faq-content.ts` (plain strings).
7. **JSON-LD** (when useful):

   ```tsx
   import { JsonLd, faqPageJsonLd /* or custom */ } from "@/lib/marketing-seo";

   export default function Page() {
     return (
       <>
         <JsonLd data={{ "@context": "https://schema.org", ...faqPageJsonLd(YOUR_FAQ) }} />
         {/* page UI */}
       </>
     );
   }
   ```

   Home already injects Organization + WebSite + FAQPage via `homeJsonLdGraph()`.
8. **Freshness** - if you change YMYL marketing copy, bump usage of `MARKETING_CONTENT_DATE_MODIFIED` / last-updated UI as needed.

---

## Checklist: new **private / app** page

Example: `/dashboard/...` sub-route or a new wizard step.

1. **Metadata** - use `buildNoIndexMetadata` (or `buildPageMetadata({ …, noIndex: true })`).
2. **robots** - ensure a matching prefix exists in `ROBOTS_DISALLOW_PATHS` (e.g. `/dashboard/`, `/track`).
3. **Do not** add the path to `SITEMAP_PUBLIC_PATHS`.
4. Prefer a **segment `layout.tsx`** with shared noindex metadata for whole trees (see `src/app/dashboard/layout.tsx`).

```ts
import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = buildNoIndexMetadata(
  "Title · AORTrack",
  "Short description for browser tab only.",
);
```

---

## Home page pattern (reference)

- Metadata: `src/app/page.tsx` + root defaults in `src/app/layout.tsx`
- JSON-LD: `<JsonLd data={homeJsonLdGraph()} />` on the home route
- FAQ UI: `LandingFaq` - keep [`src/lib/faq-content.ts`](src/lib/faq-content.ts) aligned when Q&As change

---

## Quick self-check before merge

- [ ] Public page listed in `SITEMAP_PUBLIC_PATHS`?
- [ ] Private page using `buildNoIndexMetadata` / layout noindex?
- [ ] New private prefix added to `ROBOTS_DISALLOW_PATHS` if needed?
- [ ] Unique `title` + `description` + correct `path` for canonical?
- [ ] FAQ schema text matches on-page FAQ (if any)?
- [ ] OG image exists (or default `/og/home.png` is acceptable)?

Verify locally after deploy config:

- `/robots.txt`
- `/sitemap.xml`
- View source → `application/ld+json` on public pages
- `<meta name="robots" content="noindex…">` on app pages
