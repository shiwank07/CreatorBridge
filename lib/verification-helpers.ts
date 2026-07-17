const PUBLIC_EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]);

export { createVerificationCode, formatVerificationCode, isVerificationCode, VERIFICATION_CODE_PATTERN } from "@/lib/verification-code";

export function verificationCodeExpiry(days = 14) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export function normalizeUrlDomain(value?: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

export function emailDomain(email?: string) {
  return email?.split("@")[1]?.trim().toLowerCase() ?? "";
}

export function isWorkEmailDomain(domain: string) {
  return Boolean(domain) && !PUBLIC_EMAIL_DOMAINS.has(domain);
}

export function normalizeYoutubeChannelKey(url?: string, handle?: string) {
  const handleKey = handle?.trim().toLowerCase().replace(/^@/, "");
  if (handleKey) return handleKey;

  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}
