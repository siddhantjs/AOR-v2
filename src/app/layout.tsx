import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase: new URL(getSiteUrl()),
  title: "AORTrack   Canadian Immigration Timeline",
  description:
    "Crowd-sourced Canadian PR timelines by stream, cohort, and milestone.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1923",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
