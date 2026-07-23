"use client";

import { useRouter } from "next/navigation";
import { TrackFlowHeader } from "@/components/pages/track/TrackFlowHeader";
import { MilestonesStep, type MilestonesFormState } from "@/components/pages/track/MilestonesStep";
import type { EditMilestonesData } from "@/lib/loadDashboard";
import { api } from "@/lib/api";

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
    const payload = await api.trackSubmit({
      userId: data.userId,
      milestones: state.milestones,
      primaryVisaOffice: state.primaryVisaOffice || "",
      secondaryVisaOffice: state.secondaryVisaOffice || "",
    });

    router.push(payload.redirectTo ?? dashboardHref);
    router.refresh();
  }

  return (
    <>
      <TrackFlowHeader
        kicker="Edit timeline"
        title="Your milestones"
        subtitle="Log new milestones as they happen. Dates already saved stay locked."
        phases={[
          { step: 1, label: "Application", state: "done" },
          { step: 2, label: "Milestones", state: "on" },
        ]}
      />
      <MilestonesStep
        userId={data.userId}
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
