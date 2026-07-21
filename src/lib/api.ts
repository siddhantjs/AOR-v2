import axios, { AxiosError, type AxiosInstance } from "axios";
import type { ApplicantDetailsForm } from "@/lib/applicantDetails";
import type { DashboardView } from "@/lib/dashboardView";
import type { AllCohortsPageData, CohortPageData } from "@/lib/loadCohort";
import type { EditMilestonesData } from "@/lib/loadDashboard";
import type { MilestoneEstimate } from "@/lib/schema/types";
import type { MilestoneId } from "@/lib/schema/constants";

/** Mounted on the immigration API host (NEXT_PUBLIC_API_URL = host only, no path). */
const API_PREFIX = "/api/aor-track/v1";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: string; reason?: string } | undefined;
    return data?.error ?? data?.reason ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export class ApiClient {
  private http: AxiosInstance;


  constructor(
    baseURL = `${API_URL}${API_PREFIX}`,
  ) {
    this.http = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 120_000,
    });
  }

  async login(body: LoginRequest): Promise<LoginResponse> {
    try {
      const { data } = await this.http.post<LoginResponse>("/auth/login", body);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not sign in. Try again."));
    }
  }

  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    try {
      const { data } = await this.http.get<UsernameCheckResponse>("/username/check", {
        params: { username },
      });
      return data;
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        return err.response.data as UsernameCheckResponse;
      }
      throw new Error(apiErrorMessage(err, "Could not check username. Try again."));
    }
  }

  async trackStart(body: TrackStartRequest): Promise<TrackStartResponse> {
    try {
      const { data } = await this.http.post<TrackStartResponse>("/track/start", body);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not start your timeline. Try again."));
    }
  }

  async trackSubmit(body: TrackSubmitRequest): Promise<TrackSubmitResponse> {
    try {
      const { data } = await this.http.post<TrackSubmitResponse>("/track/submit", body);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not save your timeline. Try again."));
    }
  }

  async updateApplicantDetails(
    userId: string,
    body: ApplicantDetailsForm,
  ): Promise<UpdateDetailsResponse> {
    try {
      const { data } = await this.http.post<UpdateDetailsResponse>(
        `/dashboard/${userId}/details`,
        body,
      );
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not save details."));
    }
  }

  async getDashboard(userId: string): Promise<DashboardView> {
    try {
      const { data } = await this.http.get<DashboardView>(`/dashboard/${userId}`);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not load dashboard."));
    }
  }

  async getEditMilestones(userId: string): Promise<EditMilestonesData> {
    try {
      const { data } = await this.http.get<EditMilestonesData>(
        `/dashboard/${userId}/edit-milestone`,
      );
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not load milestones."));
    }
  }

  async getCohort(userId: string, cohortKey?: string | null): Promise<CohortPageData> {
    try {
      const { data } = await this.http.get<CohortPageData>(`/dashboard/${userId}/cohort`, {
        params: cohortKey ? { c: cohortKey } : undefined,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not load cohort."));
    }
  }

  async getAllCohorts(userId: string): Promise<AllCohortsPageData> {
    try {
      const { data } = await this.http.get<AllCohortsPageData>(
        `/dashboard/${userId}/all-cohorts`,
      );
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Could not load cohorts."));
    }
  }
}

export const api = new ApiClient();
