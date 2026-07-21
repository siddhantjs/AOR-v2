import type {
  ApplyingFrom,
  Country,
  DrawCategory,
  EstimateBucket,
  EstimatePhase,
  ExpressEntryProgram,
  MaritalStatus,
  MedicalType,
  MilestoneId,
  Pathway,
  SpouseStatus,
  VisaOffice,
} from "./constants";

export type {
  ApplyingFrom,
  Country,
  DrawCategory,
  EstimateBucket,
  EstimatePhase,
  ExpressEntryProgram,
  MaritalStatus,
  MedicalType,
  MilestoneId,
  Pathway,
  SpouseStatus,
  VisaOffice,
};

export interface ProfileMilestone {
  milestoneId: MilestoneId;
  /** Real logged date (ISO YYYY-MM-DD). */
  milestoneDate: string | null;
  estimatedFrom: EstimateBucket | null;
  estimatedTo: EstimateBucket | null;
  estimatedYearFrom: number | null;
  estimatedYearTo: number | null;
}

export interface UserDetails {
  crsScore: number | null;
  maritalStatus: MaritalStatus | null;
  spouseStatus: SpouseStatus | null;
  nationality: Country | null;
  foreignWork: boolean | null;
  foreignWorkYears: number | null;
  canadianWork: boolean | null;
  canadianWorkYears: number | null;
  dependants: number | null;
  countryOfResidence: Country | null;
  medicalType: MedicalType | null;
}

export interface EstimateMeta {
  generatedAt: Date;
  model: string;
  promptVersion: string;
  phase: EstimatePhase;
  /** Hash of ITA/AOR/offices/pathway/logged milestone dates. */
  inputsHash: string;
}

export interface User {
  _id: string;

  username: string | null;
  email: string;
  emailNorm: string;
  caseNo: string | null;
  shareToken: string | null;
  seededData: boolean;

  applyingFrom: ApplyingFrom;
  pathway: Pathway;
  expressEntryProgram: ExpressEntryProgram | null;
  drawCategory: DrawCategory;
  itaDate: Date;
  aorDate: Date;
  primaryVisaOffice: VisaOffice | null;
  secondaryVisaOffice: VisaOffice | null;

  milestones: ProfileMilestone[];
  /** Always ObjectId → Cohort._id */
  cohortKey: string;
  currentStatus: string | null;

  estimateMeta: EstimateMeta | null;
  userDetails: UserDetails;
  purity: number | null;

  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
}

export type StageDistribution = Partial<Record<MilestoneId, number>>;

export interface Cohort {
  _id: string;
  /** Unique — "{YYYY-MM}|{inland|outland}" */
  cohortKey: string;
  aorMonth: string;
  applyingFrom: ApplyingFrom;

  nApplicants: number;
  nCompleted: number;
  nWaiting: number;

  dominantStage: MilestoneId | null;
  stageDistribution: StageDistribution;

  lastUpdated: Date;
}

/** AI estimate output for one pending estimable milestone. */
export interface MilestoneEstimate {
  milestoneId: MilestoneId;
  estimatedFrom: EstimateBucket;
  estimatedTo: EstimateBucket;
  estimatedYearFrom: number;
  estimatedYearTo: number;
}
