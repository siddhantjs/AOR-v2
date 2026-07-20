import { EstimateRunResult } from "../../models";
import type { EstimateContext } from "../../EstimateContext";
import { PipelineStage } from "../PipelineStage";

/** SCHEMA_V3: offices present → with-offices, else aor-only. */
export class ResolvePhaseStage extends PipelineStage {
  readonly name = "ResolvePhase";

  async execute(ctx: EstimateContext): Promise<void> {
    const { itaDate, aorDate } = ctx.snapshot;
    if (
      !itaDate ||
      !aorDate ||
      Number.isNaN(itaDate.getTime()) ||
      Number.isNaN(aorDate.getTime())
    ) {
      ctx.abort(
        "ITA and AOR are required before estimating.",
        EstimateRunResult.failed("ITA and AOR are required before estimating."),
      );
      return;
    }

    ctx.phase = ctx.snapshot.hasOffices() ? "with-offices" : "aor-only";
  }
}
