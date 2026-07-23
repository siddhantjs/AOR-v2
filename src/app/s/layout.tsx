import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = buildNoIndexMetadata(
  "Shared PR journey · AORTrack",
  "Read-only PR milestone snapshot shared from AORTrack.",
);

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
