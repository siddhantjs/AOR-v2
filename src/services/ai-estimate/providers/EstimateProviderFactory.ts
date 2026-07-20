import type { EstimateConfig } from "../EstimateConfig";
import type { EstimateProvider } from "./EstimateProvider";
import { GeminiEstimateProvider } from "./GeminiEstimateProvider";
import { StubEstimateProvider } from "./StubEstimateProvider";

/** Factory: Strategy selection for estimate providers. */
export class EstimateProviderFactory {
  static create(config: EstimateConfig): EstimateProvider {
    const driver = (process.env.AI_ESTIMATE_PROVIDER ?? "gemini").trim().toLowerCase();

    if (driver === "stub") {
      return new StubEstimateProvider();
    }

    if (!config.geminiApiKey) {
      throw new Error(
        "GEMINI_API_KEY is required when AI_ESTIMATE_PROVIDER=gemini (default).",
      );
    }

    return new GeminiEstimateProvider(config);
  }
}
