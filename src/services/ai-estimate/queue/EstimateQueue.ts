import type { EstimateJob } from "./EstimateJob";

export abstract class EstimateQueue {
  abstract enqueue(job: EstimateJob): Promise<string>;
  abstract size(): number;
}
