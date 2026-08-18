import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import sift from "sift";

import { creatorOnboardingSchema } from "../../lib/validators/creator";
import { brandOnboardingSchema } from "../../lib/validators/brand-profile";
import { evaluateBrandProfileCompleteness, evaluateCreatorProfileCompleteness } from "../../lib/profile-completion";
import { BRAND_DISCOVERY_COMPLETENESS_FILTER } from "../../lib/queries/brands";
import { CREATOR_DISCOVERY_COMPLETENESS_FILTER } from "../../lib/queries/creators";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const creatorRoute = source("app/api/onboarding/creator/route.ts");
const brandRoute = source("app/api/onboarding/brand/route.ts");
const inquiryRoute = source("app/api/brand-inquiries/route.ts");
const creatorQueries = source("lib/queries/creators.ts");
const brandQueries = source("lib/queries/brands.ts");
const creatorCard = source("components/creators/creator-card.tsx");
const creatorPage = source("app/creators/[username]/page.tsx");

const account = (changes: Record<string, unknown> = {}) => ({ id: "instagram-main", platform: "instagram", profileUrl: "https://instagram.com/creatorname", audienceType: "followers", audienceCount: 1200, isPrimary: true, ...changes });
const creator = {
  name: "Creator Name", username: "creatorname", avatar: "https://images.example.com/creator.jpg",
  bio: "I create practical technology stories and detailed product guides for engaged buyers.", niche: ["Tech"], country: "India", languages: ["English"],
  platformAccounts: [account()], youtubeUrl: "", youtubeHandle: "", subscribers: 0, avgViews: 0, engagementRate: 0, instagramUrl: "", instagramFollowers: 0, podcastUrl: "",
  pricingChoice: "contact_for_pricing", sponsorshipRate: 0, rateType: "per_post", pastBrands: [], sampleWorkUrls: [], availabilityStatus: "open_to_deals", isOpenToDeals: true,
} as const;
const storedCreator = { ...creator, platformAccounts: [account({ normalizedProfileUrl: "https://instagram.com/creatorname", verification: { status: "unverified" } })] };
const creatorUser = { name: creator.name, username: creator.username, avatar: creator.avatar };
const brand = {
  username: "acmebrand", companyName: "Acme Brand", contactName: "Asha Patel", contactRole: "Growth Lead", contactEmail: "asha@acme.example", logo: "",
  website: "https://acme.example", businessSocialUrl: "", industry: "Technology", companySize: "11-50", country: "India", companyRegistrationText: "",
  notes: "Acme builds useful consumer technology and partners with trusted creators for educational launches.", displayPublicly: false, termsAccepted: true,
} as const;
const storedBrand = { ...brand, termsAcceptedAt: new Date("2026-01-01T00:00:00Z") };

test("creator empty payload produces structured validation fields", () => { const parsed = creatorOnboardingSchema.safeParse({}); expect(parsed.success).toBe(false); if (!parsed.success) expect(Object.keys(parsed.error.flatten().fieldErrors).length).toBeGreaterThan(5); });
for (const [label, changes] of [
  ["missing name", { name: "   " }], ["missing username", { username: "" }], ["invalid username", { username: "bad-name" }],
  ["trimmed bio below 50", { bio: "                                      short                                      " }],
  ["missing niche", { niche: [] }], ["missing language", { languages: [] }], ["missing country", { country: " " }], ["missing availability", { availabilityStatus: undefined }],
] as const) test(`creator rejects ${label}`, () => expect(creatorOnboardingSchema.safeParse({ ...creator, ...changes }).success).toBe(false));

for (const [label, changes] of [
  ["platform without URL", { profileUrl: "" }], ["platform without audience", { audienceCount: undefined }], ["zero audience", { audienceCount: 0 }],
  ["negative audience", { audienceCount: -2 }], ["decimal audience", { audienceCount: 1.5 }], ["malformed URL", { profileUrl: "not-a-url" }],
  ["HTTP URL", { profileUrl: "http://instagram.com/a" }], ["private URL", { profileUrl: "https://127.0.0.1/a" }], ["incorrect known-platform domain", { profileUrl: "https://example.com/a" }],
] as const) test(`creator rejects ${label}`, () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account(changes)] }).success).toBe(false));

test("creator intentionally coerces a positive numeric audience string", () => { const parsed = creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account({ audienceCount: "1200" })] }); expect(parsed.success).toBe(true); if (parsed.success) expect(parsed.data.platformAccounts[0].audienceCount).toBe(1200); });
test("creator rejects duplicate normalized platform URLs", () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account(), account({ id: "second", profileUrl: "https://www.instagram.com/creatorname/", isPrimary: false })] }).success).toBe(false));
test("creator rejects no primary account", () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account({ isPrimary: false })] }).success).toBe(false));
test("creator rejects multiple primary accounts", () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account(), account({ id: "second", profileUrl: "https://instagram.com/second" })] }).success).toBe(false));

for (const [label, platformAccount] of [
  ["Instagram-only", account()], ["Kick-only", account({ platform: "kick", profileUrl: "https://kick.com/creatorname" })],
  ["YouTube-only", account({ platform: "youtube", profileUrl: "https://youtube.com/@creatorname", audienceType: "subscribers" })],
  ["Other-only", account({ platform: "other", customPlatformName: "PeerTube", profileUrl: "https://video.example/creatorname", audienceType: "members" })],
] as const) test(`creator accepts ${label} without requiring another platform`, () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [platformAccount] }).success).toBe(true));

test("creator rejects Other without a custom platform name", () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account({ platform: "other", customPlatformName: "", profileUrl: "https://video.example/a", audienceType: "members" })] }).success).toBe(false));
test("creator rejects Other without an audience type", () => expect(creatorOnboardingSchema.safeParse({ ...creator, platformAccounts: [account({ platform: "other", customPlatformName: "PeerTube", profileUrl: "https://video.example/a", audienceType: undefined })] }).success).toBe(false));
test("creator accepts a positive starting price", () => expect(creatorOnboardingSchema.safeParse({ ...creator, pricingChoice: "starting_price", sponsorshipRate: 5000 }).success).toBe(true));
test("creator accepts contact pricing without manufacturing a positive price", () => { const parsed = creatorOnboardingSchema.safeParse(creator); expect(parsed.success).toBe(true); if (parsed.success) expect(parsed.data.sponsorshipRate).toBe(0); });
test("creator rejects no explicit pricing choice", () => expect(creatorOnboardingSchema.safeParse({ ...creator, pricingChoice: undefined }).success).toBe(false));
test("creator rejects a numeric price with contact pricing", () => expect(creatorOnboardingSchema.safeParse({ ...creator, sponsorshipRate: 1 }).success).toBe(false));

test("creator strips forged completion, publication, verification, audience-total and founding fields", () => {
  const parsed = creatorOnboardingSchema.safeParse({ ...creator, isComplete: true, completionPercentage: 100, missingFields: [], blockingFields: [], onboardingComplete: true, onboardingCompletedAt: new Date(), isPublished: true, publicVisibility: true, isVerified: true, topAudienceCount: 99_999_999, foundingCreator: { number: 1 }, verification: { status: "verified" } });
  expect(parsed.success).toBe(true);
  if (parsed.success) for (const key of ["isComplete", "completionPercentage", "missingFields", "blockingFields", "onboardingComplete", "onboardingCompletedAt", "isPublished", "publicVisibility", "isVerified", "topAudienceCount", "foundingCreator", "verification"]) expect(parsed.data).not.toHaveProperty(key);
});
test("creator evaluator derives complete metadata and revalidates stored known-platform domains", () => { expect(evaluateCreatorProfileCompleteness(storedCreator, creatorUser)).toEqual({ isComplete: true, completionPercentage: 100, missingFields: [], blockingFields: [] }); expect(evaluateCreatorProfileCompleteness({ ...storedCreator, platformAccounts: [account({ profileUrl: "https://example.com/a", normalizedProfileUrl: "https://example.com/a", verification: { status: "unverified" } })] }, creatorUser).isComplete).toBe(false); });
for (const [label, changes] of [
  ["cleared identity", { bio: "" }], ["final platform removed", { platformAccounts: [] }],
  ["final audience set to zero", { platformAccounts: [account({ audienceCount: 0, normalizedProfileUrl: "https://instagram.com/creatorname", verification: { status: "unverified" } })] }],
  ["all niches removed", { niche: [] }], ["all languages removed", { languages: [] }],
] as const) test(`creator edit eligibility rejects ${label}`, () => expect(evaluateCreatorProfileCompleteness({ ...storedCreator, ...changes }, creatorUser).isComplete).toBe(false));
test("creator route validates before any user/profile upsert and recalculates metadata on valid writes", () => { expect(creatorRoute.indexOf("creatorOnboardingSchema.safeParse")).toBeLessThan(creatorRoute.indexOf("ScopedUser.findOneAndUpdate")); expect(creatorRoute.indexOf("if (!completion.isComplete)")).toBeLessThan(creatorRoute.indexOf("ScopedUser.findOneAndUpdate")); expect(creatorRoute).toContain("...completionWriteFields(completion)"); expect(creatorRoute).toContain("onboardingRoleFilter(userId, \"creator\")"); });

test("brand empty payload produces structured validation fields", () => { const parsed = brandOnboardingSchema.safeParse({}); expect(parsed.success).toBe(false); if (!parsed.success) expect(Object.keys(parsed.error.flatten().fieldErrors).length).toBeGreaterThan(5); });
for (const [label, changes] of [
  ["company name", { companyName: "" }], ["username", { username: "" }], ["invalid username", { username: "bad-name" }], ["50-character description", { notes: " short " }],
  ["industry", { industry: "" }], ["country", { country: "" }], ["company size", { companySize: "" }], ["representative name", { contactName: "" }],
  ["representative role", { contactRole: "" }], ["visibility choice", { displayPublicly: undefined }], ["consent", { termsAccepted: undefined }],
] as const) test(`brand rejects missing/invalid ${label}`, () => expect(brandOnboardingSchema.safeParse({ ...brand, ...changes }).success).toBe(false));
test("brand rejects missing website and business social link", () => expect(brandOnboardingSchema.safeParse({ ...brand, website: "", businessSocialUrl: "" }).success).toBe(false));
for (const link of ["not-a-url", "http://acme.example", "https://localhost/company", "https://127.0.0.1/company"]) test(`brand rejects unsafe business link ${link}`, () => expect(brandOnboardingSchema.safeParse({ ...brand, website: link }).success).toBe(false));
test("brand accepts a public business social profile instead of a website", () => expect(brandOnboardingSchema.safeParse({ ...brand, website: "", businessSocialUrl: "https://linkedin.com/company/acme" }).success).toBe(true));
test("brand accepts complete private and complete public visibility choices", () => { expect(brandOnboardingSchema.safeParse(brand).success).toBe(true); expect(brandOnboardingSchema.safeParse({ ...brand, displayPublicly: true }).success).toBe(true); });
test("brand strips forged completion, verification and publication fields", () => { const parsed = brandOnboardingSchema.safeParse({ ...brand, profileComplete: true, completionPercentage: 100, isVerified: true, isPublished: true, publicVisibility: true, onboardingComplete: true }); expect(parsed.success).toBe(true); if (parsed.success) for (const key of ["profileComplete", "completionPercentage", "isVerified", "isPublished", "publicVisibility", "onboardingComplete"]) expect(parsed.data).not.toHaveProperty(key); });
test("brand evaluator requires explicit consent and derives completion independently of visibility", () => { expect(evaluateBrandProfileCompleteness(storedBrand, brand).isComplete).toBe(true); expect(evaluateBrandProfileCompleteness({ ...storedBrand, termsAccepted: false, termsAcceptedAt: null }, brand).isComplete).toBe(false); expect(evaluateBrandProfileCompleteness({ ...storedBrand, displayPublicly: true }, brand).isComplete).toBe(true); });
test("brand edit eligibility rejects destructive changes", () => { for (const changes of [{ companyName: "" }, { notes: "short" }, { contactRole: "" }, { website: "", businessSocialUrl: "" }]) expect(evaluateBrandProfileCompleteness({ ...storedBrand, ...changes }, brand).isComplete).toBe(false); });
test("brand route validates before account mutation and persists server-derived completion", () => { expect(brandRoute.indexOf("brandOnboardingSchema.safeParse")).toBeLessThan(brandRoute.indexOf("ScopedUser.findOneAndUpdate")); expect(brandRoute.indexOf("if (!completion.isComplete)")).toBeLessThan(brandRoute.indexOf("ScopedUser.findOneAndUpdate")); expect(brandRoute).toContain("...completionWriteFields(completion)"); });

const creatorMatches = sift(CREATOR_DISCOVERY_COMPLETENESS_FILTER);
const brandMatches = sift(BRAND_DISCOVERY_COMPLETENESS_FILTER);
test("complete and complete legacy creators match discovery without trusting stored status", () => { expect(creatorMatches({ ...storedCreator, profileComplete: true })).toBe(true); expect(creatorMatches(storedCreator)).toBe(true); });
test("incomplete creator is suppressed even with stale profileComplete true", () => expect(creatorMatches({ ...storedCreator, profileComplete: true, bio: "short" })).toBe(false));
test("legacy incomplete creator without metadata is suppressed", () => expect(creatorMatches({ ...storedCreator, profileComplete: undefined, platformAccounts: [] })).toBe(false));
test("complete public brand matches, private brand fails the public visibility query, and incomplete stale brand is suppressed", () => { expect(brandMatches({ ...storedBrand, displayPublicly: true })).toBe(true); expect(sift({ displayPublicly: true, ...BRAND_DISCOVERY_COMPLETENESS_FILTER })({ ...storedBrand, displayPublicly: false })).toBe(false); expect(brandMatches({ ...storedBrand, profileComplete: true, notes: "short" })).toBe(false); });
test("legacy complete brand with explicit historical consent matches while legacy incomplete brand is suppressed", () => { expect(brandMatches({ ...storedBrand, profileComplete: undefined })).toBe(true); expect(brandMatches({ ...storedBrand, profileComplete: undefined, website: "", businessSocialUrl: "" })).toBe(false); });
test("all creator discovery, featured, saved and public lookup paths share the database filter", () => { expect(creatorQueries).toContain("const profileMatch: Record<string, unknown>[] = [CREATOR_DISCOVERY_COMPLETENESS_FILTER]"); expect(creatorQueries).toContain("const andClauses: Record<string, unknown>[] = [CREATOR_DISCOVERY_COMPLETENESS_FILTER]"); expect(creatorQueries).toContain("getFeaturedCreators"); expect(creatorQueries).toContain("getSavedCreatorsForBrand"); expect(creatorQueries).toContain("...CREATOR_DISCOVERY_COMPLETENESS_FILTER"); });
test("brand directory, featured data source and public lookup apply completeness plus visibility", () => { expect(brandQueries).toContain("displayPublicly: true, ...BRAND_DISCOVERY_COMPLETENESS_FILTER"); expect(source("lib/queries/public.ts")).toContain("getPublicBrands(6)"); });

test("new collaboration API gates both profiles while existing collaboration access remains separate", () => { expect(inquiryRoute).toContain("evaluateBrandProfileCompleteness"); expect(inquiryRoute).toContain("evaluateCreatorProfileCompleteness"); expect(inquiryRoute).toContain("PROFILE_INCOMPLETE"); expect(source("lib/collaboration-access.ts")).not.toContain("evaluateCreatorProfileCompleteness"); });
test("private complete brand eligibility does not depend on public visibility", () => expect(evaluateBrandProfileCompleteness(storedBrand, brand).isComplete).toBe(true));
test("public creator presentation contains no prohibited incomplete placeholders", () => { for (const text of ["Not added yet", "Stats pending", "Complete profile", "Pricing not set"]) { expect(creatorCard).not.toContain(text); expect(creatorPage).not.toContain(text); } });
test("contact pricing renders exactly and optional metric tiles are conditional", () => { expect(creatorCard).toContain('"Contact for pricing"'); expect(creatorPage).toContain('"Contact for pricing"'); expect(creatorCard).toContain("...(averageViews > 0 ?"); expect(creatorCard).toContain("...(engagement > 0 ?"); expect(creatorPage).toContain("publicAverageViews > 0 ?"); expect(creatorPage).toContain("publicEngagementRate > 0 ?"); });
test("platform audience terminology remains account-driven", () => { expect(creatorCard).toContain("topAccount.audienceType"); expect(creatorCard).toContain("audienceLabel"); });
