import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  APPLYING_FROM,
  DRAW_CATEGORIES,
  ESTIMATE_BUCKETS,
  ESTIMATE_PHASES,
  EXPRESS_ENTRY_PROGRAMS,
  MARITAL_STATUSES,
  MEDICAL_TYPES,
  MILESTONE_IDS,
  OFFICE_LIST,
  PATHWAYS,
  SPOUSE_STATUSES,
} from "@/lib/schema/constants";
import type { User } from "@/lib/schema/types";

const drawCategoryValues = DRAW_CATEGORIES.map((c) => c.value);

const ProfileMilestoneSchema = new Schema(
  {
    milestoneId: {
      type: String,
      enum: MILESTONE_IDS,
      required: true,
    },
    milestoneDate: { type: String, default: null },
    estimatedFrom: {
      type: String,
      enum: [...ESTIMATE_BUCKETS, null],
      default: null,
    },
    estimatedTo: {
      type: String,
      enum: [...ESTIMATE_BUCKETS, null],
      default: null,
    },
    estimatedYearFrom: { type: Number, default: null },
    estimatedYearTo: { type: Number, default: null },
  },
  { _id: false },
);

const UserDetailsSchema = new Schema(
  {
    crsScore: { type: Number, default: null },
    maritalStatus: {
      type: String,
      enum: [...MARITAL_STATUSES, null],
      default: null,
    },
    spouseStatus: {
      type: String,
      enum: [...SPOUSE_STATUSES, null],
      default: null,
    },
    nationality: { type: String, default: null },
    foreignWork: { type: Boolean, default: null },
    foreignWorkYears: { type: Number, default: null },
    canadianWork: { type: Boolean, default: null },
    canadianWorkYears: { type: Number, default: null },
    dependants: { type: Number, default: null },
    countryOfResidence: { type: String, default: null },
    medicalType: {
      type: String,
      enum: [...MEDICAL_TYPES, null],
      default: null,
    },
  },
  { _id: false },
);

const EstimateMetaSchema = new Schema(
  {
    generatedAt: { type: Date, required: true },
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    phase: { type: String, enum: ESTIMATE_PHASES, required: true },
    inputsHash: { type: String, required: true },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    username: { type: String, default: null },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
    },
    emailNorm: { type: String, required: true, unique: true },
    /** Tracker Case # — omit for live users so sparse unique index skips them. */
    caseNo: { type: String },
    shareToken: { type: String, default: null },
    seededData: { type: Boolean, required: true, default: false },

    applyingFrom: { type: String, enum: APPLYING_FROM, required: true },
    pathway: { type: String, enum: PATHWAYS, required: true },
    expressEntryProgram: {
      type: String,
      enum: [...EXPRESS_ENTRY_PROGRAMS, null],
      default: null,
    },
    drawCategory: {
      type: String,
      enum: drawCategoryValues,
      required: true,
    },
    itaDate: { type: Date, required: true },
    aorDate: { type: Date, required: true },
    primaryVisaOffice: {
      type: String,
      enum: [...OFFICE_LIST, null],
      default: null,
    },
    secondaryVisaOffice: {
      type: String,
      enum: [...OFFICE_LIST, null],
      default: null,
    },

    milestones: { type: [ProfileMilestoneSchema], default: [] },
    cohortKey: {
      type: Schema.Types.ObjectId,
      ref: "Cohort",
      required: true,
      index: true,
    },
    currentStatus: { type: String, default: null },

    estimateMeta: { type: EstimateMetaSchema, default: null },
    userDetails: { type: UserDetailsSchema, default: () => ({}) },
    purity: { type: Number, default: null },

    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ caseNo: 1 }, { unique: true, sparse: true });
UserSchema.index({ shareToken: 1 }, { unique: true, sparse: true });
UserSchema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: {
      seededData: false,
      username: { $type: "string" },
    },
  },
);
UserSchema.index({ applyingFrom: 1 });

UserSchema.pre("validate", function () {
  if (this.email) {
    this.emailNorm = this.email.trim().toLowerCase();
  }
  // Sparse unique index indexes null; leave the field unset for live users.
  if (this.caseNo == null || this.caseNo === "") {
    this.caseNo = undefined;
  }
});

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User> | undefined) ?? mongoose.model<User>("User", UserSchema);
