export type NavigationRole = "creator" | "brand" | "admin";

export type NavigationContext = {
  role: NavigationRole | null;
  username: string | null;
  onboardingComplete: boolean;
  isLoaded: boolean;
};

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function navigationFields(value: unknown) {
  const data = objectValue(value);
  if (!data) return null;
  const role: NavigationRole | null = data.role === "creator" || data.role === "brand" || data.role === "admin" ? data.role : null;
  return {
    role,
    username: typeof data.username === "string" && data.username ? data.username : null,
    onboardingComplete: data.onboardingComplete === true || data.onboarding_complete === true,
  };
}

export function parseNavigationContext(input: { sessionClaims?: unknown; publicMetadata?: unknown }): NavigationContext | null {
  const claims = objectValue(input.sessionClaims);
  const claimCandidates = [claims, claims?.publicMetadata, claims?.public_metadata, claims?.metadata];
  for (const candidate of claimCandidates) {
    const parsed = navigationFields(candidate);
    if (parsed?.role && (parsed.role === "admin" || parsed.onboardingComplete)) return { ...parsed, isLoaded: true };
  }
  const metadata = navigationFields(input.publicMetadata);
  return metadata?.role && (metadata.role === "admin" || metadata.onboardingComplete) ? { ...metadata, isLoaded: true } : null;
}

export function emptyNavigationContext(isLoaded = false): NavigationContext {
  return { role: null, username: null, onboardingComplete: false, isLoaded };
}
