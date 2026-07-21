export class EstimateConfig {
  readonly model: string;
  readonly promptVersion: string;
  readonly maxRetries: number;
  readonly geminiApiKey: string;

  constructor() {
    this.model = process.env.AI_ESTIMATE_MODEL?.trim() || "gemini-2.5-flash";
    this.promptVersion = process.env.AI_ESTIMATE_PROMPT_VERSION?.trim() || "v1";
    this.maxRetries = Number(process.env.AI_ESTIMATE_MAX_RETRIES ?? "2") || 2;
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    this.geminiApiKey = key;
  }
}
