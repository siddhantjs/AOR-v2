import { createHash } from "crypto";
import { ESTIMATE_BUCKETS, MILESTONES } from "@/lib/schema/constants";
import type {
  EstimateBucket,
  EstimateMeta,
  EstimatePhase,
  MilestoneEstimate,
} from "@/lib/schema/types";
import { EstimateConfig } from "./EstimateConfig";
import { GeminiClient } from "./GeminiClient";
import {
  EstimatePromptPayload,
  EstimateRunResult,
  UserEstimateSnapshot,
} from "./models";
import { UserEstimateStore } from "./UserEstimateStore";

/**
 * SCHEMA_V3 AI estimates — single linear flow:
 * load → phase → hash (skip if unchanged) → Gemini → validate → save
 */
export class AiEstimateService {
  private static instance: AiEstimateService | null = null;

  private readonly config: EstimateConfig;
  private readonly store: UserEstimateStore;
  private readonly gemini: GeminiClient;

  private constructor() {
    this.config = new EstimateConfig();
    this.store = new UserEstimateStore();
    this.gemini = new GeminiClient(this.config);
  }

  static getInstance(): AiEstimateService {
    if (!AiEstimateService.instance) {
      AiEstimateService.instance = new AiEstimateService();
    }
    return AiEstimateService.instance;
  }

  static resetInstance(): void {
    AiEstimateService.instance = null;
  }

  async run(userId: string): Promise<EstimateRunResult> {
    const snapshot = await this.store.load(userId);
    if (!snapshot) return EstimateRunResult.failed(`User not found: ${userId}`);
    return this.runSnapshot(snapshot);
  }

  async runSnapshot(snapshot: UserEstimateSnapshot): Promise<EstimateRunResult> {
    if (
      Number.isNaN(snapshot.itaDate.getTime()) ||
      Number.isNaN(snapshot.aorDate.getTime())
    ) {
      return EstimateRunResult.failed("ITA and AOR are required.");
    }

    const phase: EstimatePhase = snapshot.hasOffices()
      ? "with-offices"
      : "aor-only";
    const inputsHash = this.hash(snapshot, phase);

    if (snapshot.estimateMeta?.inputsHash === inputsHash) {
      return EstimateRunResult.skipped("inputsHash unchanged", inputsHash);
    }

    const prompt = this.buildPrompt(snapshot, phase);

    let estimates: MilestoneEstimate[] = [];
    let lastError: unknown;
    const attempts = Math.max(1, this.config.maxRetries + 1);

    for (let i = 0; i < attempts; i++) {
      try {
        estimates = this.validate(await this.gemini.estimate(prompt), snapshot);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) {
      const msg = lastError instanceof Error ? lastError.message : "Gemini failed.";
      return EstimateRunResult.failed(msg);
    }

    if (estimates.length === 0) {
      return EstimateRunResult.failed("No valid estimates returned.");
    }

    const meta: EstimateMeta = {
      generatedAt: new Date(),
      model: this.config.model,
      promptVersion: this.config.promptVersion,
      phase,
      inputsHash,
    };

    await this.store.save(snapshot.userId, estimates, meta);
    return EstimateRunResult.completed(phase, inputsHash, estimates);
  }

  private buildPrompt(
    snapshot: UserEstimateSnapshot,
    phase: EstimatePhase,
  ): EstimatePromptPayload {
    const logged = snapshot.milestones
      .filter((m) => m.milestoneDate)
      .map((m) => ({
        milestoneId: m.milestoneId,
        milestoneDate: m.milestoneDate as string,
      }));

    return new EstimatePromptPayload(
      phase,
      snapshot.applyingFrom,
      snapshot.pathway,
      snapshot.expressEntryProgram,
      snapshot.drawCategory,
      snapshot.itaDate.toISOString().slice(0, 10),
      snapshot.aorDate.toISOString().slice(0, 10),
      phase === "with-offices" ? snapshot.primaryVisaOffice : null,
      phase === "with-offices" ? snapshot.secondaryVisaOffice : null,
      logged,
    );
  }

  private hash(snapshot: UserEstimateSnapshot, phase: EstimatePhase): string {
    const logged = snapshot.milestones
      .filter((m) => m.milestoneDate)
      .map((m) => `${m.milestoneId}:${m.milestoneDate}`)
      .sort()
      .join("|");

    const parts = [
      phase,
      snapshot.itaDate.toISOString().slice(0, 10),
      snapshot.aorDate.toISOString().slice(0, 10),
      snapshot.applyingFrom,
      snapshot.pathway,
      snapshot.expressEntryProgram ?? "",
      snapshot.drawCategory,
      snapshot.primaryVisaOffice ?? "",
      snapshot.secondaryVisaOffice ?? "",
      logged,
    ];

    return createHash("sha256").update(parts.join("\n")).digest("hex");
  }

  private validate(
    rows: MilestoneEstimate[],
    snapshot: UserEstimateSnapshot,
  ): MilestoneEstimate[] {
    const estimable = new Set(MILESTONES.filter((m) => m.est).map((m) => m.id));
    const logged = new Set(
      snapshot.milestones.filter((m) => m.milestoneDate).map((m) => m.milestoneId),
    );
    const seen = new Set<string>();
    const out: MilestoneEstimate[] = [];

    for (const row of rows) {
      if (row.milestoneId === "bio_done") continue;
      if (!estimable.has(row.milestoneId) || logged.has(row.milestoneId)) continue;
      if (seen.has(row.milestoneId)) continue;
      if (!this.isBucket(row.estimatedFrom) || !this.isBucket(row.estimatedTo)) {
        continue;
      }
      if (
        !Number.isFinite(row.estimatedYearFrom) ||
        !Number.isFinite(row.estimatedYearTo)
      ) {
        continue;
      }
      seen.add(row.milestoneId);
      out.push(row);
    }

    return out;
  }

  private isBucket(value: string): value is EstimateBucket {
    return (ESTIMATE_BUCKETS as readonly string[]).includes(value);
  }
}
