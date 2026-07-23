/**
 * FE mirror of the immigration API contract (`/api/aor-track/v1`).
 * Update this file when the backend request/response shapes change.
 *
 * | Method | Path |
 * | ------ | ---------------------------------------------------- |
 * | POST   | /auth/login |
 * | GET    | /username/check?username= |
 * | POST   | /track/start |
 * | POST   | /track/submit |
 * | POST   | /dashboard/:userId/details |
 * | GET    | /dashboard/:userId |
 * | GET    | /dashboard/:userId/edit-milestone |
 * | GET    | /dashboard/:userId/cohort |
 * | GET    | /dashboard/:userId/all-cohorts |
 */

import type { ApplicantDetailsForm } from "@/lib/applicantDetails";
import type { MilestoneEstimate } from "@/lib/schema/types";
import type { MilestoneId } from "@/lib/schema/constants";

export type LoginRequest = {
  email: string;
  username: string;
};

export type LoginResponse = {
  userId: string;
  redirectTo: string;
};

export type UsernameCheckResponse = {
  available: boolean;
  username?: string;
  reason?: string;
};

export type TrackStartRequest = {
  applyingFrom: string | null;
  pathway: string;
  expressEntryProgram?: string | null;
  drawCategory: string;
  itaDate: string;
  aorDate: string;
  username: string;
  email: string;
};

export type TrackStartResponse = {
  userId: string;
  status: "skipped" | "completed" | "failed";
  phase: string | null;
  reason: string | null;
  estimates: MilestoneEstimate[];
};

export type TrackSubmitRequest = {
  userId: string;
  milestones: Partial<Record<MilestoneId, { done?: boolean; date?: string }>>;
  primaryVisaOffice?: string;
  secondaryVisaOffice?: string;
};

export type TrackSubmitResponse = {
  ok: boolean;
  userId: string;
  redirectTo: string;
};

export type UpdateDetailsResponse = {
  ok: boolean;
  form: ApplicantDetailsForm;
};
