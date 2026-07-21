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

export type MilestoneId = (typeof MILESTONES)[number]["id"];
export type MilestoneSection = (typeof MILESTONES)[number]["sec"];

export const MILESTONE_IDS = MILESTONES.map((m) => m.id);

export const ESTIMATE_PARTS = ["early", "mid", "late"] as const;
export const ESTIMATE_MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type EstimateBucket =
  `${(typeof ESTIMATE_PARTS)[number]}-${(typeof ESTIMATE_MONTHS)[number]}`;

export const ESTIMATE_BUCKETS: EstimateBucket[] = ESTIMATE_PARTS.flatMap((part) =>
  ESTIMATE_MONTHS.map((month) => `${part}-${month}` as EstimateBucket),
);

export const APPLYING_FROM = ["inland", "outland"] as const;
export type ApplyingFrom = (typeof APPLYING_FROM)[number];

export const PATHWAYS = ["express-entry", "provincial-nominee-program"] as const;
export type Pathway = (typeof PATHWAYS)[number];

export const EXPRESS_ENTRY_PROGRAMS = ["cec", "fswp", "fstp"] as const;
export type ExpressEntryProgram = (typeof EXPRESS_ENTRY_PROGRAMS)[number];

export const MARITAL_STATUSES = ["married", "single", "common-law"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const SPOUSE_STATUSES = ["accompanying", "non-accompanying", "no-spouse"] as const;
export type SpouseStatus = (typeof SPOUSE_STATUSES)[number];

export const MEDICAL_TYPES = ["old-medical", "new-medical"] as const;
export type MedicalType = (typeof MEDICAL_TYPES)[number];

export const ESTIMATE_PHASES = ["aor-only", "with-offices"] as const;
export type EstimatePhase = (typeof ESTIMATE_PHASES)[number];

/** Country list not defined in SCHEMA_V3 yet — free string until enumerated. */
export type Country = string;
