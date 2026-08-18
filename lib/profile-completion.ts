import { type BrandInquiryData, type BrandProfileData, type CreatorCardData } from "@/lib/types";
import { legacyPlatformAccounts, normalizePlatformUrl, platformAccountInputSchema } from "@/lib/creator-platforms";

export type ProfileEligibilityResult = {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  blockingFields: string[];
};

type UnknownRecord = Record<string, unknown>;

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function list(value: unknown) { return Array.isArray(value) ? value.filter((item) => text(item)) : []; }
function usableImage(value: unknown) {
  const image = text(value);
  if (!image) return false;
  try { const url = new URL(image); return url.protocol === "https:"; } catch { return image.startsWith("/uploads/") || image.startsWith("/media/"); }
}
function publicHttpsUrl(value: unknown) {
  try { const url = new URL(text(value)); return url.protocol === "https:" && Boolean(url.hostname) && !["localhost", "127.0.0.1", "::1"].includes(url.hostname); } catch { return false; }
}

/** Authoritative creator marketplace eligibility. Verification and profile strength are intentionally independent. */
export function evaluateCreatorProfileCompleteness(profile: UnknownRecord | null | undefined, user: UnknownRecord = {}): ProfileEligibilityResult {
  const accounts = profile ? legacyPlatformAccounts(profile) : [];
  const exactlyOnePrimary = accounts.length > 0 && accounts.filter((account) => account.isPrimary).length === 1;
  const normalizedUrls = accounts.flatMap((account) => { try { return [normalizePlatformUrl(account.profileUrl)]; } catch { return []; } });
  const completeAccounts = accounts.length > 0 && accounts.every((account) => Boolean(text(account.id)) && platformAccountInputSchema.safeParse(account).success) && normalizedUrls.length === accounts.length && new Set(normalizedUrls).size === accounts.length;
  const checks: Array<[string, boolean, number]> = [
    ["creator.name", text(user.name).length >= 2, 5], ["creator.username", /^[a-z0-9]{3,24}$/.test(text(user.username)), 5],
    ["creator.profile_image", usableImage(user.avatar), 5], ["creator.bio", text(profile?.bio).length >= 50, 10],
    ["creator.niches", list(profile?.niche).length > 0, 7], ["creator.languages", list(profile?.languages).length > 0, 7],
    ["creator.country", text(profile?.country).length >= 2, 6], ["creator.availability", ["open_to_deals", "limited_availability", "unavailable", "closed"].includes(text(profile?.availabilityStatus)), 5],
    ["creator.platform_accounts", completeAccounts, 25], ["creator.primary_platform", exactlyOnePrimary, 10],
    ["creator.pricing", profile?.pricingChoice === "contact_for_pricing" || ((profile?.pricingChoice === "starting_price" || profile?.pricingChoice == null) && Number(profile?.sponsorshipRate) > 0), 15],
  ];
  const missingFields = checks.filter(([, done]) => !done).map(([code]) => code);
  const completionPercentage = checks.reduce((sum, [, done, weight]) => sum + (done ? weight : 0), 0);
  return { isComplete: missingFields.length === 0, completionPercentage, missingFields, blockingFields: missingFields };
}

/** Authoritative brand marketplace eligibility. Public visibility remains an independent opt-in. */
export function evaluateBrandProfileCompleteness(profile: UnknownRecord | null | undefined, user: UnknownRecord = {}): ProfileEligibilityResult {
  const checks: Array<[string, boolean, number]> = [
    ["brand.company_name", text(profile?.companyName).length >= 2, 8], ["brand.username", /^[a-z0-9]{3,24}$/.test(text(user.username)), 7],
    ["brand.description", text(profile?.notes).length >= 50, 15], ["brand.industry", text(profile?.industry).length >= 2, 8],
    ["brand.country", text(profile?.country).length >= 2, 7], ["brand.company_size", Boolean(text(profile?.companySize)), 8],
    ["brand.business_link", publicHttpsUrl(profile?.website) || publicHttpsUrl(profile?.businessSocialUrl), 15],
    ["brand.representative_name", text(profile?.contactName).length >= 2, 7], ["brand.representative_role", text(profile?.contactRole).length >= 2, 7],
    ["brand.visibility_choice", typeof profile?.displayPublicly === "boolean", 8], ["brand.terms", profile?.termsAccepted === true || Boolean(profile?.termsAcceptedAt), 10],
  ];
  const missingFields = checks.filter(([, done]) => !done).map(([code]) => code);
  const completionPercentage = checks.reduce((sum, [, done, weight]) => sum + (done ? weight : 0), 0);
  return { isComplete: missingFields.length === 0, completionPercentage, missingFields, blockingFields: missingFields };
}

export function completionWriteFields(result: ProfileEligibilityResult) {
  return { profileComplete: result.isComplete, completionPercentage: result.completionPercentage, completionMissingFields: result.missingFields, completionEvaluatedAt: new Date() };
}

export type ProfileCompletionItem = {
  key: string;
  label: string;
  done: boolean;
  helper: string;
  weight: number;
};

export type ProfileCompletionResult = {
  percent: number;
  completedCount: number;
  totalCount: number;
  completedItems: ProfileCompletionItem[];
  remainingItems: ProfileCompletionItem[];
  items: ProfileCompletionItem[];
};

type CreatorCompletionInput = {
  creator: CreatorCardData | null;
  emailVerified?: boolean;
};

type BrandCompletionInput = {
  brand: BrandProfileData | null;
  emailVerified?: boolean;
  collaborations?: BrandInquiryData[];
};

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function hasPositiveNumber(value?: number | null) {
  return typeof value === "number" && value > 0;
}

function summarize(items: ProfileCompletionItem[]): ProfileCompletionResult {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  const completedItems = items.filter((item) => item.done);
  const remainingItems = items.filter((item) => !item.done);

  return {
    percent: totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0,
    completedCount: completedItems.length,
    totalCount: items.length,
    completedItems,
    remainingItems,
    items,
  };
}

export function calculateCreatorProfileCompletion({
  creator,
  emailVerified = false,
}: CreatorCompletionInput): ProfileCompletionResult {
  void emailVerified;
  const result = evaluateCreatorProfileCompleteness(creator as unknown as UnknownRecord, creator as unknown as UnknownRecord);
  const sections = [
    ["identity", "Identity and bio", ["creator.name", "creator.username", "creator.profile_image", "creator.bio"]],
    ["categories", "Niche, language, and location", ["creator.niches", "creator.languages", "creator.country"]],
    ["social", "Complete primary platform", ["creator.platform_accounts", "creator.primary_platform"]],
    ["availability", "Availability and pricing", ["creator.availability", "creator.pricing"]],
  ] as const;
  const items: ProfileCompletionItem[] = sections.map(([key, label, codes]) => ({ key, label, done: codes.every((code) => !result.missingFields.includes(code)), helper: `Complete ${label.toLowerCase()}.`, weight: 1 }));
  const summary = summarize(items);
  return { ...summary, percent: result.completionPercentage };
}

export function calculateBrandProfileCompletion({
  brand,
  emailVerified = false,
  collaborations = [],
}: BrandCompletionInput): ProfileCompletionResult {
  if (brand?.profileComplete === true) {
    const item = { key: "business", label: "Business information", done: true, helper: "Required business details are complete.", weight: 1 };
    return summarize([item]);
  }
  const hasBudgetContext = collaborations.some((collaboration) =>
    hasPositiveNumber(collaboration.currentOfferAmount ?? collaboration.initialOfferAmount),
  );
  const items: ProfileCompletionItem[] = [
    {
      key: "email",
      label: "Email verified",
      done: emailVerified,
      helper: "Use a reachable work email for brand contact and support.",
      weight: 10,
    },
    {
      key: "photo",
      label: "Profile photo",
      done: hasText(brand?.avatar),
      helper: "Use the account image or brand mark to make the workspace recognizable.",
      weight: 8,
    },
    {
      key: "bio",
      label: "Bio",
      done: hasText(brand?.notes) || hasText(brand?.companyRegistrationText),
      helper: "Add context about your company, campaign interests, or registration details.",
      weight: 10,
    },
    {
      key: "categories",
      label: "Categories",
      done: hasText(brand?.industry),
      helper: "Add the industry creators should associate with your brand.",
      weight: 10,
    },
    {
      key: "location",
      label: "Location",
      done: hasText(brand?.country),
      helper: "Add your primary country or market.",
      weight: 8,
    },
    {
      key: "pricing",
      label: "Pricing",
      done: hasBudgetContext,
      helper: "Send at least one collaboration with a clear offer amount.",
      weight: 10,
    },
    {
      key: "social",
      label: "Social links",
      done: hasText(brand?.website),
      helper: "Link the official brand website.",
      weight: 10,
    },
    {
      key: "availability",
      label: "Availability",
      done: Boolean(brand),
      helper: "Complete onboarding so creators know the brand workspace is active.",
      weight: 8,
    },
    {
      key: "portfolio",
      label: "Portfolio links",
      done: hasText(brand?.companyRegistrationText) || hasText(brand?.website),
      helper: "Add registration or website context to support brand trust review.",
      weight: 16,
    },
  ];

  return summarize(items);
}
