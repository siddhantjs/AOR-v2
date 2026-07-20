import { randomUUID } from "crypto";
import { EstimateConfig } from "./EstimateConfig";
import { EstimateContext } from "./EstimateContext";
import { EstimatePipelineFactory } from "./EstimatePipelineFactory";
import { EstimatePipeline } from "./pipeline/EstimatePipeline";
import { EstimateRunResult, UserEstimateSnapshot } from "./models";
import type { EstimateProvider } from "./providers/EstimateProvider";
import { EstimateProviderFactory } from "./providers/EstimateProviderFactory";
import type { UserEstimateRepository } from "./repository/UserEstimateRepository";
import { MongooseUserEstimateRepository } from "./repository/MongooseUserEstimateRepository";
import { EstimateJob } from "./queue/EstimateJob";
import type { EstimateQueue } from "./queue/EstimateQueue";
import { InMemoryEstimateQueue } from "./queue/InMemoryEstimateQueue";

/**
 * Facade for SCHEMA_V3 AI estimation.
 * Patterns: Facade + Singleton + Strategy (provider) + Pipeline + Queue.
 */
export class AiEstimateService {
  private static instance: AiEstimateService | null = null;

  private readonly config: EstimateConfig;
  private readonly pipeline: EstimatePipeline;
  private readonly repo: UserEstimateRepository;
  private readonly queue: EstimateQueue;

  private constructor(
    config: EstimateConfig,
    pipeline: EstimatePipeline,
    repo: UserEstimateRepository,
    queue: EstimateQueue,
  ) {
    this.config = config;
    this.pipeline = pipeline;
    this.repo = repo;
    this.queue = queue;
  }

  static getInstance(): AiEstimateService {
    if (!AiEstimateService.instance) {
      AiEstimateService.instance = AiEstimateService.createDefault();
    }
    return AiEstimateService.instance;
  }

  static resetInstance(): void {
    AiEstimateService.instance = null;
  }

  static createDefault(
    provider?: EstimateProvider,
    repo: UserEstimateRepository = new MongooseUserEstimateRepository(),
  ): AiEstimateService {
    const config = EstimatePipelineFactory.createConfig();
    const resolved = provider ?? EstimateProviderFactory.create(config);
    const pipeline = EstimatePipelineFactory.create(resolved, repo, config);

    let service!: AiEstimateService;
    const queue = new InMemoryEstimateQueue(async (job) => {
      await service.executeJob(job);
    });
    service = new AiEstimateService(config, pipeline, repo, queue);
    return service;
  }

  async enqueueForUser(userId: string): Promise<string> {
    const job = new EstimateJob(randomUUID(), userId, null);
    return this.queue.enqueue(job);
  }

  async enqueueSnapshot(snapshot: UserEstimateSnapshot): Promise<string> {
    const job = new EstimateJob(randomUUID(), snapshot.userId, snapshot);
    return this.queue.enqueue(job);
  }

  async processSnapshot(snapshot: UserEstimateSnapshot): Promise<EstimateRunResult> {
    return this.executePipeline(snapshot);
  }

  async processUser(userId: string): Promise<EstimateRunResult> {
    const snapshot = await this.repo.loadSnapshot(userId);
    if (!snapshot) {
      return EstimateRunResult.failed(`User not found: ${userId}`);
    }
    return this.executePipeline(snapshot);
  }

  queueSize(): number {
    return this.queue.size();
  }

  async executeJob(job: EstimateJob): Promise<void> {
    job.status = "running";
    job.startedAt = new Date();
    try {
      const snapshot =
        job.snapshot ?? (await this.repo.loadSnapshot(job.userId));
      if (!snapshot) {
        job.status = "failed";
        job.error = `User not found: ${job.userId}`;
        job.result = EstimateRunResult.failed(job.error);
        return;
      }
      job.result = await this.executePipeline(snapshot);
      job.status = job.result.status === "failed" ? "failed" : "completed";
      job.error = job.result.reason;
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Unknown error";
      job.result = EstimateRunResult.failed(job.error);
    } finally {
      job.finishedAt = new Date();
    }
  }

  private async executePipeline(
    snapshot: UserEstimateSnapshot,
  ): Promise<EstimateRunResult> {
    const ctx = new EstimateContext(snapshot, this.config);
    await this.pipeline.run(ctx);

    if (ctx.result) return ctx.result;
    if (ctx.aborted) {
      return EstimateRunResult.failed(ctx.abortReason ?? "Aborted");
    }
    return EstimateRunResult.failed("Pipeline finished without a result.");
  }
}
