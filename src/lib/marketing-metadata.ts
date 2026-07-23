import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const DEFAULT_OG_IMAGE = "/og/home.png";

type BuildPageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
};

/** Per-page metadata: title, description, canonical, Open Graph, Twitter. */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage);

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: url },
    robots: noIndex ? NOINDEX_ROBOTS : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_CA",
      url,
      siteName: "AORTrack",
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildNoIndexMetadata(title: string, description: string): Metadata {
  return buildPageMetadata({ title, description, noIndex: true });
}

/** Current date as YYYY-MM-DD (UTC). */
export const MARKETING_CONTENT_DATE_MODIFIED = new Date(Date.now()).toISOString().slice(0, 10);
