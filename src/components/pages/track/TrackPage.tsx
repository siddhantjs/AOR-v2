"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApplicationDetailsCard,
  type ApplicationFormValues,
} from "./ApplicationDetailsCard";
import {
  MilestonesStep,
  type MilestonesFormState,
} from "./MilestonesStep";
import { TrackFlowHeader } from "./TrackFlowHeader";
import { LogoMark } from "@/components/common/LogoMark";
import type { MilestoneEstimate } from "@/lib/schema/types";

type TrackStep = "application" | "milestones";

type TrackStartResponse = {
  userId: string;
  status: "skipped" | "completed" | "failed";
  phase: string | null;
  reason: string | null;
  estimates: MilestoneEstimate[];
  error?: string;
};

export function TrackPage() {
  const router = useRouter();
  const [step, setStep] = useState<TrackStep>("application");
  const [application, setApplication] = useState<ApplicationFormValues | null>(
    null,
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<MilestoneEstimate[]>([]);
  const [estimateNotice, setEstimateNotice] = useState<string | null>(null);

  async function handleContinue(values: ApplicationFormValues) {
    if (userId) {
      setApplication(values);
      setStep("milestones");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const res = await fetch("/api/track/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = (await res.json()) as TrackStartResponse & { error?: string };

    if (!res.ok) {
      throw new Error(data.error ?? "Could not start your timeline. Try again.");
    }

    setUserId(data.userId);
    setEstimates(data.estimates ?? []);
    setEstimateNotice(
      data.status === "failed"
        ? data.reason ??
            "Estimates could not be generated yet. You can still log milestones."
        : null,
    );
    setApplication(values);
    setStep("milestones");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStep("application");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleMilestonesSubmit(state: MilestonesFormState) {
    if (!userId) {
      throw new Error("Missing user. Go back and continue again.");
    }

    const res = await fetch("/api/track/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        milestones: state.milestones,
        primaryVisaOffice: state.primaryVisaOffice || "",
        secondaryVisaOffice: state.secondaryVisaOffice || "",
      }),
    });

    const data = (await res.json()) as {
      ok?: boolean;
      redirectTo?: string;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(data.error ?? "Could not save your timeline. Try again.");
    }

    router.push(data.redirectTo ?? `/dashboard/${userId}`);
  }

  const onMilestones = step === "milestones" && application && userId;

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max)] items-center px-[22px]">
          <Link href="/" className="flex items-center gap-1">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="ml-auto text-[13px] font-semibold text-[var(--muted)] transition-[var(--ease)] hover:text-[var(--navy)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-8 pb-[100px]">
        {onMilestones ? (
          <>
            <TrackFlowHeader
              kicker="Step 2 of 2"
              title="Your milestones"
              subtitle="Tick what has already happened and add its date. Skip what has not. We estimate the rest for you."
              phases={[
                { step: 1, label: "Application", state: "done" },
                { step: 2, label: "Milestones", state: "on" },
              ]}
            />
            <MilestonesStep
              application={application}
              estimates={estimates}
              estimateNotice={estimateNotice}
              onBack={handleBack}
              onSubmit={handleMilestonesSubmit}
            />
          </>
        ) : (
          <>
            <TrackFlowHeader
              kicker="GetNorthPath community tracker"
              title="Tell us about your application"
              subtitle="Two quick minutes. This places you in the right cohort so your estimates come from people just like you."
              phases={[
                { step: 1, label: "Application", state: "on" },
                { step: 2, label: "Milestones", state: "todo" },
              ]}
            />
            <ApplicationDetailsCard
              onContinue={handleContinue}
              initialValues={application ?? undefined}
            />
          </>
        )}
      </main>
    </div>
  );
}
