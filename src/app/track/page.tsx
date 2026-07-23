import type { Metadata } from "next";
import { TrackPage } from "@/components/pages/track/TrackPage";
import { buildNoIndexMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = buildNoIndexMetadata(
  "Tell us about your application · AORTrack",
  "Share your Express Entry or PNP details so we can place you in the right cohort.",
);

export default function TrackRoute() {
  return <TrackPage />;
}
