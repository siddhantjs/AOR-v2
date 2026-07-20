import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { findOrCreateCohortForUser } from "@/lib/cohort";
import { estimatesFromProfile } from "@/lib/estimateFormat";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";
import {
  APPLYING_FROM,
  DRAW_CATEGORIES,
  EXPRESS_ENTRY_PROGRAMS,
  PATHWAYS,
  type ApplyingFrom,
  type DrawCategory,
  type ExpressEntryProgram,
  type Pathway,
} from "@/lib/schema/constants";
import type { MilestoneEstimate } from "@/lib/schema/types";
import { UserModel } from "@/models/User";
import { AiEstimateService } from "@/services/ai-estimate";
import { UserEstimateStore } from "@/services/ai-estimate/UserEstimateStore";

type StartBody = {
  applyingFrom?: string | null;
  pathway?: string;
  expressEntryProgram?: string | null;
  drawCategory?: string;
  itaDate?: string;
  aorDate?: string;
  username?: string;
  email?: string;
};

const DRAW_VALUES = new Set(DRAW_CATEGORIES.map((c) => c.value));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function todayIsoUtc(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function validateBody(body: StartBody):
  | { ok: true; data: {
      applyingFrom: ApplyingFrom;
      pathway: Pathway;
      expressEntryProgram: ExpressEntryProgram | null;
      drawCategory: DrawCategory;
      itaDate: string;
      aorDate: string;
      username: string;
      email: string;
    } }
  | { ok: false; error: string; status: number } {
  if (
    !body.applyingFrom ||
    !(APPLYING_FROM as readonly string[]).includes(body.applyingFrom)
  ) {
    return { ok: false, error: "Choose Inland or Outland.", status: 400 };
  }
  if (!body.pathway || !(PATHWAYS as readonly string[]).includes(body.pathway)) {
    return { ok: false, error: "Choose a pathway.", status: 400 };
  }

  let expressEntryProgram: ExpressEntryProgram | null = null;
  if (body.pathway === "express-entry") {
    if (
      !body.expressEntryProgram ||
      !(EXPRESS_ENTRY_PROGRAMS as readonly string[]).includes(body.expressEntryProgram)
    ) {
      return {
        ok: false,
        error: "Choose an Express Entry program.",
        status: 400,
      };
    }
    expressEntryProgram = body.expressEntryProgram as ExpressEntryProgram;
  }

  if (!body.drawCategory || !DRAW_VALUES.has(body.drawCategory as DrawCategory)) {
    return { ok: false, error: "Choose a draw category.", status: 400 };
  }

  const itaDate = (body.itaDate ?? "").trim();
  const aorDate = (body.aorDate ?? "").trim();
  if (!ISO_DATE.test(itaDate)) {
    return { ok: false, error: "Add your ITA date.", status: 400 };
  }
  if (!ISO_DATE.test(aorDate)) {
    return { ok: false, error: "Add your AOR date.", status: 400 };
  }
  if (aorDate <= itaDate) {
    return {
      ok: false,
      error: "AOR comes after your ITA. Check both dates.",
      status: 400,
    };
  }
  if (aorDate > todayIsoUtc()) {
    return { ok: false, error: "AOR cannot be in the future.", status: 400 };
  }

  const format = validateUsernameFormat(body.username ?? "");
  if (!format.ok) {
    return { ok: false, error: format.message, status: 400 };
  }
  const username = normalizeUsername(body.username ?? "");

  const email = (body.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid email is required.", status: 400 };
  }

  return {
    ok: true,
    data: {
      applyingFrom: body.applyingFrom as ApplyingFrom,
      pathway: body.pathway as Pathway,
      expressEntryProgram,
      drawCategory: body.drawCategory as DrawCategory,
      itaDate,
      aorDate,
      username,
      email,
    },
  };
}

function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}

export async function POST(request: Request) {
  let body: StartBody;
  try {
    body = (await request.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = validateBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const data = parsed.data;

  try {
    await connectDb();

    const usernameTaken = await UserModel.exists({
      username: data.username,
      seededData: false,
    });
    if (usernameTaken) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 },
      );
    }

    const emailNorm = data.email.toLowerCase();
    const emailTaken = await UserModel.exists({ emailNorm });
    if (emailTaken) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const cohort = await findOrCreateCohortForUser(data.aorDate, data.applyingFrom);

    const user = await UserModel.create({
      username: data.username,
      email: data.email,
      seededData: false,
      applyingFrom: data.applyingFrom,
      pathway: data.pathway,
      expressEntryProgram: data.expressEntryProgram,
      drawCategory: data.drawCategory,
      itaDate: parseIsoDate(data.itaDate),
      aorDate: parseIsoDate(data.aorDate),
      primaryVisaOffice: null,
      secondaryVisaOffice: null,
      milestones: [],
      cohortKey: cohort._id,
      estimateMeta: null,
      userDetails: {},
    });

    const userId = String(user._id);

    let estimates: MilestoneEstimate[] = [];
    let status: "skipped" | "completed" | "failed" = "failed";
    let phase: string | null = null;
    let reason: string | null = null;

    try {
      const result = await AiEstimateService.getInstance().run(userId);
      status = result.status;
      phase = result.phase;
      reason = result.reason;

      if (result.status === "completed" && result.estimates.length > 0) {
        estimates = result.estimates;
      } else {
        const snap = await new UserEstimateStore().load(userId);
        estimates = estimatesFromProfile(snap?.milestones ?? []);
        if (result.status === "failed" && estimates.length === 0) {
          reason = result.reason;
        }
      }
    } catch (err) {
      status = "failed";
      reason =
        err instanceof Error ? err.message : "Could not generate estimates.";
    }

    return NextResponse.json({
      userId,
      status,
      phase,
      reason,
      estimates,
    });
  } catch (err) {
    if (isDuplicateKey(err)) {
      return NextResponse.json(
        { error: "Username or email is already in use." },
        { status: 409 },
      );
    }

    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : err instanceof Error && err.message.includes("GEMINI_API_KEY")
          ? "AI estimates are not configured."
          : "Could not start your timeline. Try again.";

    const status =
      message === "Database is not configured." ||
      message === "AI estimates are not configured."
        ? 503
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
