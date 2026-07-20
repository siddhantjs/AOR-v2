import type { EstimateJob } from "./EstimateJob";
import { EstimateQueue } from "./EstimateQueue";

export type EstimateJobHandler = (job: EstimateJob) => Promise<void>;

/**
 * In-process FIFO queue (Producer–Consumer).
 * Suitable for single-node burst work. Swap for Redis later via EstimateQueue.
 */
export class InMemoryEstimateQueue extends EstimateQueue {
  private readonly pending: EstimateJob[] = [];
  private pumping = false;

  constructor(private readonly handler: EstimateJobHandler) {
    super();
  }

  async enqueue(job: EstimateJob): Promise<string> {
    this.pending.push(job);
    void this.pump();
    return job.id;
  }

  size(): number {
    return this.pending.length;
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;

    try {
      while (this.pending.length > 0) {
        const job = this.pending.shift();
        if (!job) break;
        await this.handler(job);
      }
    } finally {
      this.pumping = false;
      if (this.pending.length > 0) void this.pump();
    }
  }
}
