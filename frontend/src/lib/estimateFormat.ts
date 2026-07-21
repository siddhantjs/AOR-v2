import type { EstimateBucket, MilestoneEstimate } from "@/lib/schema/types";

const PART_LABEL: Record<string, string> = {
  early: "Early",
  mid: "Mid",
  late: "Late",
};

const MONTH_LABEL: Record<string, string> = {
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December",
};

/** `"early-september"` → `"Early September"`. */
export function formatEstimateBucket(bucket: EstimateBucket): string {
  const [part, month] = bucket.split("-");
  const partLabel = PART_LABEL[part] ?? part;
  const monthLabel = MONTH_LABEL[month] ?? month;
  return `${partLabel} ${monthLabel}`;
}

/**
 * SCHEMA display: `"Early September to Mid October"`.
 * Years included only when the window spans different years.
 */
export function formatEstimateRange(est: {
  estimatedFrom: EstimateBucket;
  estimatedTo: EstimateBucket;
  estimatedYearFrom: number;
  estimatedYearTo: number;
}): string {
  const from = formatEstimateBucket(est.estimatedFrom);
  const to = formatEstimateBucket(est.estimatedTo);
  const { estimatedYearFrom: y0, estimatedYearTo: y1 } = est;

  if (y0 !== y1) {
    return `${from} ${y0} to ${to} ${y1}`;
  }
  if (from === to) {
    return `${from} ${y0}`;
  }
  return `${from} to ${to}`;
}

export function estimatesFromProfile(
  milestones: ReadonlyArray<{
    milestoneId: string;
    milestoneDate?: string | null;
    estimatedFrom?: EstimateBucket | null;
    estimatedTo?: EstimateBucket | null;
    estimatedYearFrom?: number | null;
    estimatedYearTo?: number | null;
  }>,
): MilestoneEstimate[] {
  const out: MilestoneEstimate[] = [];
  for (const m of milestones) {
    if (m.milestoneDate) continue;
    if (
      !m.estimatedFrom ||
      !m.estimatedTo ||
      m.estimatedYearFrom == null ||
      m.estimatedYearTo == null
    ) {
      continue;
    }
    out.push({
      milestoneId: m.milestoneId as MilestoneEstimate["milestoneId"],
      estimatedFrom: m.estimatedFrom,
      estimatedTo: m.estimatedTo,
      estimatedYearFrom: m.estimatedYearFrom,
      estimatedYearTo: m.estimatedYearTo,
    });
  }
  return out;
}
