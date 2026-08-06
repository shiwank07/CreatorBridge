import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { safeInternalRedirect } from "../../lib/auth-redirect";
import { clerkConfigurationIssue } from "../../lib/clerk-config";
import { mayCompleteOnboarding, onboardingRoleFilter } from "../../lib/onboarding-role";
import { navigationPublicMetadata } from "../../lib/clerk-navigation-metadata";
import { parseNavigationContext } from "../../lib/navigation-context";
import { accountDestination, resolveApplicationAccountState } from "../../lib/application-account-state";

const live = {
  NODE_ENV: "production",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
  CLERK_SECRET_KEY: "sk_live_example",
  ADMIN_CLERK_USER_IDS: "user_production_admin",
} as NodeJS.ProcessEnv;

test("marketing legal pages keep their Clerk-aware navbar under the root provider without database work", () => {
  const rootLayout = fs.readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
  const marketingLayout = fs.readFileSync(path.join(process.cwd(), "app/(marketing)/layout.tsx"), "utf8");
  const marketingNavbar = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar-client.tsx"), "utf8");

  expect(rootLayout).toContain("<ClerkProvider");
  expect(rootLayout).not.toMatch(/if\s*\([^)]*hasClerkKeys\(\)[^)]*\)\s*return/);
  expect(marketingLayout).toContain("<MarketingNavbar />");
  expect(marketingNavbar).toContain("useAuth()");

  for (const route of ["terms", "privacy", "cookies", "about"]) {
    const page = fs.readFileSync(path.join(process.cwd(), `app/(marketing)/${route}/page.tsx`), "utf8");
    expect(page).not.toMatch(/connectDB|mongoose|mongodb|@\/lib\/db|@\/lib\/queries/);
    expect(page).not.toContain("force-dynamic");
  }
});

test("production Clerk configuration requires paired live keys and immutable admin IDs", () => {
  expect(clerkConfigurationIssue(live)).toBeNull();
  expect(clerkConfigurationIssue({ ...live, CLERK_SECRET_KEY: "sk_test_example" })).toMatch(/live keys/);
  expect(clerkConfigurationIssue({ ...live, ADMIN_CLERK_USER_IDS: "" })).toMatch(/ADMIN_CLERK_USER_IDS/);
  expect(clerkConfigurationIssue({ ...live, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "" })).toMatch(/both be configured/);
});

test("non-production Clerk configuration rejects mixed instance key types", () => {
  expect(clerkConfigurationIssue({
    NODE_ENV: "test", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example", CLERK_SECRET_KEY: "sk_test_example",
  } as NodeJS.ProcessEnv)).toBeNull();
  expect(clerkConfigurationIssue({
    NODE_ENV: "test", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example", CLERK_SECRET_KEY: "sk_test_example",
  } as NodeJS.ProcessEnv)).toMatch(/same instance type/);
});

test("authentication redirects allow only internal application paths", () => {
  expect(safeInternalRedirect("/dashboard/creator?tab=profile")).toBe("/dashboard/creator?tab=profile");
  for (const unsafe of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
    expect(safeInternalRedirect(unsafe, "/onboarding")).toBe("/onboarding");
  }
});

test("completed onboarding locks creator and brand roles", () => {
  expect(mayCompleteOnboarding(null, "creator")).toBeTruthy();
  expect(mayCompleteOnboarding({ role: "creator", onboardingComplete: false }, "brand")).toBeTruthy();
  expect(mayCompleteOnboarding({ role: "creator", onboardingComplete: true }, "creator")).toBeTruthy();
  expect(mayCompleteOnboarding({ role: "creator", onboardingComplete: true }, "brand")).toBeFalsy();
  expect(mayCompleteOnboarding({ role: "brand", onboardingComplete: true }, "creator")).toBeFalsy();
  expect(mayCompleteOnboarding({ role: "brand", onboardingComplete: false, deletedAt: new Date() }, "brand")).toBeFalsy();
  expect(onboardingRoleFilter("user_1", "creator")).not.toHaveProperty("role", "admin");
});

test("navigation context parses session claims before public metadata", () => {
  expect(parseNavigationContext({
    sessionClaims: { public_metadata: { role: "creator", username: "creator-one", onboardingComplete: true } },
    publicMetadata: { role: "brand", username: "brand-one", onboardingComplete: true },
  })).toMatchObject({ role: "creator", username: "creator-one", onboardingComplete: true, isLoaded: true });
  expect(parseNavigationContext({ publicMetadata: { role: "brand", username: "brand-one", onboarding_complete: true } }))
    .toMatchObject({ role: "brand", username: "brand-one", onboardingComplete: true });
  expect(parseNavigationContext({ sessionClaims: {}, publicMetadata: {} })).toBeNull();
});

test("admin navigation metadata is derived only from immutable configured IDs", () => {
  const base = { clerkId: "user_member", role: "admin" as const, username: "member", onboardingComplete: true };
  expect(navigationPublicMetadata(base)).toMatchObject({ role: null, isAdmin: false });
  expect(navigationPublicMetadata({ ...base, clerkId: "user_admin" }, { ...process.env, ADMIN_CLERK_USER_IDS: "user_admin" }))
    .toMatchObject({ role: "admin", username: "member", onboardingComplete: true, isAdmin: true });
});

test("onboarding securely synchronizes Clerk navigation metadata", () => {
  for (const route of ["app/api/onboarding/creator/route.ts", "app/api/onboarding/brand/route.ts"]) {
    const source = fs.readFileSync(path.join(process.cwd(), route), "utf8");
    expect(source).toContain("syncClerkNavigationMetadata(await clerkClient(), user)");
  }
});

test("existing-user Clerk reconciliation remains dry-run by default", () => {
  const script = fs.readFileSync(path.join(process.cwd(), "scripts/reconcile-clerk-users.ts"), "utf8");
  const service = fs.readFileSync(path.join(process.cwd(), "lib/clerk-reconciliation.ts"), "utf8");
  expect(script).toContain('const apply = args.includes("--apply")');
  expect(script).toContain("dryRun: !apply");
  expect(service).toContain("metadataChanged");
  expect(service).toContain("updateUserMetadata");
});

test("authoritative application account state distinguishes every routing outcome", () => {
  const id = { toString: () => "mongo-user" };
  const profileId = { toString: () => "profile-id" };
  expect(resolveApplicationAccountState(null, null)).toEqual({ status: "anonymous" });
  expect(resolveApplicationAccountState("clerk-new", null)).toMatchObject({ status: "needs_onboarding" });
  expect(resolveApplicationAccountState("clerk-creator", { _id: id, clerkId: "clerk-creator", role: "creator", username: "maya", onboardingComplete: true, accountStatus: "active", creatorProfileId: profileId }))
    .toMatchObject({ status: "creator", username: "maya" });
  expect(resolveApplicationAccountState("clerk-brand", { _id: id, clerkId: "clerk-brand", role: "brand", username: "northstar", onboardingComplete: true, accountStatus: "active", brandProfileId: profileId }))
    .toMatchObject({ status: "brand", username: "northstar" });
  expect(resolveApplicationAccountState("clerk-admin", null, { admin: true })).toMatchObject({ status: "admin" });
  expect(resolveApplicationAccountState("clerk-existing", null, { unavailable: true }))
    .toEqual({ status: "temporarily_unavailable", clerkUserId: "clerk-existing", retryable: true });
});

test("profile-backed incomplete accounts recover but provisional webhook creators do not", () => {
  const id = { toString: () => "mongo-user" };
  const profileId = { toString: () => "creator-profile" };
  expect(resolveApplicationAccountState("clerk-recovered", {
    _id: id, clerkId: "clerk-recovered", role: "creator", username: "existing", onboardingComplete: false,
    accountStatus: "active", creatorProfileId: profileId,
  })).toMatchObject({ status: "creator", recoveredFromProfile: true, profileId: "creator-profile" });
  expect(resolveApplicationAccountState("clerk-provisional", {
    _id: id, clerkId: "clerk-provisional", role: "creator", username: "new-user", onboardingComplete: false,
    accountStatus: "active", creatorProfileId: null,
  })).toMatchObject({ status: "needs_onboarding", username: "new-user" });
});

test("restricted and completed-without-profile accounts cannot enter a dashboard", () => {
  const id = { toString: () => "mongo-user" };
  expect(accountDestination(resolveApplicationAccountState("clerk-suspended", {
    _id: id, clerkId: "clerk-suspended", role: "creator", username: "held", onboardingComplete: true,
    accountStatus: "suspended", creatorProfileId: { toString: () => "profile" },
  }))).toBe("/403");
  expect(resolveApplicationAccountState("clerk-missing-profile", {
    _id: id, clerkId: "clerk-missing-profile", role: "brand", username: "brand", onboardingComplete: true,
    accountStatus: "active", brandProfileId: null,
  })).toMatchObject({ status: "needs_onboarding", preferredRole: "brand" });
});

test("dashboard and onboarding use the shared role destination and branded unavailable state", () => {
  const dashboard = fs.readFileSync(path.join(process.cwd(), "app/dashboard/page.tsx"), "utf8");
  const onboarding = fs.readFileSync(path.join(process.cwd(), "app/onboarding/page.tsx"), "utf8");
  for (const source of [dashboard, onboarding]) {
    expect(source).toContain("getApplicationAccountState()");
    expect(source).toContain("AccountUnavailable");
  }
  expect(onboarding).not.toContain("User.findOne");
  expect(onboarding).not.toContain("connectDB");
});

test("onboarding APIs are idempotent and reject completed opposite roles", () => {
  const creator = fs.readFileSync(path.join(process.cwd(), "app/api/onboarding/creator/route.ts"), "utf8");
  const brand = fs.readFileSync(path.join(process.cwd(), "app/api/onboarding/brand/route.ts"), "utf8");
  expect(creator).toContain('code: "ACCOUNT_ALREADY_BRAND"');
  expect(brand).toContain('code: "ACCOUNT_ALREADY_CREATOR"');
  expect(creator).toContain("CreatorProfile.findOneAndUpdate");
  expect(brand).toContain("BrandProfile.findOneAndUpdate");
  expect(creator).toContain("{ upsert: true, new: true }");
  expect(brand).toContain("{ upsert: true, new: true }");
});

test("database failure never routes an authenticated account to onboarding", () => {
  const state = resolveApplicationAccountState("clerk-existing", null, { unavailable: true });
  expect(accountDestination(state)).toBeNull();
  expect(state.status).not.toBe("needs_onboarding");
});
