import { z } from "zod";

import { COLLABORATION_STATUSES } from "@/lib/collaborations";

const timelinePattern = /\b\d+\s*(day|days|week|weeks|month|months)\b/i;

export const brandInquirySchema = z
  .object({
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
    campaignTitle: z.string().trim().min(2, "Campaign title is required.").max(160),
    campaignType: z.string().trim().min(2, "Campaign type is required.").max(80),
    deadline: z.coerce.date().refine((value) => value.getTime() > Date.now(), "Deadline must be in the future."),
    attachments: z.array(z.string().trim().url("Attachment must be a valid URL.").max(500)).max(5).optional().default([]),
    deliverables: z.array(z.string().trim().min(1)).min(1, "Choose at least one deliverable.").max(8),
    targetNiches: z.array(z.string().trim().min(1)).min(1, "Choose at least one niche.").max(6),
    targetPlatforms: z.array(z.string().trim().min(1)).min(1, "Choose at least one platform.").max(4),
    customPlatformName: z.string().trim().max(80).optional().default(""),
    budgetRange: z.string().trim().optional().default(""),
    initialOfferAmount: z.coerce.number().int("Enter a whole INR amount.").positive("Enter the exact initial offer amount."),
    isNegotiable: z.boolean().default(false),
    timeline: z
      .string()
      .trim()
      .min(2, "Timeline is required.")
      .max(120)
      .refine((value) => timelinePattern.test(value), "Use a clear timeline, for example 2 weeks or 14 days."),
    message: z.string().trim().max(1500).optional().default(""),
    creatorUsername: z.string().trim().toLowerCase().max(40).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.targetPlatforms.includes("other") && value.customPlatformName.trim().length < 2) {
      context.addIssue({
        code: "custom",
        message: "Specify the other platform.",
        path: ["customPlatformName"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    customPlatformName: value.targetPlatforms.includes("other") ? value.customPlatformName.trim() : "",
  }));

export const collaborationPaymentSchema = z.object({
  action: z.enum(["mark_payment_sent", "mark_payment_received", "mark_payment_disputed"]),
  paymentNote: z.string().trim().max(1000).optional().default(""),
  transactionId: z.string().trim().max(120).optional().default(""),
  proofId: z.string().trim().optional().default(""),
}).refine((value) => value.action !== "mark_payment_sent" || /^[a-f\d]{24}$/i.test(value.proofId), { path: ["proofId"], message: "Upload one payment screenshot before marking payment as sent." });

export const inquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(COLLABORATION_STATUSES),
});

export const creatorResponseSchema = z
  .object({
    action: z.enum(["accept_offer", "decline_offer", "counter_offer", "interested", "decline"]),
    amount: z.coerce.number().int().positive().optional(),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine((value) => value.action !== "counter_offer" || Boolean(value.amount), {
    message: "Enter a positive counter-offer amount.",
    path: ["amount"],
  })
  .refine((value) => value.action !== "counter_offer" || value.note.length >= 2, {
    message: "Add a message with the counter offer.",
    path: ["note"],
  });

export const brandNegotiationResponseSchema = z
  .object({
    action: z.enum(["accept_counter", "reject_counter", "counter_offer"]),
    amount: z.coerce.number().int().positive().optional(),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine((value) => value.action !== "counter_offer" || Boolean(value.amount), {
    message: "Enter a positive offer amount.",
    path: ["amount"],
  })
  .refine((value) => value.action !== "reject_counter" || value.note.length >= 2, {
    message: "Add a reason for rejecting the counter offer.",
    path: ["note"],
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
