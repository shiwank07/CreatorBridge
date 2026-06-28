import { z } from "zod";

export const brandInquirySchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required.").max(120),
  contactName: z.string().trim().min(2, "Contact name is required.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  website: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Use a full URL beginning with http or https."),
  campaignGoal: z.string().trim().min(20, "Tell us a little more about the campaign.").max(1000),
  targetNiches: z.array(z.string().trim().min(1)).min(1, "Choose at least one niche.").max(6),
  targetPlatforms: z.array(z.string().trim().min(1)).min(1, "Choose at least one platform.").max(4),
  budgetRange: z.string().trim().min(1, "Choose a budget range."),
  timeline: z.string().trim().min(2, "Timeline is required.").max(120),
  message: z.string().trim().max(1500).optional().default(""),
  creatorUsername: z.string().trim().toLowerCase().max(40).optional().default(""),
});

export const inquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "reviewed", "contacted", "sent_to_creator", "creator_interested", "creator_declined", "rejected", "closed"]),
});

export type BrandInquiryInput = z.infer<typeof brandInquirySchema>;
