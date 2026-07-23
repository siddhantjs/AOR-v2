import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareJourneyPage } from "@/components/pages/share";
import { api } from "@/lib/api";
import { daysSince } from "@/lib/dates";
import { buildPageMetadata } from "@/lib/marketing-metadata";

type PageProps = {
  params: Promise<{ shareID: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareID } = await params;
  try {
    const data = await api.getShareJourney(shareID);
    const done = data.milestones.filter((m) => m.status === "done").length;
    const total = data.milestones.length;
    const days = daysSince(data.aor);

    return buildPageMetadata({
      title: `Applicant #${data.publicId} - day ${days} of the PR wait | AORTrack`,
      description: `Read-only PR milestone snapshot: ${data.pathway} · ${data.stream} · AOR ${data.aor}. ${done} of ${total} milestones done.`,
      path: `/s/${shareID}`,
      noIndex: true,
    });
  } catch {
    return buildPageMetadata({
      title: "Shared PR journey · AORTrack",
      description: "Read-only PR milestone snapshot shared from AORTrack.",
      path: `/s/${shareID}`,
      noIndex: true,
    });
  }
}

export default async function ShareJourneyRoute({ params }: PageProps) {
  const { shareID } = await params;
  if (!shareID?.trim()) notFound();

  let data;
  try {
    data = await api.getShareJourney(shareID.trim());
  } catch {
    notFound();
  }
  if (!data) notFound();

  return <ShareJourneyPage data={data} />;
}
