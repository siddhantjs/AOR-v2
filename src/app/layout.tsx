import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics, MicrosoftClarity } from "@/components/seo/tags";
import { buildPageMetadata } from "@/lib/marketing-metadata";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffcf5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable} h-full`}>
      <GoogleAnalytics />
      <MicrosoftClarity />
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
