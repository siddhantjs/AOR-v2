import { connectDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import { estimatesFromProfile } from "@/lib/estimateFormat";
import { buildDashboardView, type DashboardView } from "@/lib/dashboardView";
import { emptyMilestonesFormState, type MilestonesFormState } from "@/lib/milestonesForm";
import {
  MILESTONES,
  type ApplyingFrom,
  type DrawCategory,
  type ExpressEntryProgram,
  type MilestoneId,
  type Pathway,
  type VisaOffice,
} from "@/lib/schema/constants";
import type { MilestoneEstimate, User } from "@/lib/schema/types";
import { UserModel } from "@/models/User";

/** Application fields needed to edit milestones (avoid importing client cards). */
export type EditApplicationSnapshot = {
  applyingFrom: ApplyingFrom;
  pathway: Pathway;
  expressEntryProgram: ExpressEntryProgram | null;
  drawCategory: DrawCategory;
  itaDate: string;
  aorDate: string;
  username: string;
  email: string;
};

export async function loadDashboardView(userId: string): Promise<DashboardView | null> {
  const doc = await loadUserLean(userId);
  if (!doc) return null;
  return buildDashboardView(doc);
}

export type EditMilestonesData = {
  userId: string;
  application: EditApplicationSnapshot;
  initialState: MilestonesFormState;
  estimates: MilestoneEstimate[];
};

export async function loadEditMilestonesData(userId: string): Promise<EditMilestonesData | null> {
  const doc = await loadUserLean(userId);
  if (!doc) return null;

  const milestones = emptyMilestonesFormState().milestones;
  for (const m of MILESTONES) {
    const row = doc.milestones?.find((x) => x.milestoneId === m.id);
    const date = row?.milestoneDate ?? "";
    milestones[m.id as MilestoneId] = {
      done: Boolean(date),
      date: date || "",
    };
  }

  const primary = (doc.primaryVisaOffice ?? "") as VisaOffice | "";
  const secondary = (doc.secondaryVisaOffice ?? "") as VisaOffice | "";

  return {
    userId: String(doc._id),
    application: {
      applyingFrom: doc.applyingFrom,
      pathway: doc.pathway,
      expressEntryProgram: doc.expressEntryProgram,
      drawCategory: doc.drawCategory,
      itaDate: toIsoDate(new Date(doc.itaDate)),
      aorDate: toIsoDate(new Date(doc.aorDate)),
      username: doc.username ?? "",
      email: doc.email,
    },
    initialState: {
      milestones,
      primaryVisaOffice: primary,
      secondaryVisaOffice: secondary,
    },
    estimates: estimatesFromProfile(doc.milestones ?? []),
  };
}

async function loadUserLean(userId: string): Promise<User | null> {
  if (!/^[a-f\d]{24}$/i.test(userId)) return null;
  await connectDb();
  const doc = await UserModel.findById(userId).lean();
  if (!doc) return null;
  return doc as unknown as User;
}
