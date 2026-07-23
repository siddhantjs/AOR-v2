import type { Metadata } from "next";
import { LoginPage } from "@/components/pages/login";
import { buildNoIndexMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = buildNoIndexMetadata(
  "Open your timeline · AORTrack",
  "Sign in with the email and username from your AORTrack profile to open your dashboard.",
);

export default function LoginRoute() {
  return <LoginPage />;
}
