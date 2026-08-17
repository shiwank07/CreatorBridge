import { z } from "zod";

export const PLATFORM_KINDS = ["youtube", "instagram", "facebook", "tiktok", "x", "twitch", "kick", "linkedin", "snapchat", "pinterest", "podcast", "other"] as const;
export const AUDIENCE_TYPES = ["followers", "subscribers", "listeners", "members"] as const;
export const PLATFORM_VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected"] as const;
export type PlatformKind = (typeof PLATFORM_KINDS)[number];
export type AudienceType = (typeof AUDIENCE_TYPES)[number];
export type PlatformVerificationStatus = (typeof PLATFORM_VERIFICATION_STATUSES)[number];

export type CreatorPlatformAccount = {
  id: string;
  platform: PlatformKind;
  customPlatformName?: string;
  profileUrl: string;
  normalizedProfileUrl: string;
  handle?: string;
  audienceType: AudienceType;
  audienceCount: number;
  averageViews?: number;
  engagementRate?: number;
  isPrimary: boolean;
  verification: { status: PlatformVerificationStatus; method?: "bio_code" | "manual_admin" | "legacy"; verifiedAt?: Date | string | null; verifiedBy?: string; rejectedAt?: Date | string | null; rejectedBy?: string; rejectionReason?: string };
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export const PLATFORM_DEFINITIONS: Record<PlatformKind, { label: string; audienceType: AudienceType; domains?: string[] }> = {
  youtube: { label: "YouTube", audienceType: "subscribers", domains: ["youtube.com", "youtu.be"] },
  instagram: { label: "Instagram", audienceType: "followers", domains: ["instagram.com"] },
  facebook: { label: "Facebook", audienceType: "followers", domains: ["facebook.com", "fb.com"] },
  tiktok: { label: "TikTok", audienceType: "followers", domains: ["tiktok.com"] },
  x: { label: "X", audienceType: "followers", domains: ["x.com", "twitter.com"] },
  twitch: { label: "Twitch", audienceType: "followers", domains: ["twitch.tv"] },
  kick: { label: "Kick", audienceType: "followers", domains: ["kick.com"] },
  linkedin: { label: "LinkedIn", audienceType: "followers", domains: ["linkedin.com"] },
  snapchat: { label: "Snapchat", audienceType: "followers", domains: ["snapchat.com"] },
  pinterest: { label: "Pinterest", audienceType: "followers", domains: ["pinterest.com", "pin.it"] },
  podcast: { label: "Podcast", audienceType: "listeners" },
  other: { label: "Other", audienceType: "followers" },
};

const privateIpv4 = /^(?:localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i;
export function normalizePlatformUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "https:") throw new Error("Profile URL must use HTTPS.");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (privateIpv4.test(host) || host === "::1" || host.endsWith(".local")) throw new Error("Profile URL must be public.");
  url.hostname = host;
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().toLowerCase();
}

export const platformAccountInputSchema = z.object({
  id: z.string().trim().max(80).optional(),
  platform: z.enum(PLATFORM_KINDS),
  customPlatformName: z.string().trim().max(50).optional().default(""),
  profileUrl: z.string().trim().max(500),
  handle: z.string().trim().max(80).optional().default(""),
  audienceType: z.enum(AUDIENCE_TYPES),
  audienceCount: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  averageViews: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  engagementRate: z.coerce.number().min(0).max(100).optional(),
  isPrimary: z.boolean().default(false),
}).superRefine((account, context) => {
  let normalized: URL;
  try { normalized = new URL(normalizePlatformUrl(account.profileUrl)); } catch (error) {
    context.addIssue({ code: "custom", path: ["profileUrl"], message: error instanceof Error ? error.message : "Enter a valid public HTTPS URL." }); return;
  }
  const allowed = PLATFORM_DEFINITIONS[account.platform].domains;
  if (allowed && !allowed.some((domain) => normalized.hostname === domain || normalized.hostname.endsWith(`.${domain}`))) context.addIssue({ code: "custom", path: ["profileUrl"], message: `Use an official ${PLATFORM_DEFINITIONS[account.platform].label} URL.` });
  if (account.platform === "other" && account.customPlatformName.length < 2) context.addIssue({ code: "custom", path: ["customPlatformName"], message: "Enter the platform name." });
  if (account.platform !== "other" && account.audienceType !== PLATFORM_DEFINITIONS[account.platform].audienceType) context.addIssue({ code: "custom", path: ["audienceType"], message: `Use ${PLATFORM_DEFINITIONS[account.platform].audienceType}.` });
});

export function preparePlatformAccounts(input: z.infer<typeof platformAccountInputSchema>[], trustedExistingIds: ReadonlySet<string> = new Set()) {
  const accounts = input.map((raw) => ({ ...raw, id: raw.id && trustedExistingIds.has(raw.id) ? raw.id : crypto.randomUUID(), customPlatformName: raw.platform === "other" ? raw.customPlatformName : "", normalizedProfileUrl: normalizePlatformUrl(raw.profileUrl), verification: { status: "unverified" as const }, isPrimary: raw.isPrimary, createdAt: new Date(), updatedAt: new Date() }));
  const duplicate = accounts.find((account, index) => accounts.findIndex((candidate) => candidate.normalizedProfileUrl === account.normalizedProfileUrl) !== index);
  if (duplicate) throw new Error("Each platform profile URL must be unique.");
  const primary = accounts.findIndex((account) => account.isPrimary);
  return accounts.map((account, index) => ({ ...account, isPrimary: index === (primary < 0 ? 0 : primary) }));
}

export function deriveAudience(accounts: CreatorPlatformAccount[]) {
  const sorted = [...accounts].sort((a, b) => b.audienceCount - a.audienceCount || a.normalizedProfileUrl.localeCompare(b.normalizedProfileUrl));
  const verified = sorted.filter((account) => account.verification.status === "verified");
  return { topAudienceCount: sorted[0]?.audienceCount ?? 0, topAudienceAccountId: sorted[0]?.id ?? "", topAudiencePlatform: sorted[0]?.platform, topVerifiedAudienceCount: verified[0]?.audienceCount ?? 0, topVerifiedAudienceAccountId: verified[0]?.id ?? "", topVerifiedAudiencePlatform: verified[0]?.platform, isVerifiedCreator: verified.length > 0 };
}

export function createCollaborationPlatformSnapshot(profile: Record<string, unknown>, eligiblePlatforms: string[] = []) {
  const accounts = legacyPlatformAccounts(profile);
  const eligible = eligiblePlatforms.length ? accounts.filter((account) => eligiblePlatforms.includes(account.platform) || (account.platform === "other" && eligiblePlatforms.includes("other"))) : accounts;
  const account = [...eligible].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.audienceCount - a.audienceCount || a.id.localeCompare(b.id))[0];
  if (!account) return undefined;
  return { platformAccountId: account.id, platform: account.platform, customPlatformName: account.customPlatformName ?? "", handle: account.handle ?? "", profileUrl: account.profileUrl, audienceType: account.audienceType, audienceCount: account.audienceCount, averageViews: account.averageViews, engagementRate: account.engagementRate, verificationStatus: account.verification.status, capturedAt: new Date() };
}

export function legacyPlatformAccounts(profile: Record<string, unknown>): CreatorPlatformAccount[] {
  if (Array.isArray(profile.platformAccounts) && profile.platformAccounts.length) return profile.platformAccounts as CreatorPlatformAccount[];
  const status: PlatformVerificationStatus = ["verified", "ownership_verified", "stats_verified"].includes(String(profile.verificationStatus)) ? "verified" : "unverified";
  const rows: Array<Omit<CreatorPlatformAccount, "id" | "normalizedProfileUrl" | "isPrimary">> = [];
  const count = (value: unknown) => { const number = Number(value ?? 0); return Number.isSafeInteger(number) && number >= 0 ? number : 0; };
  const metric = (value: unknown) => { const number = Number(value ?? 0); return Number.isFinite(number) && number >= 0 ? number : 0; };
  if (profile.youtubeUrl) rows.push({ platform: "youtube", profileUrl: String(profile.youtubeUrl), handle: String(profile.youtubeHandle ?? ""), audienceType: "subscribers", audienceCount: count(profile.claimedSubscribers ?? profile.subscribers), averageViews: count(profile.claimedAverageViews ?? profile.avgViews), engagementRate: Math.min(metric(profile.claimedEngagementRate), 100), verification: { status, method: "legacy" } });
  if (profile.instagramUrl) rows.push({ platform: "instagram", profileUrl: String(profile.instagramUrl), audienceType: "followers", audienceCount: count(profile.instagramFollowers), verification: { status: "unverified", method: "legacy" } });
  if (profile.podcastUrl) rows.push({ platform: "podcast", profileUrl: String(profile.podcastUrl), audienceType: "listeners", audienceCount: 0, verification: { status: "unverified", method: "legacy" } });
  return rows.flatMap((row, index) => { try { return [{ ...row, id: `legacy-${row.platform}`, normalizedProfileUrl: normalizePlatformUrl(row.profileUrl), isPrimary: index === 0 }]; } catch { return []; } });
}
