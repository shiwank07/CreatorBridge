import type { Metadata } from "next";

export const SITE_URL = "https://branzzo.com";
export const SITE_NAME = "Branzzo";
export const SITE_TITLE = "Branzzo | Find Creators & Manage Brand Collaborations";
export const SITE_DESCRIPTION =
  "Discover creators, compare professional profiles, send campaign briefs, and manage brand collaborations across Instagram, YouTube and more with Branzzo.";
export const SOCIAL_IMAGE = "/branding/branzzo-og.png";
export const SOCIAL_IMAGE_ALT = "Branzzo creator marketplace for brand collaborations";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const GLOBAL_STRUCTURED_DATA = safeJsonLd({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png"), width: 512, height: 512 } },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, publisher: { "@id": `${SITE_URL}/#organization` } },
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
      locale: "en_IN",
      type: "website",
      images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [SOCIAL_IMAGE] },
  };
}
