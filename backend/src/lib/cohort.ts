import { CohortModel } from "@/models/Cohort";
import type { ApplyingFrom } from "@/lib/schema/constants";

/** SCHEMA_V3: "{YYYY-MM}|{inland|outland}" from AOR month + residence. */
export function buildCohortKey(aorMonth: string, applyingFrom: ApplyingFrom): string {
  return `${aorMonth}|${applyingFrom}`;
}

export function aorMonthFromIso(aorDateIso: string): string {
  return aorDateIso.slice(0, 7);
}

/**
 * Find or create the cohort for this AOR month + inland/outland,
 * then bump applicant counts for a newly created live user.
 */
export async function findOrCreateCohortForUser(
  aorDateIso: string,
  applyingFrom: ApplyingFrom,
): Promise<{ _id: import("mongoose").Types.ObjectId; cohortKey: string }> {
  const aorMonth = aorMonthFromIso(aorDateIso);
  const cohortKey = buildCohortKey(aorMonth, applyingFrom);

  let cohort = await CohortModel.findOne({ cohortKey });
  if (!cohort) {
    cohort = await CohortModel.create({
      cohortKey,
      aorMonth,
      applyingFrom,
      nApplicants: 0,
      nCompleted: 0,
      nWaiting: 0,
      lastUpdated: new Date(),
    });
  }

  await CohortModel.updateOne(
    { _id: cohort._id },
    {
      $inc: { nApplicants: 1, nWaiting: 1 },
      $set: { lastUpdated: new Date() },
    },
  );

  return { _id: cohort._id, cohortKey };
}
