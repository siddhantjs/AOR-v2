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

export class EstimateRunResult {
  constructor(
    readonly status: "skipped" | "completed" | "failed",
    readonly phase: EstimatePhase | null,
    readonly inputsHash: string | null,
    readonly estimates: MilestoneEstimate[],
    readonly reason: string | null = null,
  ) {}

  static skipped(reason: string, hash: string | null = null): EstimateRunResult {
    return new EstimateRunResult("skipped", null, hash, [], reason);
  }

  static failed(reason: string): EstimateRunResult {
    return new EstimateRunResult("failed", null, null, [], reason);
  }

  static completed(
    phase: EstimatePhase,
    hash: string,
    estimates: MilestoneEstimate[],
  ): EstimateRunResult {
    return new EstimateRunResult("completed", phase, hash, estimates, null);
  }
}
