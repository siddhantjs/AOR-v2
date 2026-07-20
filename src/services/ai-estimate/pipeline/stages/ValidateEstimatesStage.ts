import { ESTIMATE_BUCKETS, MILESTONES } from "@/lib/schema/constants";
import type { EstimateBucket } from "@/lib/schema/types";
import { EstimateRunResult } from "../../models";
import type { EstimateContext } from "../../EstimateContext";
import { PipelineStage } from "../PipelineStage";

/** Validates structured AI output against SCHEMA_V3 bucket + milestone rules. */
export class ValidateEstimatesStage extends PipelineStage {
  readonly name = "ValidateEstimates";

  async execute(ctx: EstimateContext): Promise<void> {
    const estimableIds = new Set(
      MILESTONES.filter((m) => m.est).map((m) => m.id),
    );
    const logged = new Set(
      ctx.snapshot.milestones
        .filter((m) => m.milestoneDate)
        .map((m) => m.milestoneId),
    );

    const seen = new Set<string>();
    const valid = [];

    for (const row of ctx.estimates) {
      if (row.milestoneId === "bio_done") continue;
      if (!estimableIds.has(row.milestoneId)) continue;
      if (logged.has(row.milestoneId)) continue;
      if (seen.has(row.milestoneId)) continue;
      if (!this.isBucket(row.estimatedFrom) || !this.isBucket(row.estimatedTo)) {
        continue;
      }
      if (
        !Number.isFinite(row.estimatedYearFrom) ||
        !Number.isFinite(row.estimatedYearTo)
      ) {
        continue;
      }
      seen.add(row.milestoneId);
      valid.push(row);
    }

    if (valid.length === 0) {
      ctx.abort(
        "No valid milestone estimates returned.",
        EstimateRunResult.failed("No valid milestone estimates returned."),
      );
      return;
    }

    ctx.estimates = valid;
  }

  private isBucket(value: string): value is EstimateBucket {
    return (ESTIMATE_BUCKETS as readonly string[]).includes(value);
  }
}
