import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const staticRoutes = [
  "", "/creators", "/about", "/pricing", "/contact", "/trust-safety",
  "/community-guidelines", "/privacy", "/terms", "/cookies",
] as const;

/**
 * Crawler infrastructure must never wait on MongoDB. Public profiles remain
 * discoverable through the creator directory and internal profile links.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((path) => ({ url: `${SITE_URL}${path}` }));
}
