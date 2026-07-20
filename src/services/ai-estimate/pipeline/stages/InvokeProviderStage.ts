import type { EstimateProvider } from "../../providers/EstimateProvider";
import type { EstimateContext } from "../../EstimateContext";
import { EstimateRunResult } from "../../models";
import { PipelineStage } from "../PipelineStage";

export class InvokeProviderStage extends PipelineStage {
  readonly name = "InvokeProvider";

  constructor(private readonly provider: EstimateProvider) {
    super();
  }

  async execute(ctx: EstimateContext): Promise<void> {
    if (!ctx.prompt) {
      ctx.abort("Prompt missing.", EstimateRunResult.failed("Prompt missing."));
      return;
    }

    let lastError: unknown;
    const attempts = Math.max(1, ctx.config.maxRetries + 1);

    for (let i = 0; i < attempts; i++) {
      try {
        ctx.estimates = await this.provider.estimate(ctx.prompt);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : "Provider failed.";
    ctx.abort(message, EstimateRunResult.failed(message));
  }
}
