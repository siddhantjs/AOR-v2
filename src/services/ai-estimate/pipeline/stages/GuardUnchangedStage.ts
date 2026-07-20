import { EstimateRunResult } from "../../models";
import type { EstimateContext } from "../../EstimateContext";
import { PipelineStage } from "../PipelineStage";

/** SCHEMA_V3: skip when inputsHash unchanged. */
export class GuardUnchangedStage extends PipelineStage {
  readonly name = "GuardUnchanged";

  async execute(ctx: EstimateContext): Promise<void> {
    const prev = ctx.snapshot.estimateMeta;
    if (prev && ctx.inputsHash && prev.inputsHash === ctx.inputsHash) {
      ctx.abort(
        "inputsHash unchanged — skip AI call.",
        EstimateRunResult.skipped("inputsHash unchanged", ctx.inputsHash),
      );
    }
  }
}
