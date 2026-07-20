"use client";

import Link from "next/link";
import {
  ApplicationDetailsCard,
  type ApplicationFormValues,
} from "./ApplicationDetailsCard";
import { TrackFlowHeader } from "./TrackFlowHeader";
import { LogoMark } from "@/components/common/LogoMark";

export function TrackPage() {
  function handleContinue(_values: ApplicationFormValues) {
    // Milestones step (phase 2) will mount here next.
  }

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
        </div>
      </header>

      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-8 pb-[100px]">
        <TrackFlowHeader
          kicker="GetNorthPath community tracker"
          title="Tell us about your application"
          subtitle="Two quick minutes. This places you in the right cohort so your estimates come from people just like you."
          phases={[
            { step: 1, label: "Application", state: "on" },
            { step: 2, label: "Milestones", state: "todo" },
          ]}
        />
        <ApplicationDetailsCard onContinue={handleContinue} />
      </main>
    </div>
  );
}
