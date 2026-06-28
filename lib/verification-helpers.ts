import { randomInt } from "crypto";

const VERIFICATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PUBLIC_EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]);

export function createVerificationCode(prefix = "CB") {
  let suffix = "";

  for (let index = 0; index < 5; index += 1) {
    suffix += VERIFICATION_CODE_ALPHABET[randomInt(VERIFICATION_CODE_ALPHABET.length)];
  }

  return `${prefix}-${suffix}`;
}

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
