import type { EstimatePhase, MilestoneEstimate } from "@/lib/schema/types";
import type { EstimateConfig } from "./EstimateConfig";
import {
  EstimatePromptPayload,
  EstimateRunResult,
  UserEstimateSnapshot,
} from "./models";

/**
 * Mutable context passed through every pipeline stage (Context Object pattern).
 */
export class EstimateContext {
  phase: EstimatePhase | null = null;
  inputsHash: string | null = null;
  prompt: EstimatePromptPayload | null = null;
  estimates: MilestoneEstimate[] = [];
  aborted = false;
  abortReason: string | null = null;
  result: EstimateRunResult | null = null;

  constructor(
    readonly snapshot: UserEstimateSnapshot,
    readonly config: EstimateConfig,
  ) {}

  abort(reason: string, result?: EstimateRunResult): void {
    this.aborted = true;
    this.abortReason = reason;
    if (result) this.result = result;
  }
}
