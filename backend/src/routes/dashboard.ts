import { Router } from "express";
import { connectDb } from "@/lib/db";
import { findOrCreateCohortForUser } from "@/lib/cohort";
import { toIsoDate, parseIsoDate } from "@/lib/dates";
import { toApplicantDetailsForm, type ApplicantDetailsForm } from "@/lib/applicantDetails";
import { loadDashboardView, loadEditMilestonesData } from "@/lib/loadDashboard";
import {
  APPLYING_FROM,
  DRAW_CATEGORIES,
  EXPRESS_ENTRY_PROGRAMS,
  MARITAL_STATUSES,
  MEDICAL_TYPES,
  OFFICE_LIST,
  PATHWAYS,
  SPOUSE_STATUSES,
  type ApplyingFrom,
  type DrawCategory,
  type ExpressEntryProgram,
  type MaritalStatus,
  type MedicalType,
  type Pathway,
  type SpouseStatus,
  type VisaOffice,
} from "@/lib/schema/constants";
import type { User } from "@/lib/schema/types";
import { UserModel } from "@/models/User";
import { AiEstimateService } from "@/services/ai-estimate";

export const dashboardRouter = Router();

const DRAW_SET = new Set(DRAW_CATEGORIES.map((c) => c.value));
const OFFICE_SET = new Set<string>(OFFICE_LIST);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parseDetailsBody(
  body: Partial<ApplicantDetailsForm>,
): { ok: true; data: ApplicantDetailsForm } | { ok: false; error: string } {
  if (!body.pathway || !(PATHWAYS as readonly string[]).includes(body.pathway)) {
    return { ok: false, error: "Choose an application type." };
  }
  const pathway = body.pathway as Pathway;

  let expressEntryProgram: ExpressEntryProgram | "" = "";
  if (pathway === "express-entry") {
    if (
      !body.expressEntryProgram ||
      !(EXPRESS_ENTRY_PROGRAMS as readonly string[]).includes(body.expressEntryProgram)
    ) {
      return { ok: false, error: "Choose an Express Entry program." };
    }
    expressEntryProgram = body.expressEntryProgram as ExpressEntryProgram;
  }

  if (!body.drawCategory || !DRAW_SET.has(body.drawCategory as DrawCategory)) {
    return { ok: false, error: "Choose a draw category." };
  }
  if (!body.applyingFrom || !(APPLYING_FROM as readonly string[]).includes(body.applyingFrom)) {
    return { ok: false, error: "Choose Inland or Outland." };
  }

  const itaDate = (body.itaDate ?? "").trim();
  const aorDate = (body.aorDate ?? "").trim();
  if (!ISO.test(itaDate)) {
    return { ok: false, error: "Add a valid ITA date." };
  }
  if (!ISO.test(aorDate)) {
    return { ok: false, error: "AOR date is missing." };
  }
  if (itaDate >= aorDate) {
    return { ok: false, error: "ITA must be before your AOR." };
  }

  if (body.primaryVisaOffice && !OFFICE_SET.has(body.primaryVisaOffice)) {
    return { ok: false, error: "Invalid PVO." };
  }
  if (body.secondaryVisaOffice && !OFFICE_SET.has(body.secondaryVisaOffice)) {
    return { ok: false, error: "Invalid SVO." };
  }

  if (body.maritalStatus && !(MARITAL_STATUSES as readonly string[]).includes(body.maritalStatus)) {
    return { ok: false, error: "Invalid marital status." };
  }
  if (body.spouseStatus && !(SPOUSE_STATUSES as readonly string[]).includes(body.spouseStatus)) {
    return { ok: false, error: "Invalid spouse status." };
  }
  if (body.medicalType && !(MEDICAL_TYPES as readonly string[]).includes(body.medicalType)) {
    return { ok: false, error: "Invalid medical type." };
  }

  return {
    ok: true,
    data: {
      pathway,
      expressEntryProgram,
      drawCategory: body.drawCategory as DrawCategory,
      itaDate,
      aorDate,
      applyingFrom: body.applyingFrom as ApplyingFrom,
      nationality: (body.nationality ?? "").trim(),
      crsScore: (body.crsScore ?? "").trim(),
      maritalStatus: (body.maritalStatus ?? "") as MaritalStatus | "",
      spouseStatus: (body.spouseStatus ?? "") as SpouseStatus | "",
      foreignWork: (body.foreignWork ?? "") as "" | "yes" | "no",
      canadianWork: (body.canadianWork ?? "") as "" | "yes" | "no",
      dependants: (body.dependants ?? "").trim(),
      primaryVisaOffice: (body.primaryVisaOffice ?? "") as VisaOffice | "",
      secondaryVisaOffice: (body.secondaryVisaOffice ?? "") as VisaOffice | "",
      countryOfResidence: (body.countryOfResidence ?? "").trim(),
      medicalType: (body.medicalType ?? "") as MedicalType | "",
    },
  };
}

dashboardRouter.get("/:userId", async (req, res) => {
  const userId = String(req.params.userId ?? "");
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    res.status(400).json({ error: "Invalid user." });
    return;
  }

  try {
    const data = await loadDashboardView(userId);
    if (!data) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not load dashboard.";
    res.status(message.includes("Database") ? 503 : 500).json({ error: message });
  }
});

dashboardRouter.get("/:userId/edit-milestone", async (req, res) => {
  const userId = String(req.params.userId ?? "");
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    res.status(400).json({ error: "Invalid user." });
    return;
  }

  try {
    const data = await loadEditMilestonesData(userId);
    if (!data) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not load milestones.";
    res.status(message.includes("Database") ? 503 : 500).json({ error: message });
  }
});

dashboardRouter.post("/:userId/details", async (req, res) => {
  const userId = String(req.params.userId ?? "");
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    res.status(400).json({ error: "Invalid user." });
    return;
  }

  const raw = (req.body ?? {}) as Partial<ApplicantDetailsForm>;
  const parsed = parseDetailsBody(raw);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const data = parsed.data;

  try {
    await connectDb();
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const aorIso = toIsoDate(new Date(user.aorDate));
    if (data.aorDate !== aorIso) {
      data.aorDate = aorIso;
    }
    if (data.itaDate >= aorIso) {
      res.status(400).json({ error: "ITA must be before your AOR." });
      return;
    }

    const prevApplying = user.applyingFrom;

    user.set("pathway", data.pathway);
    user.set(
      "expressEntryProgram",
      data.pathway === "express-entry" && data.expressEntryProgram
        ? data.expressEntryProgram
        : null,
    );
    user.set("drawCategory", data.drawCategory);
    user.set("itaDate", parseIsoDate(data.itaDate));
    user.set("applyingFrom", data.applyingFrom);
    user.set("primaryVisaOffice", data.primaryVisaOffice || null);
    user.set("secondaryVisaOffice", data.secondaryVisaOffice || null);

    const crs = data.crsScore === "" ? null : Number(data.crsScore);
    const deps = data.dependants === "" ? null : Number(data.dependants);

    user.set("userDetails", {
      crsScore: crs != null && Number.isFinite(crs) ? crs : null,
      maritalStatus: data.maritalStatus || null,
      spouseStatus: data.spouseStatus || null,
      nationality: data.nationality || null,
      foreignWork: data.foreignWork === "" ? null : data.foreignWork === "yes",
      foreignWorkYears: null,
      canadianWork: data.canadianWork === "" ? null : data.canadianWork === "yes",
      canadianWorkYears: null,
      dependants: deps != null && Number.isFinite(deps) ? deps : null,
      countryOfResidence: data.countryOfResidence || null,
      medicalType: data.medicalType || null,
    });

    if (data.applyingFrom !== prevApplying) {
      const cohort = await findOrCreateCohortForUser(aorIso, data.applyingFrom);
      user.set("cohortKey", cohort._id);
    }

    await user.save();

    try {
      await AiEstimateService.getInstance().run(userId);
    } catch {
      // Keep saved details even if re-estimate fails.
    }

    const lean = user.toObject() as unknown as User;
    res.json({
      ok: true,
      form: toApplicantDetailsForm(lean),
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not save details.";
    res.status(message.includes("Database") ? 503 : 500).json({ error: message });
  }
});
