import { connectDb } from "@/lib/db";
import { buildCohortKey, aorMonthFromIso } from "@/lib/cohort";
import {
  cohortDisplayName,
  toCohortApplicant,
  type CohortApplicantView,
  type CohortOption,
} from "@/lib/cohortBrowse";
import { toIsoDate } from "@/lib/dates";
import type { User } from "@/lib/schema/types";
import { CohortModel } from "@/models/Cohort";
import { UserModel } from "@/models/User";

export type CohortPageData = {
  userId: string;
  activeCohortKey: string;
  isYours: boolean;
  title: string;
  eyebrow: string;
  countLabel: string;
  options: CohortOption[];
  applicants: CohortApplicantView[];
};

export async function loadCohortPageData(
  userId: string,
  cohortKeyParam?: string | null,
): Promise<CohortPageData | null> {
  if (!/^[a-f\d]{24}$/i.test(userId)) return null;
  await connectDb();

  const me = await UserModel.findById(userId).lean();
  if (!me) return null;

  const myKey = buildCohortKey(
    aorMonthFromIso(toIsoDate(new Date(me.aorDate))),
    me.applyingFrom,
  );

  const activeKey =
    cohortKeyParam && /^\d{4}-\d{2}\|(inland|outland)$/.test(cohortKeyParam)
      ? cohortKeyParam
      : myKey;

  const [allCohorts, members] = await Promise.all([
    CohortModel.find({}).sort({ aorMonth: -1, applyingFrom: 1 }).lean(),
    findCohortMembers(activeKey),
  ]);

  const byId = new Map(members.map((u) => [String(u._id), u]));
  if (!byId.has(userId) && activeKey === myKey) {
    byId.set(userId, me);
  }

  const applicants = [...byId.values()]
    .map((u) => toCohortApplicant(u as unknown as User, userId))
    .sort((a, b) => {
      if (a.isYou !== b.isYou) return a.isYou ? -1 : 1;
      return a.aorIso.localeCompare(b.aorIso);
    });

  const isYours = activeKey === myKey;
  const total = applicants.length;

  const options: CohortOption[] = allCohorts.map((c) => ({
    cohortKey: c.cohortKey,
    label: `${cohortDisplayName(c.cohortKey)}${c.cohortKey === myKey ? " (yours)" : ""}`,
    isYours: c.cohortKey === myKey,
  }));

  if (!options.some((o) => o.cohortKey === activeKey)) {
    options.unshift({
      cohortKey: activeKey,
      label: `${cohortDisplayName(activeKey)}${isYours ? " (yours)" : ""}`,
      isYours,
    });
  }

  return {
    userId,
    activeCohortKey: activeKey,
    isYours,
    title: cohortDisplayName(activeKey),
    eyebrow: isYours ? "Your cohort" : "Cohort",
    countLabel: `${total} verified applicant${total !== 1 ? "s" : ""}${
      isYours && total > 0 ? ", including you" : ""
    }`,
    options,
    applicants,
  };
}

async function findCohortMembers(cohortKey: string) {
  const cohort = await CohortModel.findOne({ cohortKey }).select("_id").lean();
  const [ym, applyingFrom] = cohortKey.split("|") as [
    string,
    "inland" | "outland",
  ];

  const monthStart = new Date(`${ym}-01T00:00:00.000Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const or: Record<string, unknown>[] = [
    {
      applyingFrom,
      aorDate: { $gte: monthStart, $lt: monthEnd },
    },
  ];
  if (cohort) {
    or.unshift({ cohortKey: cohort._id });
  }

  return UserModel.find({ $or: or })
    .select(
      "username applyingFrom pathway expressEntryProgram drawCategory itaDate aorDate primaryVisaOffice secondaryVisaOffice milestones userDetails",
    )
    .lean();
}
