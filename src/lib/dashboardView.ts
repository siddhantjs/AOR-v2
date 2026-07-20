import { randomBytes } from "crypto";
import {
  MILESTONES,
  type EstimateBucket,
  type ExpressEntryProgram,
  type MilestoneId,
  type Pathway,
  type VisaOffice,
} from "@/lib/schema/constants";
import type { ProfileMilestone, User } from "@/lib/schema/types";
import {
  displayApplicantDetails,
  toApplicantDetailsForm,
  type ApplicantDetailsForm,
} from "@/lib/applicantDetails";
import { formatEstimateRange } from "@/lib/estimateFormat";
import {
  daysBetween,
  daysSince,
  formatLongDate,
  formatShortDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/dates";

const EE_LABEL: Record<ExpressEntryProgram, string> = {
  cec: "CEC",
  fswp: "FSWP",
  fstp: "FSTP",
};

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export type TimelineRowView = {
  id: string;
  label: string;
  sub: boolean;
  status: "done" | "estimate" | "window";
  dateLabel?: string;
  agoDays?: number;
  chipLabel?: string;
};

export type DetailRowView = {
  key: string;
  label: string;
  value: string;
};

export type DashboardView = {
  userId: string;
  daysSinceAor: number;
  aorSub: string;
  typicalWaitDays: number | null;
  typicalWaitSub: string;
  expectedBig: string;
  expectedSub: string;
  officeChip: string;
  timeline: TimelineRowView[];
  nextUp: {
    label: string;
    chipLabel: string;
    kind: "estimate" | "window";
  } | null;
  sharePath: string;
  shareToken: string | null;
  details: DetailRowView[];
  applicantForm: ApplicantDetailsForm;
  footnote: string;
};

function streamLabel(applyingFrom: "inland" | "outland"): string {
  return applyingFrom === "inland" ? "Inland" : "Outland";
}

function progLabel(
  pathway: Pathway,
  ee: ExpressEntryProgram | null,
): string {
  if (pathway !== "express-entry") return "PNP";
  return ee ? EE_LABEL[ee] : "EE";
}

/** Mid-window date for a bucket (early≈5, mid≈15, late≈25). */
function approxIsoFromBucket(bucket: EstimateBucket, year: number): string {
  const [part, month] = bucket.split("-");
  const monthIdx = MONTH_INDEX[month] ?? 0;
  const day = part === "early" ? 5 : part === "mid" ? 15 : 25;
  return toIsoDate(new Date(Date.UTC(year, monthIdx, day, 12)));
}

function midEstimateIso(row: ProfileMilestone): string | null {
  if (
    !row.estimatedFrom ||
    !row.estimatedTo ||
    row.estimatedYearFrom == null ||
    row.estimatedYearTo == null
  ) {
    return null;
  }
  const a = parseIsoDate(
    approxIsoFromBucket(row.estimatedFrom, row.estimatedYearFrom),
  ).getTime();
  const b = parseIsoDate(
    approxIsoFromBucket(row.estimatedTo, row.estimatedYearTo),
  ).getTime();
  return toIsoDate(new Date((a + b) / 2));
}

function bilWindowNote(bilDate: string | null): string {
  if (!bilDate) return "30 day window after your BIL";
  const due = parseIsoDate(bilDate);
  due.setUTCDate(due.getUTCDate() + 30);
  return `due by ${formatShortDate(toIsoDate(due))}`;
}

function milestoneMap(user: User): Map<MilestoneId, ProfileMilestone> {
  const map = new Map<MilestoneId, ProfileMilestone>();
  for (const m of user.milestones ?? []) {
    map.set(m.milestoneId, m);
  }
  return map;
}

export function buildDashboardView(user: User): DashboardView {
  const aorIso = toIsoDate(new Date(user.aorDate));
  const itaIso = toIsoDate(new Date(user.itaDate));
  const byId = milestoneMap(user);
  const bilDate = byId.get("bil")?.milestoneDate ?? null;
  const ecopr = byId.get("ecopr");

  const timeline: TimelineRowView[] = [
    {
      id: "aor",
      label: "AOR received",
      sub: false,
      status: "done",
      dateLabel: formatShortDate(aorIso),
      agoDays: daysSince(aorIso),
    },
  ];

  for (const m of MILESTONES) {
    const row = byId.get(m.id);
    const logged = row?.milestoneDate ?? null;
    const isSub = "sub" in m && Boolean(m.sub);

    if (logged) {
      timeline.push({
        id: m.id,
        label: m.label,
        sub: isSub,
        status: "done",
        dateLabel: formatShortDate(logged),
        agoDays: daysSince(logged),
      });
      continue;
    }

    if (!m.est) {
      timeline.push({
        id: m.id,
        label: m.label,
        sub: isSub,
        status: "window",
        chipLabel: bilWindowNote(bilDate),
      });
      continue;
    }

    if (
      row?.estimatedFrom &&
      row.estimatedTo &&
      row.estimatedYearFrom != null &&
      row.estimatedYearTo != null
    ) {
      timeline.push({
        id: m.id,
        label: m.label,
        sub: isSub,
        status: "estimate",
        chipLabel: `Est. ${formatEstimateRange({
          estimatedFrom: row.estimatedFrom,
          estimatedTo: row.estimatedTo,
          estimatedYearFrom: row.estimatedYearFrom,
          estimatedYearTo: row.estimatedYearTo,
        })}`,
      });
    } else {
      timeline.push({
        id: m.id,
        label: m.label,
        sub: isSub,
        status: "estimate",
        chipLabel: "Est. pending",
      });
    }
  }

  const nextMs = MILESTONES.find((m) => {
    const row = byId.get(m.id);
    return !row?.milestoneDate;
  });

  let nextUp: DashboardView["nextUp"] = null;
  if (nextMs) {
    const row = timeline.find((t) => t.id === nextMs.id);
    if (row?.status === "window") {
      nextUp = {
        label: nextMs.label,
        chipLabel: row.chipLabel ?? "30 days after BIL",
        kind: "window",
      };
    } else {
      nextUp = {
        label: nextMs.label,
        chipLabel: row?.chipLabel?.replace(/^Est\.\s*/, "") ?? "We'll estimate",
        kind: "estimate",
      };
    }
  }

  let typicalWaitDays: number | null = null;
  let expectedBig = "—";
  let expectedSub = "Typical eCOPR window for your profile";

  if (ecopr?.milestoneDate) {
    expectedBig = formatShortDate(ecopr.milestoneDate);
    expectedSub = "Your eCOPR is already in. Congratulations.";
    typicalWaitDays = daysBetween(aorIso, ecopr.milestoneDate);
  } else if (
    ecopr?.estimatedFrom &&
    ecopr.estimatedTo &&
    ecopr.estimatedYearFrom != null &&
    ecopr.estimatedYearTo != null
  ) {
    const mid = midEstimateIso(ecopr);
    if (mid) typicalWaitDays = Math.max(0, daysBetween(aorIso, mid));
    expectedBig = formatEstimateRange({
      estimatedFrom: ecopr.estimatedFrom,
      estimatedTo: ecopr.estimatedTo,
      estimatedYearFrom: ecopr.estimatedYearFrom,
      estimatedYearTo: ecopr.estimatedYearTo,
    });
    expectedSub = "AI estimate for eCOPR";
  }

  const officeChip = user.primaryVisaOffice
    ? `PVO ${user.primaryVisaOffice}${
        user.secondaryVisaOffice ? ` · SVO ${user.secondaryVisaOffice}` : ""
      }`
    : "Add your PVO to sharpen estimates";

  const applicantForm = toApplicantDetailsForm(user);
  const details: DetailRowView[] = displayApplicantDetails(applicantForm).map(
    (row) =>
      row.key === "ita"
        ? { ...row, value: formatLongDate(itaIso) }
        : row,
  );

  return {
    userId: String(user._id),
    daysSinceAor: daysSince(aorIso),
    aorSub: `AOR on ${formatLongDate(aorIso)}`,
    typicalWaitDays,
    typicalWaitSub: `AOR to eCOPR · ${progLabel(user.pathway, user.expressEntryProgram)} · ${streamLabel(user.applyingFrom)}`,
    expectedBig,
    expectedSub,
    officeChip,
    timeline,
    nextUp,
    shareToken: user.shareToken,
    sharePath: user.shareToken
      ? `track.getnorthpath.com/s/${user.shareToken}`
      : "Share link will appear after submit",
    details,
    applicantForm,
    footnote:
      "Estimates are AI windows for your profile (pathway, dates, offices, and logged milestones). Biometrics completion is not estimated because IRCC gives you 30 days from your BIL. Estimates are guidance, not IRCC guarantees.",
  };
}

export function newShareToken(): string {
  return randomBytes(9).toString("base64url");
}

/** Merge form ticks into stored profile rows; clear estimates on logged dates. */
export function mergeLoggedMilestones(
  existing: ProfileMilestone[],
  logged: Partial<Record<MilestoneId, { done: boolean; date: string }>>,
): ProfileMilestone[] {
  const byId = new Map(existing.map((m) => [m.milestoneId, m]));

  return MILESTONES.map((def) => {
    const entry = logged[def.id];
    const prev = byId.get(def.id);

    if (entry?.done && entry.date) {
      return {
        milestoneId: def.id,
        milestoneDate: entry.date,
        estimatedFrom: null,
        estimatedTo: null,
        estimatedYearFrom: null,
        estimatedYearTo: null,
      };
    }

    return {
      milestoneId: def.id,
      milestoneDate: null,
      estimatedFrom: prev?.estimatedFrom ?? null,
      estimatedTo: prev?.estimatedTo ?? null,
      estimatedYearFrom: prev?.estimatedYearFrom ?? null,
      estimatedYearTo: prev?.estimatedYearTo ?? null,
    };
  });
}

export function officesFromBody(
  primary: string | null | undefined,
  secondary: string | null | undefined,
): {
  primaryVisaOffice: VisaOffice | null;
  secondaryVisaOffice: VisaOffice | null;
} {
  const p = primary?.trim() || "";
  const s = secondary?.trim() || "";
  return {
    primaryVisaOffice: (p || null) as VisaOffice | null,
    secondaryVisaOffice: (s || null) as VisaOffice | null,
  };
}
