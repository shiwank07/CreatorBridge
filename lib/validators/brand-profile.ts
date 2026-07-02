import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Use a full URL beginning with http or https.");

export const brandOnboardingSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required.").max(120),
  contactName: z.string().trim().min(2, "Contact name is required.").max(100),
  contactRole: z.string().trim().max(100).optional().default(""),
  contactEmail: z.string().trim().email("Enter a valid work email.").max(160),
  website: optionalUrl,
  industry: z.string().trim().min(2, "Industry is required.").max(80),
  companySize: z.string().trim().max(80).optional().default(""),
  country: z.string().trim().min(2, "Country is required.").max(80),
  companyRegistrationText: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

export type BrandOnboardingInput = z.infer<typeof brandOnboardingSchema>;
