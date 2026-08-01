import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://branzzo.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/", "/dashboard/", "/api/", "/onboarding/", "/notifications/",
          "/campaign-inquiry", "/sign-in", "/sign-up", "/auth/", "/sso-callback",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
