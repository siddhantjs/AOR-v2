import { GoogleGenAI, Type } from "@google/genai";
import { ESTIMATE_BUCKETS, MILESTONES } from "@/lib/schema/constants";
import type { MilestoneEstimate, MilestoneId } from "@/lib/schema/types";
import type { EstimateConfig } from "./EstimateConfig";
import type { EstimatePromptPayload } from "./models";

type GeminiEstimateRow = {
  milestoneId: string;
  estimatedFrom: string;
  estimatedTo: string;
  estimatedYearFrom: number;
  estimatedYearTo: number;
};

/** Calls Gemini 2.5 Flash with SCHEMA_V3 estimate JSON schema. */
export class GeminiClient {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(config: EstimateConfig) {
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    this.model = config.model;
  }

  async estimate(prompt: EstimatePromptPayload): Promise<MilestoneEstimate[]> {
    const pending = this.pendingMilestones(prompt);
    if (pending.length === 0) return [];

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: this.buildPrompt(prompt, pending),
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  milestoneId: { type: Type.STRING },
                  estimatedFrom: { type: Type.STRING },
                  estimatedTo: { type: Type.STRING },
                  estimatedYearFrom: { type: Type.NUMBER },
                  estimatedYearTo: { type: Type.NUMBER },
                },
                required: [
                  "milestoneId",
                  "estimatedFrom",
                  "estimatedTo",
                  "estimatedYearFrom",
                  "estimatedYearTo",
                ],
              },
            },
          },
          required: ["estimates"],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty response.");

    const parsed = JSON.parse(text) as { estimates?: GeminiEstimateRow[] };
    if (!Array.isArray(parsed.estimates)) {
      throw new Error("Gemini response missing estimates array.");
    }

    return parsed.estimates.map((row) => ({
      milestoneId: row.milestoneId as MilestoneId,
      estimatedFrom: row.estimatedFrom as MilestoneEstimate["estimatedFrom"],
      estimatedTo: row.estimatedTo as MilestoneEstimate["estimatedTo"],
      estimatedYearFrom: row.estimatedYearFrom,
      estimatedYearTo: row.estimatedYearTo,
    }));
  }

  private pendingMilestones(prompt: EstimatePromptPayload) {
    const logged = new Set(prompt.loggedMilestones.map((m) => m.milestoneId));
    return MILESTONES.filter((m) => m.est && !logged.has(m.id)).map((m) => ({
      id: m.id,
      label: m.label,
      desc: m.desc,
    }));
  }

  private buildPrompt(
    prompt: EstimatePromptPayload,
    pending: ReadonlyArray<{ id: string; label: string; desc: string }>,
  ): string {
    const offices =
      prompt.phase === "with-offices"
        ? {
            primaryVisaOffice: prompt.primaryVisaOffice,
            secondaryVisaOffice: prompt.secondaryVisaOffice,
          }
        : undefined;

    return [
      "You estimate Canadian PR (permanent residence) milestone timing windows.",
      "Return ONLY the JSON object matching the schema. No markdown.",
      "",
      "Rules:",
      "- Estimate only the pending milestones listed below.",
      "- Never estimate bio_done.",
      "- estimatedFrom / estimatedTo must be buckets like early-september, mid-october, late-january.",
      `- Allowed buckets: ${ESTIMATE_BUCKETS.join(", ")}.`,
      "- estimatedFrom should be on or before estimatedTo in calendar order (use years when the window crosses year boundaries).",
      "- Windows should be realistic relative to AOR and already-logged milestone dates.",
      "- Later milestones should generally fall after earlier ones.",
      "",
      `Phase: ${prompt.phase}`,
      `Application context: ${JSON.stringify(
        {
          itaDate: prompt.itaDate,
          aorDate: prompt.aorDate,
          applyingFrom: prompt.applyingFrom,
          pathway: prompt.pathway,
          expressEntryProgram: prompt.expressEntryProgram,
          drawCategory: prompt.drawCategory,
          ...offices,
          loggedMilestones: prompt.loggedMilestones,
          pendingMilestones: pending,
        },
        null,
        2,
      )}`,
    ].join("\n");
  }
}
