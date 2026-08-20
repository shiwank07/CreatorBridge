import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/", "/dashboard/", "/api/", "/onboarding/", "/notifications/",
          "/campaign-inquiry", "/account-unavailable", "/sign-in", "/sign-up", "/auth/", "/sso-callback",
        ],
      },
    ],
    sitemap: "https://branzzo.com/sitemap.xml",
    host: "https://branzzo.com",
  };
}
