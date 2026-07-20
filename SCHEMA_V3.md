# AORTrack schema v3

Schemas as specified for the product redesign.

Estimates are **per-user AI windows** (month buckets), not community medians. Cohorts are for browsing peers only.

---

## 1. Draw category

```ts
export const DRAW_CATEGORIES = [
  { value: "general", label: "General, all program draw" },
  { value: "french", label: "French language proficiency" },
  {
    value: "healthcare-social",
    label: "Healthcare and social services occupations",
  },
  {
    value: "stem",
    label: "Science, Technology, Engineering and Math (STEM) occupations",
  },
  {
    value: "trades",
    label: "Trade occupations (carpenters, electricians, welders)",
  },
  {
    value: "transport",
    label: "Transport occupations (truck drivers, pilots)",
  },
  { value: "education", label: "Education occupations" },
  {
    value: "physicians-senior-managers-researchers-military",
    label:
      "Physicians, senior managers, researchers and military recruits with Canadian work experience",
  },
] as const;

export type DrawCategory = (typeof DRAW_CATEGORIES)[number]["value"];
```

---

## 2. Visa offices

```ts
export const OFFICE_LIST = [
  "Ottawa",
  "Edmonton",
  "Vancouver",
  "Montreal",
  "Scarborough",
  "Etobicoke",
  "Mississauga",
  "Niagara Falls",
  "Sydney NS",
  "New Delhi",
  "Chandigarh",
  "Manila",
  "London UK",
  "Abu Dhabi",
  "Ankara",
  "Mexico City",
  "Sao Paulo",
  "Other",
  "Not sure",
] as const;

export type VisaOffice = (typeof OFFICE_LIST)[number];
```

PVO / SVO are stored on the user profile and passed into the AI estimate prompt when available. There is **no** day-offset table and **no** `STREAM_PACE` collection.

---

## 3. Milestones

```ts
export const MILESTONES = [
  {
    id: "bil",
    sec: "biometrics",
    label: "Biometrics letter (BIL) received",
    desc: "The instruction letter from IRCC, usually about 2 months after AOR",
    est: true,
  },
  {
    id: "bio_done",
    sec: "biometrics",
    label: "Biometrics completed",
    desc: "You get 30 days from your BIL, so this one is in your hands",
    est: false,
    needs: "bil",
  },
  {
    id: "medical",
    sec: "medical-and-background",
    label: "Medical passed",
    desc: "Your account shows medical results received",
    est: true,
  },
  {
    id: "bgc_start",
    sec: "medical-and-background",
    label: "Background check initiated",
    desc: "BGC flips from not applicable to in progress",
    est: true,
  },
  {
    id: "crim",
    sec: "medical-and-background",
    label: "Criminality check completed",
    desc: "Part of the background check",
    est: true,
    sub: true,
    needs: "bgc_start",
  },
  {
    id: "info",
    sec: "medical-and-background",
    label: "Information sharing completed",
    desc: "Part of the background check",
    est: true,
    sub: true,
    needs: "bgc_start",
  },
  {
    id: "sec",
    sec: "medical-and-background",
    label: "Security check completed",
    desc: "Part of the background check",
    est: true,
    sub: true,
    needs: "bgc_start",
  },
  {
    id: "elig",
    sec: "medical-and-background",
    label: "Eligibility check completed",
    desc: "Eligibility shows recommended or passed",
    est: true,
  },
  {
    id: "final",
    sec: "decision-and-portals",
    label: "Final decision received",
    desc: "Your application shows approved",
    est: true,
  },
  {
    id: "p1",
    sec: "decision-and-portals",
    label: "P1 Portal invitation received",
    desc: "First PR confirmation portal email",
    est: true,
  },
  {
    id: "p2",
    sec: "decision-and-portals",
    label: "P2 Portal invitation received",
    desc: "Photo and address portal email",
    est: true,
  },
  {
    id: "ecopr",
    sec: "the-finish-line",
    label: "eCOPR received",
    desc: "Electronic Confirmation of Permanent Residence",
    est: true,
  },
  {
    id: "prcard",
    sec: "the-finish-line",
    label: "PR card received",
    desc: "The physical card lands in your mailbox",
    est: true,
  },
] as const;
```

### Milestone config vs stored data

`MILESTONES` above is **UI / validation only** (`label`, `sec`, `desc`, `est`, `needs`, `sub`). It is not written onto each profile.

### Estimate month buckets

Canonical slugs stored on the profile. UI formats as `"Early September to Mid October"`.

```ts
// Pattern: "{early|mid|late}-{month}"
// month ∈ january … december
export type EstimateBucket =
  | "early-january" | "mid-january" | "late-january"
  | "early-february" | "mid-february" | "late-february"
  | "early-march" | "mid-march" | "late-march"
  | "early-april" | "mid-april" | "late-april"
  | "early-may" | "mid-may" | "late-may"
  | "early-june" | "mid-june" | "late-june"
  | "early-july" | "mid-july" | "late-july"
  | "early-august" | "mid-august" | "late-august"
  | "early-september" | "mid-september" | "late-september"
  | "early-october" | "mid-october" | "late-october"
  | "early-november" | "mid-november" | "late-november"
  | "early-december" | "mid-december" | "late-december";
```

Include year in the AI response or derive from AOR when formatting (e.g. store optional `estimatedYear` if the window crosses year boundaries). Prefer storing year on the range:

```ts
// Optional if buckets alone are ambiguous across years
estimatedYearFrom?: number;  // e.g. 2026
estimatedYearTo?: number;
```

### Profile milestone (stored on user)

```ts
PROFILE_MILESTONE = {
  milestoneId: MILESTONES.id;
  milestoneDate: date | null;          // real logged date (ISO YYYY-MM-DD)
  estimatedFrom: EstimateBucket | null;
  estimatedTo: EstimateBucket | null;
  estimatedYearFrom: number | null;
  estimatedYearTo: number | null;
}
```

- If `milestoneDate` is set → show the real date; clear or ignore estimate fields for that row.
- If `est: false` (`bio_done`) → never fill AI estimates; UI shows “30 days after BIL”.
- Display range: `"Early September to Mid October"` (from `estimatedFrom` … `estimatedTo`).

---

## 4. User details

```ts
USER_DETAILS = {
  crsScore: number | null;
  maritalStatus: enum[married, single, common-law] | null;
  spouseStatus: enum[accompanying, non-accompanying, no-spouse] | null;
  nationality: enum[countries] | null;
  foreignWork: boolean | null;
  foreignWorkYears: number | null;     // when foreignWork is true
  canadianWork: boolean | null;
  canadianWorkYears: number | null;    // when canadianWork is true
  dependants: number | null;
  countryOfResidence: enum[countries] | null;
  medicalType: enum[old-medical, new-medical] | null;
}
```

PVO / SVO live on `USER_SCHEMA` (AI prompt context), not inside `userDetails`.
All `USER_DETAILS` fields are optional at first submit.

---

## 5. User schema

```ts
ESTIMATE_META = {
  generatedAt: date;
  model: string;
  promptVersion: string;
  phase: "aor-only" | "with-offices";
  // Hash of: itaDate, aorDate, applyingFrom, pathway, expressEntryProgram,
  //          primaryVisaOffice, secondaryVisaOffice, logged milestone dates
  inputsHash: string;
}

USER_SCHEMA = {
  _id: ObjectId;

  // Identity
  username: string | null;             // unique for live users; not enforced while seeding
  email: string;                       // email validation & unique
  emailNorm: string;                   // lowercased; unique index
  caseNo: string | null;               // tracker Case # — unique (sparse)
  shareToken: string | null;           // public /s/[token] — unique (sparse)
  seededData: boolean;                 // true = scraped/imported from tracker

  // Application
  applyingFrom: enum[inland, outland];
  pathway: enum[express-entry, provincial-nominee-program];
  // expressEntryProgram only when pathway is express-entry
  expressEntryProgram: enum[cec, fswp, fstp, null];
  drawCategory: enum[DRAW_CATEGORIES];
  itaDate: date;
  aorDate: date;
  primaryVisaOffice: enum[OFFICE_LIST] | null;
  secondaryVisaOffice: enum[OFFICE_LIST] | null;

  // Timeline + cohort
  milestones: PROFILE_MILESTONE[];
  cohortKey: ref("Cohort");            // always ObjectId → COHORT._id
  currentStatus: string | null;

  // AI estimates (cached on profile — do not call on every page load)
  estimateMeta: ESTIMATE_META | null;

  // Optional extras
  userDetails: USER_DETAILS;
  purity: number | null;

  // Timestamps
  createdAt: date;
  updatedAt: date;
  submittedAt: date | null;
}
```

### Uniqueness

| Field | Unique? | Notes |
|-------|---------|--------|
| `email` / `emailNorm` | Yes | Always |
| `caseNo` | Yes (sparse) | Tracker sync PK; null for non-seeded |
| `shareToken` | Yes (sparse) | Null until share is created |
| `username` | Yes for live users | **Not unique while seeding**. Enforce only when `seededData === false`. |

Resolve cohort on write: find-or-create `COHORT` by `"{YYYY-MM}|{inland|outland}"`, then set `USER_SCHEMA.cohortKey` to that document’s `_id`.

---

## 6. Cohort (browse only)

No medians / percentiles. Cohorts group peers for the browse UI.

```ts
// cohortKey = "{YYYY-MM}|{inland|outland}"
// Example: "2026-03|inland"
// Derived from: aorDate.slice(0, 7) + "|" + applyingFrom

COHORT = {
  _id: ObjectId;
  cohortKey: string;                   // unique — "{YYYY-MM}|{inland|outland}"
  aorMonth: string;                    // "YYYY-MM"
  applyingFrom: enum[inland, outland];

  nApplicants: number;
  nCompleted: number;                  // has ecopr milestoneDate
  nWaiting: number;                    // no ecopr yet

  dominantStage: MILESTONES.id | null;
  stageDistribution: {
    [milestoneId: MILESTONES.id]: number;
  };

  lastUpdated: date;
}
```

`USER_SCHEMA.cohortKey` is always `ref("Cohort")` → `COHORT._id`. Rebuild counts / stage distribution on profile insert/update (not for estimates).

---

## 7. AI estimation flow

No `STREAM_PACE`. No community median tables. Estimates live only on `PROFILE_MILESTONE` + `estimateMeta`.

### When to call

| Trigger | Call? | `phase` |
|---------|-------|---------|
| ITA + AOR first complete, PVO **and** SVO still missing | **Call 1** | `"aor-only"` |
| Later PVO and/or SVO set (after call 1) | **Call 2** | `"with-offices"` |
| ITA + AOR first complete, PVO **and** SVO already set | **One call only** | `"with-offices"` — skip call 2 |
| `inputsHash` unchanged | Skip | — |
| ITA / AOR change | Re-run (same rules as above) | — |
| PVO / SVO change after `"with-offices"` | Re-run call 2 | `"with-offices"` |

Max **2** AI runs per user in the happy path; **1** if offices are already filled when ITA+AOR land.

### Prompt inputs

- Always: `itaDate`, `aorDate`, `applyingFrom`, `pathway`, `expressEntryProgram`, draw category, logged `milestoneDate`s
- When `phase === "with-offices"`: also `primaryVisaOffice`, `secondaryVisaOffice`

### Output

For each estimable pending milestone (`est: true` and no `milestoneDate`):

```ts
{
  milestoneId: MILESTONES.id;
  estimatedFrom: EstimateBucket;
  estimatedTo: EstimateBucket;
  estimatedYearFrom: number;
  estimatedYearTo: number;
}
```

Write onto matching `PROFILE_MILESTONE` rows; update `estimateMeta`.

### Rules

- Never AI-estimate `bio_done`
- Do not call on every dashboard load — only when hash/phase rules say so
- When user logs a real `milestoneDate`, clear that row’s estimate fields
- Optional: after new logged dates, refresh remaining estimates if you want tighter windows (counts as another call; gate with hash)

---

## What needs to be added

1. **Indexes** — unique on `emailNorm`; sparse unique on `caseNo` / `shareToken`; unique on `username` only for live users (`seededData: false`); index on `cohortKey` (ObjectId) and `applyingFrom`.
2. **Tracker → milestone mapping** — which source columns fill which of the 13 ids; user-only vs tracker-filled (see decoder keys: inland eCOPR vs outland landing, `final` ← Decision Made, etc.).
3. **Inland/outland on seed** — still needed for correct **cohort browse** grouping; not required for AI estimates (live users self-select `applyingFrom`).
4. **AI provider wiring** — model, `promptVersion`, structured output validation for buckets, rate limits / retries.
