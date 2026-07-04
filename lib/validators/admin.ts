import { z } from "zod";

export const creatorAdminUpdateSchema = z.object({
  username: z.string().min(1),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  action: z
    .enum(["approve_verification", "reject_verification", "hide_profile", "suspend", "restore"])
    .optional(),
  note: z.string().trim().max(500).optional().default(""),
}).refine((value) => value.action || typeof value.isFeatured === "boolean" || typeof value.isVerified === "boolean", {
  message: "Choose an admin action.",
}).refine((value) => value.action !== "reject_verification" || value.note.length >= 2, {
  message: "Add a rejection reason.",
  path: ["note"],
});

export const brandAdminUpdateSchema = z.object({
  username: z.string().min(1),
  action: z.enum(["approve", "reject", "hide", "suspend", "restore"]),
  note: z.string().trim().max(500).optional().default(""),
}).refine((value) => value.action !== "reject" || value.note.length >= 2, {
  message: "Add a rejection reason.",
  path: ["note"],
});

export const userAdminUpdateSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["suspend", "restore", "hide"]),
});

export const reportAdminUpdateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["resolve", "dismiss", "suspend_user"]),
});

export const emailLogRetrySchema = z.object({
  id: z.string().min(1),
});

export const creatorVerificationUpdateSchema = z.object({
  username: z.string().min(1),
  action: z.enum(["approve", "reject", "approve_ownership", "approve_stats"]),
  verifiedSubscribers: z.coerce.number().int().nonnegative().optional(),
  note: z.string().trim().max(500).optional().default(""),
}).refine((value) => value.action !== "reject" || value.note.length >= 2, {
  message: "Add a rejection reason.",
  path: ["note"],
});

export const brandVerificationUpdateSchema = z.object({
  username: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional().default(""),
}).refine((value) => value.action !== "reject" || value.note.length >= 2, {
  message: "Add a rejection reason.",
  path: ["note"],
});

export const adminContactUpdateSchema = z.object({
  userId: z.string().min(1),
  phoneVerified: z.boolean(),
});
