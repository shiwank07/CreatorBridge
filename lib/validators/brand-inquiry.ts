import { z } from "zod";

import { COLLABORATION_STATUSES } from "@/lib/collaborations";

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
  deliverables: z.array(z.string().trim().min(1)).min(1, "Choose at least one deliverable.").max(8),
  targetNiches: z.array(z.string().trim().min(1)).min(1, "Choose at least one niche.").max(6),
  targetPlatforms: z.array(z.string().trim().min(1)).min(1, "Choose at least one platform.").max(4),
  budgetRange: z.string().trim().min(1, "Choose a budget range."),
  initialOfferAmount: z.coerce.number().int("Enter a whole INR amount.").positive("Enter the exact initial offer amount."),
  isNegotiable: z.boolean().default(true),
  timeline: z.string().trim().min(2, "Timeline is required.").max(120),
  message: z.string().trim().max(1500).optional().default(""),
  creatorUsername: z.string().trim().toLowerCase().max(40).optional().default(""),
});

export const inquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(COLLABORATION_STATUSES),
});

export const creatorResponseSchema = z
  .object({
    action: z.enum(["accept_offer", "decline_offer", "request_revision", "interested", "decline"]),
    note: z.string().trim().max(1000).optional().default(""),
    counterOfferAmount: z.coerce.number().int("Enter a whole INR amount.").positive("Enter the counter offer amount.").optional(),
    counterOfferNote: z.string().trim().max(1000).optional().default(""),
  })
  .refine((value) => value.action !== "request_revision" || Boolean(value.counterOfferAmount), {
    message: "Enter the counter offer amount.",
    path: ["counterOfferAmount"],
  })
  .refine((value) => value.action !== "request_revision" || value.counterOfferNote.length >= 2, {
    message: "Add a note explaining the requested revision.",
    path: ["counterOfferNote"],
  });

export const brandResponseSchema = z
  .object({
    action: z.enum(["accept_counter", "send_revised_offer", "decline_negotiation"]),
    revisedOfferAmount: z.coerce.number().int("Enter a whole INR amount.").positive("Enter the revised offer amount.").optional(),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine((value) => value.action !== "send_revised_offer" || Boolean(value.revisedOfferAmount), {
    message: "Enter the revised offer amount.",
    path: ["revisedOfferAmount"],
  });

export const deliveryProofSchema = z.object({
  videoUrl: z.string().trim().url("Enter a valid video URL.").max(500),
  timestampStart: z.string().trim().min(1, "Add the proof start timestamp.").max(40),
  timestampEnd: z.string().trim().min(1, "Add the proof end timestamp.").max(40),
  notes: z.string().trim().min(2, "Add a short note for the brand.").max(1000),
  screenshotUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Use a full screenshot URL beginning with http or https."),
  referenceLink: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Use a full reference link beginning with http or https."),
});

export const deliveryReviewSchema = z
  .object({
    action: z.enum(["approve_delivery", "request_changes", "report_issue", "mark_completed"]),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine((value) => value.action !== "request_changes" || value.note.length >= 2, {
    message: "Add a note explaining the requested changes.",
    path: ["note"],
  })
  .refine((value) => value.action !== "report_issue" || value.note.length >= 2, {
    message: "Add a note describing the issue.",
    path: ["note"],
  });

export type BrandInquiryInput = z.infer<typeof brandInquirySchema>;
