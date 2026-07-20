import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { APPLYING_FROM, MILESTONE_IDS } from "@/lib/schema/constants";
import type { Cohort } from "@/lib/schema/types";

const CohortSchema = new Schema(
  {
    cohortKey: {
      type: String,
      required: true,
      unique: true,
      // "{YYYY-MM}|{inland|outland}"
      match: [/^\d{4}-\d{2}\|(inland|outland)$/, "Invalid cohortKey"],
    },
    aorMonth: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, "Invalid aorMonth"],
    },
    applyingFrom: { type: String, enum: APPLYING_FROM, required: true },

    nApplicants: { type: Number, required: true, default: 0 },
    nCompleted: { type: Number, required: true, default: 0 },
    nWaiting: { type: Number, required: true, default: 0 },

    dominantStage: {
      type: String,
      enum: [...MILESTONE_IDS, null],
      default: null,
    },
    stageDistribution: {
      type: Map,
      of: Number,
      default: {},
    },

    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

export type CohortDocument = InferSchemaType<typeof CohortSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CohortModel: Model<Cohort> =
  (mongoose.models.Cohort as Model<Cohort> | undefined) ??
  mongoose.model<Cohort>("Cohort", CohortSchema);
