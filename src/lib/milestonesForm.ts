import { MILESTONES, type MilestoneId, type VisaOffice } from "@/lib/schema/constants";

export type MilestoneEntry = {
  done: boolean;
  date: string;
};

export type MilestonesFormState = {
  milestones: Record<MilestoneId, MilestoneEntry>;
  primaryVisaOffice: VisaOffice | "";
  secondaryVisaOffice: VisaOffice | "";
};

/** Server-safe empty form — do not put this in a `"use client"` module. */
export function emptyMilestonesFormState(): MilestonesFormState {
  return {
    milestones: Object.fromEntries(
      MILESTONES.map((m) => [m.id, { done: false, date: "" }]),
    ) as Record<MilestoneId, MilestoneEntry>,
    primaryVisaOffice: "",
    secondaryVisaOffice: "",
  };
}
