import type { MetadataRoute } from "next";
import { MARKETING_CONTENT_DATE_MODIFIED } from "@/lib/marketing-metadata";
import { SITEMAP_PUBLIC_PATHS } from "@/lib/sitemap-paths";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(MARKETING_CONTENT_DATE_MODIFIED);

  return SITEMAP_PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
