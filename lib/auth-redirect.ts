const DEFAULT_AUTH_REDIRECT = "/onboarding";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getRedirectParam(params: Record<string, string | string[] | undefined>) {
  return readParam(params.redirect_url) ?? readParam(params.redirectUrl);
}

export function safeInternalRedirect(value: string | undefined, fallback = DEFAULT_AUTH_REDIRECT) {
  if (!value) return fallback;

  try {
    const url = new URL(value, "https://creatorbridge.local");
    const isInternal = url.origin === "https://creatorbridge.local" && value.startsWith("/") && !value.startsWith("//");

    if (!isInternal || url.pathname.includes("\\")) return fallback;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authHref(path: "/sign-in" | "/sign-up", redirectTo = DEFAULT_AUTH_REDIRECT) {
  return `${path}?redirect_url=${encodeURIComponent(redirectTo)}`;
}
