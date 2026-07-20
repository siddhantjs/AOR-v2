import type { EstimateContext } from "../EstimateContext";

/** Pipeline stage contract (Chain of Responsibility / Pipeline). */
export abstract class PipelineStage {
  abstract readonly name: string;
  abstract execute(ctx: EstimateContext): Promise<void>;
}
