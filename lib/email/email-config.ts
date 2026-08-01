export const DEFAULT_EMAIL_FROM = "Branzzo <notifications@updates.branzzo.com>";
export const DEFAULT_EMAIL_SECURITY_FROM = "Branzzo Security <security@updates.branzzo.com>";
export const DEFAULT_EMAIL_REPLY_TO = "support@branzzo.com";
export const EMAIL_SENDER_DOMAIN = "updates.branzzo.com";
export const EMAIL_LOGO_PUBLIC_PATH = "/branding/branzzo-logo.png";

const EMAIL_ADDRESS = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/i;
const NAMED_ADDRESS = /^\s*(?:([^<>]+?)\s*)?<([^<>]+)>\s*$/;

export type EmailEnvironment = {
  apiKey: string;
  appUrl: string;
  from: string;
  securityFrom: string;
  replyTo: string;
  logoUrl: string;
};

export type EmailEnvironmentInput = Partial<Record<
  "RESEND_API_KEY" | "APP_URL" | "NEXT_PUBLIC_APP_URL" | "EMAIL_FROM" | "EMAIL_SECURITY_FROM" | "EMAIL_REPLY_TO" |
  "EMAIL_ASSET_BASE_URL" | "EMAIL_LOGO_URL" | "NODE_ENV",
  string | undefined
>>;

export function extractEmailAddress(value: string) {
  return (value.match(NAMED_ADDRESS)?.[2] ?? value).trim().toLowerCase();
}

export function isValidEmailAddress(value: string) {
  return EMAIL_ADDRESS.test(value.trim());
}

export function normalizedEmailError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return "The email could not be sent. Please try again later.";
  return "The email service is temporarily unavailable.";
}

export function isValidSender(value: string) {
  const address = extractEmailAddress(value);
  return isValidEmailAddress(address) && address.split("@")[1] === EMAIL_SENDER_DOMAIN;
}

export function normalizeAppUrl(value: string) {
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Application URL must use HTTP or HTTPS.");
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function absoluteAppUrl(path: string, appUrl: string) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${normalizeAppUrl(appUrl)}/`).toString();
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function resolveEmailLogoUrl(env: EmailEnvironmentInput = process.env) {
  const production = env.NODE_ENV === "production";
  const explicitLogo = env.EMAIL_LOGO_URL?.trim();
  const assetBase = env.EMAIL_ASSET_BASE_URL?.trim();
  const fallbackBase = env.APP_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || (production ? "" : "http://localhost:3000");
  const value = explicitLogo || (assetBase ? new URL(EMAIL_LOGO_PUBLIC_PATH, `${assetBase.replace(/\/+$/, "")}/`).toString() :
    fallbackBase ? new URL(EMAIL_LOGO_PUBLIC_PATH, `${fallbackBase.replace(/\/+$/, "")}/`).toString() : "");
  if (!value) throw new Error("APP_URL or NEXT_PUBLIC_APP_URL is required when no email logo override is set.");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Email logo URL must use HTTP or HTTPS.");
  if (production && (url.protocol !== "https:" || isLocalHostname(url.hostname))) {
    throw new Error("Email logo URL must be a public HTTPS URL outside local preview mode.");
  }
  return url.toString();
}

export function readEmailEnvironment(env: EmailEnvironmentInput = process.env): EmailEnvironment {
  const production = env.NODE_ENV === "production";
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
  const securityFrom = env.EMAIL_SECURITY_FROM?.trim() || DEFAULT_EMAIL_SECURITY_FROM;
  const replyTo = env.EMAIL_REPLY_TO?.trim() || DEFAULT_EMAIL_REPLY_TO;
  const rawAppUrl = env.NEXT_PUBLIC_APP_URL?.trim() || (production ? "" : "http://localhost:3000");
  const errors: string[] = [];

  if (production && !apiKey) errors.push("RESEND_API_KEY is required in production.");
  if (!isValidSender(from)) errors.push(`EMAIL_FROM must use ${EMAIL_SENDER_DOMAIN}.`);
  if (!isValidSender(securityFrom)) errors.push(`EMAIL_SECURITY_FROM must use ${EMAIL_SENDER_DOMAIN}.`);
  if (extractEmailAddress(from) === "onboarding@resend.dev") errors.push("The Resend onboarding sender is not allowed.");
  if (!isValidEmailAddress(replyTo)) errors.push("EMAIL_REPLY_TO must be a valid email address.");
  if (!rawAppUrl) errors.push("NEXT_PUBLIC_APP_URL is required in production.");

  let appUrl = "";
  if (rawAppUrl) {
    try {
      appUrl = normalizeAppUrl(rawAppUrl);
      const hostname = new URL(appUrl).hostname;
      if (production && isLocalHostname(hostname)) {
        errors.push("NEXT_PUBLIC_APP_URL cannot use localhost in production.");
      }
    } catch {
      errors.push("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
    }
  }
  let logoUrl = "";
  try {
    logoUrl = resolveEmailLogoUrl(env);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Email logo URL is invalid.");
  }

  if (errors.length) throw new Error(errors.join(" "));
  return { apiKey, appUrl, from, securityFrom, replyTo, logoUrl };
}
