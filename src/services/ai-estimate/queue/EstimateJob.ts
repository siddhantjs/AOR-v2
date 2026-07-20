import type { EstimateRunResult, UserEstimateSnapshot } from "../models";

export type EstimateJobStatus = "queued" | "running" | "completed" | "failed";

export class EstimateJob {
  status: EstimateJobStatus = "queued";
  result: EstimateRunResult | null = null;
  error: string | null = null;
  readonly enqueuedAt = new Date();
  startedAt: Date | null = null;
  finishedAt: Date | null = null;

  constructor(
    readonly id: string,
    readonly userId: string,
    /** Optional preloaded snapshot; otherwise loaded by repository in the worker. */
    readonly snapshot: UserEstimateSnapshot | null = null,
  ) {}
}
