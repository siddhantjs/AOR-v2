import type { MilestonesFormState } from "@/lib/milestonesForm";
import type {
  ApplyingFrom,
  DrawCategory,
  ExpressEntryProgram,
  Pathway,
} from "@/lib/schema/constants";
import type { MilestoneEstimate } from "@/lib/schema/types";

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

export type EditMilestonesData = {
  userId: string;
  application: EditApplicationSnapshot;
  initialState: MilestonesFormState;
  estimates: MilestoneEstimate[];
};
