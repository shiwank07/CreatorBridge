import { z } from "zod";

import { CREATOR_AVAILABILITY_STATUSES } from "@/lib/availability";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { normalizePlatformUrl, platformAccountInputSchema } from "@/lib/creator-platforms";

const urlish = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Use a full URL beginning with http or https.");

export const creatorOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or less.")
    .regex(/^[a-z0-9]+$/, "Username can only contain lowercase letters and numbers."),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .transform((value) => normalizePhoneNumber(value))
    .refine(isValidPhoneNumber, "Enter a valid phone number, including country code if needed."),
  avatar: urlish.refine((value) => Boolean(value), "Add a profile image."),
  bio: z.string().trim().min(50, "Bio should be at least 50 characters.").max(500),
  niche: z.array(z.string().trim().min(1)).min(1, "Choose at least one niche.").max(5),
  country: z.string().trim().min(2, "Country is required.").max(80),
  languages: z.array(z.string().trim().min(1)).min(1, "Add at least one language.").max(8),
  platformAccounts: z.array(platformAccountInputSchema).max(20).optional().default([]),
  youtubeUrl: urlish,
  youtubeHandle: z.string().trim().max(60).optional().default(""),
  subscribers: z.coerce.number().int().nonnegative().optional().default(0),
  avgViews: z.coerce.number().int().nonnegative().optional().default(0),
  engagementRate: z.coerce.number().nonnegative().max(100, "Engagement must be 100% or less.").optional().default(0),
  instagramUrl: urlish,
  instagramFollowers: z.coerce.number().int().nonnegative().optional().default(0),
  podcastUrl: urlish,
  pricingChoice: z.enum(["starting_price", "contact_for_pricing"]),
  sponsorshipRate: z.coerce.number().int().nonnegative().optional().default(0),
  rateType: z.enum(["per_video", "per_post", "per_campaign"]).default("per_video"),
  pastBrands: z.array(z.string().trim().min(1)).max(12).default([]),
  sampleWorkUrls: z.array(z.string().trim().url()).max(8).default([]),
  availabilityStatus: z.enum(CREATOR_AVAILABILITY_STATUSES),
  isOpenToDeals: z.boolean().default(true),
  upiId: z.string().trim().max(120).optional().default(""),
  paypalEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid PayPal email."),
  bankAccountName: z.string().trim().max(120).optional().default(""),
  bankAccountNumber: z.string().trim().max(40).optional().default(""),
  ifsc: z.string().trim().toUpperCase().max(20).optional().default(""),
  preferredPaymentNote: z.string().trim().max(500).optional().default(""),
}).superRefine((value, context) => {
  if (!value.platformAccounts.length && !value.youtubeUrl && !value.instagramUrl && !value.podcastUrl) context.addIssue({ code: "custom", path: ["platformAccounts"], message: "Add at least one platform account." });
  const normalized = value.platformAccounts.flatMap((account) => { try { return [normalizePlatformUrl(account.profileUrl)]; } catch { return []; } });
  if (new Set(normalized).size !== normalized.length) context.addIssue({ code: "custom", path: ["platformAccounts"], message: "Each platform profile URL must be unique." });
  if (value.platformAccounts.length && value.platformAccounts.filter((account) => account.isPrimary).length !== 1) context.addIssue({ code: "custom", path: ["platformAccounts"], message: "Choose exactly one primary platform account." });
  if (value.pricingChoice === "starting_price" && value.sponsorshipRate <= 0) context.addIssue({ code: "custom", path: ["sponsorshipRate"], message: "Enter a positive starting price or choose Contact for pricing." });
  if (value.pricingChoice === "contact_for_pricing" && value.sponsorshipRate !== 0) context.addIssue({ code: "custom", path: ["sponsorshipRate"], message: "Do not send a numeric price when Contact for pricing is selected." });
});

export type CreatorOnboardingInput = z.infer<typeof creatorOnboardingSchema>;
