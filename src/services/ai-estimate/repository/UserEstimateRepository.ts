import type { EstimateMeta, MilestoneEstimate } from "@/lib/schema/types";
import type { UserEstimateSnapshot } from "../models";

export abstract class UserEstimateRepository {
  abstract loadSnapshot(userId: string): Promise<UserEstimateSnapshot | null>;
  abstract saveEstimates(
    userId: string,
    estimates: MilestoneEstimate[],
    meta: EstimateMeta,
  ): Promise<void>;
}
