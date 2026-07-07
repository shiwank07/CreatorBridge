import { normalizePhoneNumber } from "@/lib/phone";

type VerificationLike = {
  status?: string | null;
  verifiedAtClient?: string | null;
  verified_at_client?: string | null;
};

type ClerkEmailLike = {
  id?: string | null;
  emailAddress?: string | null;
  email_address?: string | null;
  verification?: VerificationLike | null;
};

type ClerkPhoneLike = {
  id?: string | null;
  phoneNumber?: string | null;
  phone_number?: string | null;
  verification?: VerificationLike | null;
};

type ClerkUserLike = {
  primaryEmailAddressId?: string | null;
  primary_email_address_id?: string | null;
  emailAddresses?: ClerkEmailLike[] | null;
  email_addresses?: ClerkEmailLike[] | null;
  phoneNumbers?: ClerkPhoneLike[] | null;
  phone_numbers?: ClerkPhoneLike[] | null;
};

export type ClerkEmailVerificationState = {
  id: string;
  email: string;
  verified: boolean;
};

export type ClerkPhoneVerificationState = {
  id: string;
  phoneNumber: string;
  verified: boolean;
};

function withoutPlus(value: string) {
  return normalizePhoneNumber(value).replace(/^\+/, "");
}

function verificationStatus(resource?: { verification?: VerificationLike | null } | null) {
  return resource?.verification?.status ?? "";
}

function isVerified(resource?: { verification?: VerificationLike | null } | null) {
  return verificationStatus(resource) === "verified";
}

export function samePhoneNumber(left?: string | null, right?: string | null) {
  const normalizedLeft = withoutPlus(left ?? "");
  const normalizedRight = withoutPlus(right ?? "");

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function getClerkEmailVerificationState(
  user?: ClerkUserLike | null,
  fallbackEmail = "",
): ClerkEmailVerificationState | null {
  const emails = user?.emailAddresses ?? user?.email_addresses ?? [];
  const primaryEmailId = user?.primaryEmailAddressId ?? user?.primary_email_address_id ?? "";
  const fallback = fallbackEmail.trim().toLowerCase();
  const selected =
    emails.find((email) => email.id === primaryEmailId) ??
    emails.find((email) => (email.emailAddress ?? email.email_address ?? "").toLowerCase() === fallback) ??
    emails[0];
  const email = selected?.emailAddress ?? selected?.email_address ?? "";

  if (!selected || !email) return null;

  return {
    id: selected.id ?? "",
    email,
    verified: isVerified(selected),
  };
}

export function getClerkPhoneVerificationState(
  user?: ClerkUserLike | null,
  phoneNumberId = "",
  fallbackPhoneNumber = "",
): ClerkPhoneVerificationState | null {
  const phones = user?.phoneNumbers ?? user?.phone_numbers ?? [];
  const selected =
    phones.find((phone) => Boolean(phoneNumberId) && phone.id === phoneNumberId) ??
    phones.find((phone) => samePhoneNumber(phone.phoneNumber ?? phone.phone_number ?? "", fallbackPhoneNumber));
  const phoneNumber = selected?.phoneNumber ?? selected?.phone_number ?? "";

  if (!selected || !phoneNumber) return null;

  return {
    id: selected.id ?? "",
    phoneNumber,
    verified: isVerified(selected),
  };
}
