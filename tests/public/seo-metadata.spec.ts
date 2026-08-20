import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

import manifest from "../../app/manifest";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
import { GLOBAL_STRUCTURED_DATA, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, SOCIAL_IMAGE } from "../../lib/seo";

test("root metadata uses the approved canonical production identity", () => {
  const layout = fs.readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
  expect(SITE_URL).toBe("https://branzzo.com");
  expect(SITE_TITLE).toBe("Branzzo | Find Creators & Manage Brand Collaborations");
  expect(SITE_DESCRIPTION).toBe("Discover creators, compare professional profiles, send campaign briefs, and manage brand collaborations across Instagram, YouTube and more with Branzzo.");
  expect(layout).toContain("metadataBase: new URL(SITE_URL)");
  expect(layout).toContain('title: { default: SITE_TITLE, template: "%s | Branzzo" }');
  expect(layout).toContain('alternates: { canonical: "/" }');
  expect(layout).toContain('locale: "en_IN"');
  expect(layout).toContain('card: "summary_large_image"');
  expect(layout).toContain('"msvalidate.01": "C1B8F53E9DA3FD03CCEFE1B282195B2B"');
  expect(layout).not.toContain('<meta name="msvalidate.01"');
});

test("robots permits public pages and excludes private route families", () => {
  const result = robots();
  expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  expect(result.host).toBe(SITE_URL);
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const disallowed = rules.flatMap((rule) => Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : []);
  expect(disallowed).toEqual(expect.arrayContaining(["/dashboard/", "/admin/", "/onboarding/", "/api/", "/account-unavailable"]));
  expect(disallowed).not.toContain("/_next/");
});

test("sitemap contains only canonical public static routes", () => {
  const urls = sitemap().map((entry) => entry.url);
  expect(urls).toEqual(expect.arrayContaining([`${SITE_URL}`, `${SITE_URL}/creators`, `${SITE_URL}/about`, `${SITE_URL}/contact`, `${SITE_URL}/privacy`, `${SITE_URL}/terms`]));
  expect(urls.every((url) => url.startsWith(SITE_URL))).toBe(true);
  expect(urls.some((url) => /\/(dashboard|admin|onboarding|api|sign-in|sign-up)(\/|$)/.test(url))).toBe(false);
});

test("manifest and structured data use valid approved assets and claims", () => {
  const result = manifest();
  expect(result).toMatchObject({ name: "Branzzo", short_name: "Branzzo", start_url: "/", display: "standalone", description: SITE_DESCRIPTION });
  expect(result.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192" }),
    expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512" }),
  ]));
  expect(() => JSON.parse(GLOBAL_STRUCTURED_DATA)).not.toThrow();
  expect(GLOBAL_STRUCTURED_DATA).not.toContain("SearchAction");
  expect(GLOBAL_STRUCTURED_DATA).not.toContain("localhost");
});

test("private layouts explicitly prevent indexing and the social image exists", () => {
  for (const relativePath of ["app/dashboard/layout.tsx", "app/admin/layout.tsx", "app/onboarding/layout.tsx", "app/(auth)/layout.tsx", "app/auth/layout.tsx"]) {
    expect(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")).toContain("robots: { index: false, follow: false }");
  }
  expect(fs.readFileSync(path.join(process.cwd(), "app/account-unavailable/page.tsx"), "utf8")).toContain("robots: { index: false, follow: false }");
  expect(fs.existsSync(path.join(process.cwd(), "public", SOCIAL_IMAGE))).toBe(true);
});
