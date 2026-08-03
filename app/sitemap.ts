import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const staticRoutes = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/creators", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/trust-safety", changeFrequency: "monthly", priority: 0.6 },
  { path: "/community-guidelines", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
] as const;

/**
 * Crawler infrastructure must never wait on MongoDB. Public profiles remain
 * discoverable through the creator directory and internal profile links.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
