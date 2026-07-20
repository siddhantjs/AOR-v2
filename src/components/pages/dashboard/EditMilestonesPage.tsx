"use client";

import { useRouter } from "next/navigation";
import { TrackFlowHeader } from "@/components/pages/track/TrackFlowHeader";
import { MilestonesStep, type MilestonesFormState } from "@/components/pages/track/MilestonesStep";
import type { EditMilestonesData } from "@/lib/loadDashboard";

type EditMilestonesPageProps = {
  data: EditMilestonesData;
};

export function EditMilestonesPage({ data }: EditMilestonesPageProps) {
  const router = useRouter();
  const dashboardHref = `/dashboard/${data.userId}`;

  function handleBack() {
    router.push(dashboardHref);
  }

  async function handleSubmit(state: MilestonesFormState) {
    const res = await fetch("/api/track/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        milestones: state.milestones,
        primaryVisaOffice: state.primaryVisaOffice || "",
        secondaryVisaOffice: state.secondaryVisaOffice || "",
      }),
    });

    const payload = (await res.json()) as {
      ok?: boolean;
      redirectTo?: string;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(payload.error ?? "Could not save your timeline. Try again.");
    }

    router.push(payload.redirectTo ?? dashboardHref);
    router.refresh();
  }

  return (
    <>
      <TrackFlowHeader
        kicker="Edit timeline"
        title="Your milestones"
        subtitle="Update what has already happened. Skip what has not. We re-estimate the rest for you."
        phases={[
          { step: 1, label: "Application", state: "done" },
          { step: 2, label: "Milestones", state: "on" },
        ]}
      />
      <MilestonesStep
        application={data.application}
        estimates={data.estimates}
        initialState={data.initialState}
        backLabel="Dashboard"
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </>
  );
}
