import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = buildNoIndexMetadata(
  "Your dashboard · AORTrack",
  "Private AORTrack dashboard for your PR timeline, cohort, and milestones.",
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
