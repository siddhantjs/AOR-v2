import {
  DRAW_CATEGORIES,
  MILESTONES,
  type DrawCategory,
  type ExpressEntryProgram,
  type MilestoneId,
  type Pathway,
} from "@/lib/schema/constants";
import { daysSince, formatLongDate, formatShortDate, toIsoDate } from "@/lib/dates";
import type { ProfileMilestone, User } from "@/lib/schema/types";

const SHORT_FILTER: Record<MilestoneId, string> = {
  bil: "BIL received",
  bio_done: "Biometrics done",
  medical: "Medical passed",
  bgc_start: "BGC initiated",
  crim: "Criminality",
  info: "Info sharing",
  sec: "Security",
  elig: "Eligibility",
  final: "Final decision",
  p1: "Portal 1",
  p2: "Portal 2",
  ecopr: "eCOPR",
  prcard: "PR card",
};

const STAGE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  aor: { label: "AOR received", bg: "#eef1f4", fg: "#68727e" },
  bil: { label: "BIL received", bg: "#ecf2fe", fg: "#2f6fed" },
  bio_done: { label: "Biometrics completed", bg: "#ecf2fe", fg: "#2f6fed" },
  medical: { label: "Medical passed", bg: "#e8f6ef", fg: "#1f9d61" },
  bgc_start: { label: "Background check", bg: "#fdf4e2", fg: "#b97f16" },
  crim: { label: "Background check", bg: "#fdf4e2", fg: "#b97f16" },
  info: { label: "Background check", bg: "#fdf4e2", fg: "#b97f16" },
  sec: { label: "Background check", bg: "#fdf4e2", fg: "#b97f16" },
  elig: { label: "Eligibility passed", bg: "#e8f6ef", fg: "#1f9d61" },
  final: { label: "Final decision", bg: "#f0ebfa", fg: "#7c5cbf" },
  p1: { label: "Portal 1", bg: "#f0ebfa", fg: "#7c5cbf" },
  p2: { label: "Portal 2", bg: "#f0ebfa", fg: "#7c5cbf" },
  ecopr: { label: "eCOPR received", bg: "#e8f6ef", fg: "#1f9d61" },
  prcard: { label: "PR card", bg: "#141f2c", fg: "#e9a13b" },
};

const EE_LABEL: Record<ExpressEntryProgram, string> = {
  cec: "CEC",
  fswp: "FSWP",
  fstp: "FSTP",
};

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function cohortDisplayName(cohortKey: string): string {
  const [ym, stream] = cohortKey.split("|");
  const [y, m] = ym.split("-").map(Number);
  const month = MONTH_SHORT[(m ?? 1) - 1] ?? ym;
  const where = stream === "inland" ? "Inland" : "Outland";
  return `${month} ${y} · ${where}`;
}

export function cohortFilterOptions(): { value: "all" | MilestoneId; label: string }[] {
  return [
    { value: "all", label: "All" },
    ...MILESTONES.map((m) => ({
      value: m.id as MilestoneId,
      label: SHORT_FILTER[m.id],
    })),
  ];
}

function progLabel(pathway: Pathway, ee: ExpressEntryProgram | null): string {
  if (pathway !== "express-entry") return "PNP";
  return ee ? EE_LABEL[ee] : "EE";
}

function drawShort(cat: DrawCategory): string {
  if (cat === "general") return "General";
  if (cat === "stem") return "STEM";
  const full = DRAW_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  return full.split(" ")[0] ?? cat;
}

function loggedMap(
  milestones: ProfileMilestone[] | undefined,
): Partial<Record<MilestoneId, string>> {
  const out: Partial<Record<MilestoneId, string>> = {};
  for (const row of milestones ?? []) {
    if (row.milestoneDate) out[row.milestoneId] = row.milestoneDate;
  }
  return out;
}

function furthestId(logged: Partial<Record<MilestoneId, string>>): MilestoneId | null {
  let last: MilestoneId | null = null;
  for (const m of MILESTONES) {
    if (logged[m.id]) last = m.id;
  }
  return last;
}

/** Furthest logged stage id, or `aor` if none logged yet. */
export function furthestStageKey(milestones: ProfileMilestone[] | undefined): string {
  return furthestId(loggedMap(milestones)) ?? "aor";
}

export function stageStyle(stageKey: string): {
  label: string;
  bg: string;
  fg: string;
} {
  return STAGE_STYLE[stageKey] ?? STAGE_STYLE.aor;
}

function avColor(handle: string): string {
  let x = 0;
  for (let i = 0; i < handle.length; i++) {
    x = (x * 31 + handle.charCodeAt(i)) >>> 0;
  }
  const hues = [8, 205, 152, 262, 28, 338];
  return `hsl(${hues[x % hues.length]},48%,44%)`;
}

export type CohortApplicantView = {
  id: string;
  isYou: boolean;
  handle: string;
  initials: string;
  avatarBg: string;
  progLabel: string;
  catShort: string;
  streamLabel: string;
  aorIso: string;
  aorLabel: string;
  stageLabel: string;
  stageBg: string;
  stageFg: string;
  furthestId: MilestoneId | null;
  loggedMs: Partial<Record<MilestoneId, string>>;
  details: { label: string; value: string }[];
};

export function toCohortApplicant(user: User, viewerId: string): CohortApplicantView {
  const isYou = String(user._id) === viewerId;
  const handle = isYou ? "You" : user.username?.trim() || "Peer";
  const logged = loggedMap(user.milestones);
  const furthest = furthestId(logged);
  const stage = STAGE_STYLE[furthest ?? "aor"];
  const aorIso = toIsoDate(new Date(user.aorDate));
  const streamLabel = user.applyingFrom === "inland" ? "Inland" : "Outland";
  const prog = progLabel(user.pathway, user.expressEntryProgram);
  const cat = drawShort(user.drawCategory);
  const ud = user.userDetails;

  return {
    id: String(user._id),
    isYou,
    handle,
    initials: isYou ? "YOU" : handle.slice(0, 2).toUpperCase(),
    avatarBg: isYou ? "var(--red)" : avColor(handle),
    progLabel: prog,
    catShort: cat,
    streamLabel,
    aorIso,
    aorLabel: formatShortDate(aorIso),
    stageLabel: stage.label,
    stageBg: stage.bg,
    stageFg: stage.fg,
    furthestId: furthest,
    loggedMs: logged,
    details: [
      { label: "AOR date", value: formatLongDate(aorIso) },
      { label: "Program", value: prog },
      {
        label: "Draw category",
        value: DRAW_CATEGORIES.find((c) => c.value === user.drawCategory)?.label ?? cat,
      },
      { label: "Location", value: streamLabel },
      { label: "PVO", value: user.primaryVisaOffice ?? "—" },
      { label: "Nationality", value: ud?.nationality ?? "—" },
      {
        label: "CRS score",
        value: ud?.crsScore != null ? String(ud.crsScore) : "—",
      },
      { label: "Marital status", value: ud?.maritalStatus ?? "—" },
      {
        label: "Dependants",
        value: ud?.dependants != null ? String(ud.dependants) : "—",
      },
      { label: "Medical type", value: ud?.medicalType ?? "—" },
    ],
  };
}

export type CohortTimelineRow = {
  label: string;
  dateLabel: string;
  agoDays: number;
  pending?: boolean;
};

export function applicantTimelineRows(a: CohortApplicantView): CohortTimelineRow[] {
  const rows: CohortTimelineRow[] = [
    {
      label: "AOR received",
      dateLabel: formatShortDate(a.aorIso),
      agoDays: daysSince(a.aorIso),
    },
  ];
  for (const m of MILESTONES) {
    const d = a.loggedMs[m.id];
    if (d) {
      rows.push({
        label: m.label,
        dateLabel: formatShortDate(d),
        agoDays: daysSince(d),
      });
    }
  }
  const pending = MILESTONES.filter((m) => !a.loggedMs[m.id]).slice(0, 3);
  for (const m of pending) {
    rows.push({
      label: m.label,
      dateLabel: "not yet",
      agoDays: 0,
      pending: true,
    });
  }
  return rows;
}

export type CohortOption = {
  cohortKey: string;
  label: string;
  isYours: boolean;
};
