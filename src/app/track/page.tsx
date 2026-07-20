import type { Metadata } from "next";
import { TrackPage } from "@/components/pages/track/TrackPage";

export const metadata: Metadata = {
  title: "Tell us about your application · AORTrack",
  description:
    "Share your Express Entry or PNP details so we can place you in the right cohort.",
};

export default function TrackRoute() {
  return <TrackPage />;
}
