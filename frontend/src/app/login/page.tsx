import type { Metadata } from "next";
import { LoginPage } from "@/components/pages/login";

export const metadata: Metadata = {
  title: "Open your timeline · AORTrack",
  description:
    "Sign in with the email and username from your AORTrack profile to open your dashboard.",
};

export default function LoginRoute() {
  return <LoginPage />;
}
