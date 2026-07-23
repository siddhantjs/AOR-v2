import type { Metadata } from "next";
import { LandingPage } from "@/components/pages/landing";
import { buildPageMetadata } from "@/lib/marketing-metadata";
import { homeJsonLdGraph, JsonLd } from "@/lib/marketing-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Canada PR Milestone Tracker - Cohort Groups & Community Timelines | AORTrack",
  description:
    "Track every PR milestone from AOR to PR card, join your AOR-month cohort, browse real community timelines, and connect on WhatsApp & Facebook. Free.",
  path: "/",
  keywords: [
    "AOR tracker",
    "Canada PR processing time",
    "Express Entry timeline",
    "AOR cohort",
    "PR milestones",
    "CEC processing time",
    "AORTrack",
  ],
});

export default function Home() {
  return (
    <>
      <JsonLd data={homeJsonLdGraph()} />
      <LandingPage />
    </>
  );
}
