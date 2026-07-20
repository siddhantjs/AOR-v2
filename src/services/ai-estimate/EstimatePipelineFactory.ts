import { EstimateConfig } from "./EstimateConfig";
import { EstimatePipeline } from "./pipeline/EstimatePipeline";
import { BuildPromptStage } from "./pipeline/stages/BuildPromptStage";
import { ComputeInputsHashStage } from "./pipeline/stages/ComputeInputsHashStage";
import { GuardUnchangedStage } from "./pipeline/stages/GuardUnchangedStage";
import { InvokeProviderStage } from "./pipeline/stages/InvokeProviderStage";
import { PersistEstimatesStage } from "./pipeline/stages/PersistEstimatesStage";
import { ResolvePhaseStage } from "./pipeline/stages/ResolvePhaseStage";
import { ValidateEstimatesStage } from "./pipeline/stages/ValidateEstimatesStage";
import type { EstimateProvider } from "./providers/EstimateProvider";
import { EstimateProviderFactory } from "./providers/EstimateProviderFactory";
import type { UserEstimateRepository } from "./repository/UserEstimateRepository";
import { MongooseUserEstimateRepository } from "./repository/MongooseUserEstimateRepository";

/** Factory: assembles the SCHEMA_V3 estimate pipeline. */
export class EstimatePipelineFactory {
  static create(
    provider?: EstimateProvider,
    repo: UserEstimateRepository = new MongooseUserEstimateRepository(),
    config: EstimateConfig = EstimatePipelineFactory.createConfig(),
  ): EstimatePipeline {
    const resolved = provider ?? EstimateProviderFactory.create(config);
    return new EstimatePipeline([
      new ResolvePhaseStage(),
      new ComputeInputsHashStage(),
      new GuardUnchangedStage(),
      new BuildPromptStage(),
      new InvokeProviderStage(resolved),
      new ValidateEstimatesStage(),
      new PersistEstimatesStage(repo),
    ]);
  }

  static createConfig(): EstimateConfig {
    return new EstimateConfig();
  }
}
