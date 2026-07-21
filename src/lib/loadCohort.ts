import type { CohortApplicantView, CohortOption } from "@/lib/cohortBrowse";

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

export type AllCohortCard = {
  cohortKey: string;
  title: string;
  isYours: boolean;
  total: number;
  countLabel: string;
  stageLabel: string;
  stageBg: string;
  stageFg: string;
  empty: boolean;
};

export type AllCohortsPageData = {
  userId: string;
  myCohortKey: string;
  cards: AllCohortCard[];
};
