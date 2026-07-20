import type {
  ApplyingFrom,
  DrawCategory,
  EstimateMeta,
  EstimatePhase,
  ExpressEntryProgram,
  MilestoneEstimate,
  Pathway,
  ProfileMilestone,
  VisaOffice,
} from "@/lib/schema/types";

/** Immutable input snapshot for one estimate run (class, not a plain bag). */
export class UserEstimateSnapshot {
  constructor(
    readonly userId: string,
    readonly applyingFrom: ApplyingFrom,
    readonly pathway: Pathway,
    readonly expressEntryProgram: ExpressEntryProgram | null,
    readonly drawCategory: DrawCategory,
    readonly itaDate: Date,
    readonly aorDate: Date,
    readonly primaryVisaOffice: VisaOffice | null,
    readonly secondaryVisaOffice: VisaOffice | null,
    readonly milestones: ProfileMilestone[],
    readonly estimateMeta: EstimateMeta | null,
  ) {}

  hasOffices(): boolean {
    return this.primaryVisaOffice != null || this.secondaryVisaOffice != null;
  }
}

export class EstimatePromptPayload {
  constructor(
    readonly phase: EstimatePhase,
    readonly applyingFrom: ApplyingFrom,
    readonly pathway: Pathway,
    readonly expressEntryProgram: ExpressEntryProgram | null,
    readonly drawCategory: DrawCategory,
    readonly itaDate: string,
    readonly aorDate: string,
    readonly primaryVisaOffice: VisaOffice | null,
    readonly secondaryVisaOffice: VisaOffice | null,
    readonly loggedMilestones: ReadonlyArray<{
      milestoneId: string;
      milestoneDate: string;
    }>,
  ) {}
}

export type EstimateRunStatus = "pending" | "skipped" | "completed" | "failed";

export class EstimateRunResult {
  constructor(
    readonly status: EstimateRunStatus,
    readonly phase: EstimatePhase | null,
    readonly inputsHash: string | null,
    readonly estimates: MilestoneEstimate[],
    readonly reason: string | null = null,
  ) {}

  static skipped(reason: string, inputsHash: string | null = null): EstimateRunResult {
    return new EstimateRunResult("skipped", null, inputsHash, [], reason);
  }

  static failed(reason: string): EstimateRunResult {
    return new EstimateRunResult("failed", null, null, [], reason);
  }

  static completed(
    phase: EstimatePhase,
    inputsHash: string,
    estimates: MilestoneEstimate[],
  ): EstimateRunResult {
    return new EstimateRunResult("completed", phase, inputsHash, estimates, null);
  }
}
