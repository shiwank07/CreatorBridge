import { z } from "zod";

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
  avatar: urlish,
  bio: z.string().trim().min(30, "Bio should be at least 30 characters.").max(500),
  niche: z.array(z.string().trim().min(1)).min(1, "Choose at least one niche.").max(5),
  country: z.string().trim().min(2, "Country is required.").max(80),
  languages: z.array(z.string().trim().min(1)).min(1, "Add at least one language.").max(8),
  youtubeUrl: urlish,
  youtubeHandle: z.string().trim().max(60).optional().default(""),
  subscribers: z.coerce.number().int().nonnegative().optional().default(0),
  avgViews: z.coerce.number().int().nonnegative().optional().default(0),
  instagramUrl: urlish,
  instagramFollowers: z.coerce.number().int().nonnegative().optional().default(0),
  podcastUrl: urlish,
  sponsorshipRate: z.coerce.number().int().nonnegative().optional().default(0),
  rateType: z.enum(["per_video", "per_post", "per_campaign"]).default("per_video"),
  pastBrands: z.array(z.string().trim().min(1)).max(12).default([]),
  sampleWorkUrls: z.array(z.string().trim().url()).max(8).default([]),
  isOpenToDeals: z.boolean().default(true),
});

export type CreatorOnboardingInput = z.infer<typeof creatorOnboardingSchema>;
