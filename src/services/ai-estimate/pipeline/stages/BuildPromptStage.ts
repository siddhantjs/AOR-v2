import { EstimatePromptPayload } from "../../models";
import type { EstimateContext } from "../../EstimateContext";
import { PipelineStage } from "../PipelineStage";

export class BuildPromptStage extends PipelineStage {
  readonly name = "BuildPrompt";

  async execute(ctx: EstimateContext): Promise<void> {
    if (!ctx.phase) {
      ctx.abort("Phase missing for prompt build.");
      return;
    }

    const s = ctx.snapshot;
    const logged = s.milestones
      .filter((m) => m.milestoneDate)
      .map((m) => ({
        milestoneId: m.milestoneId,
        milestoneDate: m.milestoneDate as string,
      }));

    ctx.prompt = new EstimatePromptPayload(
      ctx.phase,
      s.applyingFrom,
      s.pathway,
      s.expressEntryProgram,
      s.drawCategory,
      s.itaDate.toISOString().slice(0, 10),
      s.aorDate.toISOString().slice(0, 10),
      ctx.phase === "with-offices" ? s.primaryVisaOffice : null,
      ctx.phase === "with-offices" ? s.secondaryVisaOffice : null,
      logged,
    );
  }
}
