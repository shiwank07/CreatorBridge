import { z } from "zod";

const optional = (max: number) => z.string().trim().max(max).optional().default("");

export const creatorPaymentDetailsSchema = z.object({
  preferredMethod: z.enum(["upi", "bank"]),
  upiId: optional(120).refine((value) => !value || /^[\w.-]{2,100}@[A-Za-z0-9.-]{2,30}$/.test(value), "Enter a valid UPI ID."),
  accountHolderName: optional(120),
  bankName: optional(120),
  accountNumber: optional(34).transform((value) => value.replace(/\s+/g, "")).refine((value) => !value || /^\d{6,34}$/.test(value), "Account number must contain 6 to 34 digits."),
  ifscCode: optional(11).transform((value) => value.toUpperCase()).refine((value) => !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value), "Enter a valid 11-character IFSC code."),
  paymentNote: optional(500),
}).superRefine((value, ctx) => {
  if (value.preferredMethod === "upi" && !value.upiId) ctx.addIssue({ code: "custom", path: ["upiId"], message: "UPI ID is required for UPI." });
  if (value.preferredMethod === "bank") {
    for (const [field, message] of [["accountHolderName", "Account-holder name is required."], ["bankName", "Bank name is required."], ["accountNumber", "Account number is required."], ["ifscCode", "IFSC code is required."]] as const) {
      if (!value[field]) ctx.addIssue({ code: "custom", path: [field], message });
    }
  }
});

export type CreatorPaymentDetailsInput = z.infer<typeof creatorPaymentDetailsSchema>;
