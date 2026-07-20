import { connectDb } from "@/lib/db";
import type {
  EstimateMeta,
  MilestoneEstimate,
  ProfileMilestone,
} from "@/lib/schema/types";
import { UserModel } from "@/models/User";
import { UserEstimateSnapshot } from "./models";

/** Load / save estimate fields on the User document. */
export class UserEstimateStore {
  async load(userId: string): Promise<UserEstimateSnapshot | null> {
    await connectDb();
    if (!/^[a-f\d]{24}$/i.test(userId)) return null;

    const doc = await UserModel.findById(userId).lean();
    if (!doc) return null;

    const meta = doc.estimateMeta
      ? {
          generatedAt: new Date(doc.estimateMeta.generatedAt),
          model: doc.estimateMeta.model,
          promptVersion: doc.estimateMeta.promptVersion,
          phase: doc.estimateMeta.phase,
          inputsHash: doc.estimateMeta.inputsHash,
        }
      : null;

    return new UserEstimateSnapshot(
      String(doc._id),
      doc.applyingFrom,
      doc.pathway,
      doc.expressEntryProgram,
      doc.drawCategory,
      new Date(doc.itaDate),
      new Date(doc.aorDate),
      doc.primaryVisaOffice,
      doc.secondaryVisaOffice,
      (doc.milestones ?? []) as ProfileMilestone[],
      meta,
    );
  }

  async save(
    userId: string,
    estimates: MilestoneEstimate[],
    meta: EstimateMeta,
  ): Promise<void> {
    await connectDb();
    const doc = await UserModel.findById(userId);
    if (!doc) throw new Error(`User not found: ${userId}`);

    const byId = new Map(estimates.map((e) => [e.milestoneId, e]));
    const current = (doc.milestones ?? []).map((row) => {
      const plain = {
        milestoneId: row.milestoneId,
        milestoneDate: row.milestoneDate ?? null,
        estimatedFrom: row.estimatedFrom ?? null,
        estimatedTo: row.estimatedTo ?? null,
        estimatedYearFrom: row.estimatedYearFrom ?? null,
        estimatedYearTo: row.estimatedYearTo ?? null,
      };
      const est = byId.get(plain.milestoneId as MilestoneEstimate["milestoneId"]);
      if (!est || plain.milestoneDate) return plain;
      return {
        ...plain,
        estimatedFrom: est.estimatedFrom,
        estimatedTo: est.estimatedTo,
        estimatedYearFrom: est.estimatedYearFrom,
        estimatedYearTo: est.estimatedYearTo,
      };
    });

    for (const est of estimates) {
      if (current.some((m) => m.milestoneId === est.milestoneId)) continue;
      current.push({
        milestoneId: est.milestoneId,
        milestoneDate: null,
        estimatedFrom: est.estimatedFrom,
        estimatedTo: est.estimatedTo,
        estimatedYearFrom: est.estimatedYearFrom,
        estimatedYearTo: est.estimatedYearTo,
      });
    }

    doc.set("milestones", current);
    doc.set("estimateMeta", meta);
    await doc.save();
  }
}
