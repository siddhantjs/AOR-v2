import type { EstimatePromptPayload } from "../models";
import type { MilestoneEstimate } from "@/lib/schema/types";

/** Strategy contract (abstract class — class-only service layer). */
export abstract class EstimateProvider {
  abstract readonly name: string;
  abstract estimate(prompt: EstimatePromptPayload): Promise<MilestoneEstimate[]>;
}
