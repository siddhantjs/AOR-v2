import type { ApplicantDetailsForm } from "@/lib/applicantDetails";

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
