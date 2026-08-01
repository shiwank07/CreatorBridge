import { z } from "zod";

export const CONTACT_REQUEST_MAX_BYTES = 8_192;
export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  topic: z.enum(["support", "partnerships", "legal"]),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(20).max(5000),
  companyWebsite: z.string().max(0).optional(),
});

export function acceptsContactContentType(value: string | null) {
  return Boolean(value?.toLowerCase().startsWith("application/json"));
}

export function contactRequestTooLarge(value: string | null) {
  const length = Number(value ?? 0);
  return Number.isFinite(length) && length > CONTACT_REQUEST_MAX_BYTES;
}
