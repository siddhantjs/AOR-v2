import { ESTIMATE_BUCKETS, ESTIMATE_MONTHS, MILESTONES } from "@/lib/schema/constants";
import type { EstimateBucket, MilestoneEstimate } from "@/lib/schema/types";
import type { EstimatePromptPayload } from "../models";
import { EstimateProvider } from "./EstimateProvider";

/**
 * Deterministic stub provider for local/dev until real AI wiring lands.
 * Offsets pending estimable milestones from AOR by fixed month steps.
 */
export class StubEstimateProvider extends EstimateProvider {
  readonly name = "stub";

  async estimate(prompt: EstimatePromptPayload): Promise<MilestoneEstimate[]> {
    const aor = this.parseIso(prompt.aorDate);
    const logged = new Set(prompt.loggedMilestones.map((m) => m.milestoneId));
    const officeBoost = prompt.phase === "with-offices" ? 0 : 1;

    const out: MilestoneEstimate[] = [];
    let step = 2 + officeBoost;

    for (const m of MILESTONES) {
      if (!m.est || logged.has(m.id)) continue;

      const from = this.addMonths(aor, step);
      const to = this.addMonths(aor, step + 1);
      out.push({
        milestoneId: m.id,
        estimatedFrom: this.toBucket(from, "early"),
        estimatedTo: this.toBucket(to, "mid"),
        estimatedYearFrom: from.getFullYear(),
        estimatedYearTo: to.getFullYear(),
      });
      step += "sub" in m && m.sub ? 0 : 1;
    }

    return out;
  }

  private parseIso(iso: string): Date {
    const y = Number(iso.slice(0, 4));
    const m = Number(iso.slice(5, 7)) - 1;
    const d = Number(iso.slice(8, 10));
    return new Date(y, m, d);
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private toBucket(date: Date, part: "early" | "mid" | "late"): EstimateBucket {
    const month = ESTIMATE_MONTHS[date.getMonth()];
    const bucket = `${part}-${month}` as EstimateBucket;
    if (!ESTIMATE_BUCKETS.includes(bucket)) {
      return `mid-${month}` as EstimateBucket;
    }
    return bucket;
  }
}
