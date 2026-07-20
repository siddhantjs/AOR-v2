import { createHash } from "crypto";
import type { EstimatePhase } from "@/lib/schema/types";
import type { UserEstimateSnapshot } from "./models";

/** Builds SCHEMA_V3 inputsHash for estimate caching. */
export class InputsHashBuilder {
  build(snapshot: UserEstimateSnapshot, phase: EstimatePhase): string {
    const logged = snapshot.milestones
      .filter((m) => m.milestoneDate)
      .map((m) => `${m.milestoneId}:${m.milestoneDate}`)
      .sort()
      .join("|");

    const parts = [
      phase,
      this.isoDate(snapshot.itaDate),
      this.isoDate(snapshot.aorDate),
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

  private isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
