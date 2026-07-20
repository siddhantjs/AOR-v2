import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import {
  mergeLoggedMilestones,
  newShareToken,
  officesFromBody,
} from "@/lib/dashboardView";
import { MILESTONE_IDS, OFFICE_LIST, type MilestoneId } from "@/lib/schema/constants";
import type { ProfileMilestone } from "@/lib/schema/types";
import { UserModel } from "@/models/User";
import { AiEstimateService } from "@/services/ai-estimate";

type MilestonePayload = { done?: boolean; date?: string };
type SubmitBody = {
  userId?: string;
  milestones?: Partial<Record<MilestoneId, MilestonePayload>>;
  primaryVisaOffice?: string;
  secondaryVisaOffice?: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OFFICE_SET = new Set<string>(OFFICE_LIST);

export async function POST(request: Request) {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = (body.userId ?? "").trim();
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  const logged: Partial<Record<MilestoneId, { done: boolean; date: string }>> =
    {};

  for (const id of MILESTONE_IDS) {
    const entry = body.milestones?.[id];
    if (!entry?.done) continue;
    const date = (entry.date ?? "").trim();
    if (!ISO_DATE.test(date)) {
      return NextResponse.json(
        { error: `Add the date for ${id}.` },
        { status: 400 },
      );
    }
    logged[id] = { done: true, date };
  }

  if (body.primaryVisaOffice && !OFFICE_SET.has(body.primaryVisaOffice)) {
    return NextResponse.json({ error: "Invalid PVO." }, { status: 400 });
  }
  if (body.secondaryVisaOffice && !OFFICE_SET.has(body.secondaryVisaOffice)) {
    return NextResponse.json({ error: "Invalid SVO." }, { status: 400 });
  }

  try {
    await connectDb();
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const existing = (user.milestones ?? []) as ProfileMilestone[];
    const merged = mergeLoggedMilestones(existing, logged);
    const offices = officesFromBody(
      body.primaryVisaOffice,
      body.secondaryVisaOffice,
    );

    user.set("milestones", merged);
    user.set("primaryVisaOffice", offices.primaryVisaOffice);
    user.set("secondaryVisaOffice", offices.secondaryVisaOffice);
    user.set("submittedAt", new Date());
    if (!user.shareToken) {
      user.set("shareToken", newShareToken());
    }

    await user.save();

    // Re-estimate when offices / logged dates change (SCHEMA call 2).
    try {
      await AiEstimateService.getInstance().run(userId);
    } catch {
      // Dashboard still works with prior estimates.
    }

    return NextResponse.json({
      ok: true,
      userId,
      redirectTo: `/dashboard/${userId}`,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not save your timeline. Try again.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Database") ? 503 : 500 },
    );
  }
}
