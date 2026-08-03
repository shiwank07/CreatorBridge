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

export const GLOBAL_STRUCTURED_DATA = safeJsonLd({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png"), width: 512, height: 512 }, email: "support@branzzo.com" },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, publisher: { "@id": `${SITE_URL}/#organization` }, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/creators?q={search_term_string}` }, "query-input": "required name=search_term_string" } },
    { "@type": "WebApplication", "@id": `${SITE_URL}/#application`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, applicationCategory: "BusinessApplication", operatingSystem: "Web", browserRequirements: "Requires JavaScript and a modern web browser", publisher: { "@id": `${SITE_URL}/#organization` } },
  ],
});

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
