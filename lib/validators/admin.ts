import { z } from "zod";

export const creatorAdminUpdateSchema = z.object({
  username: z.string().min(1),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const creatorVerificationUpdateSchema = z.object({
  username: z.string().min(1),
  action: z.enum(["approve_ownership", "approve_stats", "reject"]),
  verifiedSubscribers: z.coerce.number().int().nonnegative().optional(),
  note: z.string().trim().max(500).optional().default(""),
});

export const brandVerificationUpdateSchema = z.object({
  username: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional().default(""),
});
