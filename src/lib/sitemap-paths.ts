/** Public paths included in sitemap (and allowed for AI/marketing crawlers). */
export const SITEMAP_PUBLIC_PATHS = ["/"] as const;

/** App / private prefixes - disallow in robots, noindex in metadata. */
export const ROBOTS_DISALLOW_PATHS = ["/track", "/login", "/dashboard/", "/api/", "/s/"] as const;
