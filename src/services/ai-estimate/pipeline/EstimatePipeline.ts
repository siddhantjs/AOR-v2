import type { EstimateContext } from "../EstimateContext";
import { PipelineStage } from "./PipelineStage";

export class EstimatePipeline {
  constructor(private readonly stages: PipelineStage[]) {}

  async run(ctx: EstimateContext): Promise<EstimateContext> {
    for (const stage of this.stages) {
      if (ctx.aborted) break;
      await stage.execute(ctx);
    }
    return ctx;
  }
}
