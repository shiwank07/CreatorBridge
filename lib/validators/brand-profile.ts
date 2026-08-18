import { z } from "zod";

import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { normalizePlatformUrl } from "@/lib/creator-platforms";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => {
    if (!value) return true;
    try { normalizePlatformUrl(value); return true; } catch { return false; }
  }, "Use a valid public HTTPS URL.");

export const brandOnboardingSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9]+$/, "Username can only contain lowercase letters and numbers."),
  companyName: z.string().trim().min(2, "Company name is required.").max(120),
  contactName: z.string().trim().min(2, "Contact name is required.").max(100),
  contactRole: z.string().trim().min(2, "Representative role is required.").max(100),
  contactEmail: z.string().trim().email("Enter a valid work email.").max(160),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .transform((value) => normalizePhoneNumber(value))
    .refine(isValidPhoneNumber, "Enter a valid phone number, including country code if needed."),
  logo: optionalUrl,
  website: optionalUrl,
  businessSocialUrl: optionalUrl,
  industry: z.string().trim().min(2, "Industry is required.").max(80),
  companySize: z.string().trim().min(1, "Company size is required.").max(80),
  country: z.string().trim().min(2, "Country is required.").max(80),
  companyRegistrationText: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().min(50, "Description should be at least 50 characters.").max(500),
  displayPublicly: z.boolean(),
  termsAccepted: z.literal(true, { error: "You must agree to the terms." }),
}).superRefine((value, context) => {
  if (!value.website && !value.businessSocialUrl) context.addIssue({ code: "custom", path: ["website"], message: "Add an official website or public business social profile." });
});

export type BrandOnboardingInput = z.infer<typeof brandOnboardingSchema>;
