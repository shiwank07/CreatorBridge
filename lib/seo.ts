const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://branzzo.com";

export const SITE_URL = configuredUrl.replace(/\/$/, "");
export const SITE_NAME = "Branzzo";
export const SITE_TITLE = "Branzzo | Creator Marketplace for Brands & Creators";
export const SITE_DESCRIPTION =
  "Branzzo helps brands discover verified creators, compare creator profiles, send campaign requests, and manage paid collaborations across YouTube, Instagram, TikTok, and Twitch.";
export const SOCIAL_IMAGE = "/branding/branzzo-og.png";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  const isHome = path === "/";
  const socialTitle = isHome ? SITE_TITLE : `${title} | ${SITE_NAME}`;
  return {
    title: isHome ? { absolute: SITE_TITLE } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: "Branzzo creator marketplace for brands and creators" }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [SOCIAL_IMAGE] },
  };
}
import type { Metadata } from "next";
