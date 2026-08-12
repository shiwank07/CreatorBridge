import { canRevealCollaborationContactEmail, type BrandInquiryStatus } from "@/lib/collaborations";
import type { CreatorPaymentDetailsData } from "@/lib/types";

export const CREATOR_PAYMENT_DETAILS_SELECT = [
  "paymentDetails.preferredMethod",
  "+paymentDetails.upiId",
  "paymentDetails.accountHolderName",
  "paymentDetails.bankName",
  "+paymentDetails.accountNumber",
  "paymentDetails.ifscCode",
  "paymentDetails.paymentNote",
  "paymentDetails.updatedAt",
].join(" ");

type StoredCreatorPaymentDetails = {
  preferredMethod?: "upi" | "bank";
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  paymentNote?: string;
  updatedAt?: Date;
};

export type CreatorPaymentProfile = { paymentDetails?: StoredCreatorPaymentDetails | null };

export function canViewCreatorPaymentDetails(viewerRole: string, status: BrandInquiryStatus) {
  return viewerRole === "brand" && canRevealCollaborationContactEmail(status);
}

export function mapCreatorPaymentDetails(profile: CreatorPaymentProfile | null): CreatorPaymentDetailsData | undefined {
  if (!profile?.paymentDetails) return undefined;

  return {
    preferredMethod: profile.paymentDetails.preferredMethod,
    upiId: profile.paymentDetails.upiId ?? "",
    accountHolderName: profile.paymentDetails.accountHolderName ?? "",
    bankName: profile.paymentDetails.bankName ?? "",
    bankAccountNumber: profile.paymentDetails.accountNumber ?? "",
    ifscCode: profile.paymentDetails.ifscCode ?? "",
    paymentNote: profile.paymentDetails.paymentNote ?? "",
  };
}
