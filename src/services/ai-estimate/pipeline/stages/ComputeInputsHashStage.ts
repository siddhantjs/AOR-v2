import { InputsHashBuilder } from "../../InputsHashBuilder";
import type { EstimateContext } from "../../EstimateContext";
import { PipelineStage } from "../PipelineStage";

export class ComputeInputsHashStage extends PipelineStage {
  readonly name = "ComputeInputsHash";

  constructor(private readonly hasher = new InputsHashBuilder()) {
    super();
  }

  async execute(ctx: EstimateContext): Promise<void> {
    if (!ctx.phase) {
      ctx.abort("Phase was not resolved.");
      return;
    }
    ctx.inputsHash = this.hasher.build(ctx.snapshot, ctx.phase);
  }
}
