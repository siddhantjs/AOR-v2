import type { EstimateMeta } from "@/lib/schema/types";
import type { UserEstimateRepository } from "../../repository/UserEstimateRepository";
import { EstimateRunResult } from "../../models";
import type { EstimateContext } from "../../EstimateContext";
import { PipelineStage } from "../PipelineStage";

export class PersistEstimatesStage extends PipelineStage {
  readonly name = "PersistEstimates";

  constructor(private readonly repo: UserEstimateRepository) {
    super();
  }

  async execute(ctx: EstimateContext): Promise<void> {
    if (!ctx.phase || !ctx.inputsHash) {
      ctx.abort("Missing phase or hash for persist.");
      return;
    }

    const meta: EstimateMeta = {
      generatedAt: new Date(),
      model: ctx.config.model,
      promptVersion: ctx.config.promptVersion,
      phase: ctx.phase,
      inputsHash: ctx.inputsHash,
    };

    await this.repo.saveEstimates(ctx.snapshot.userId, ctx.estimates, meta);

    ctx.result = EstimateRunResult.completed(
      ctx.phase,
      ctx.inputsHash,
      ctx.estimates,
    );
  }
}
