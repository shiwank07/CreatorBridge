export function hasClerkKeys() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export function clerkConfigurationIssue(env: NodeJS.ProcessEnv = process.env) {
  const publishable = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const secret = env.CLERK_SECRET_KEY?.trim() ?? "";
  if (!publishable || !secret) return "Clerk publishable and secret keys must both be configured.";
  const production = env.NODE_ENV === "production";
  if (production && (!publishable.startsWith("pk_live_") || !secret.startsWith("sk_live_"))) {
    return "Production requires Clerk live keys.";
  }
  if (!production && publishable.startsWith("pk_live_") !== secret.startsWith("sk_live_")) {
    return "Clerk publishable and secret keys must belong to the same instance type.";
  }
  if (production && !(env.ADMIN_CLERK_USER_IDS?.trim())) {
    return "Production requires ADMIN_CLERK_USER_IDS for immutable administrator authorization.";
  }
  return null;
}
