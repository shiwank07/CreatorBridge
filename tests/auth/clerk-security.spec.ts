import { expect, test } from "@playwright/test";

import { safeInternalRedirect } from "../../lib/auth-redirect";
import { clerkConfigurationIssue } from "../../lib/clerk-config";
import { mayCompleteOnboarding, onboardingRoleFilter } from "../../lib/onboarding-role";

const live = {
  NODE_ENV: "production",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
  CLERK_SECRET_KEY: "sk_live_example",
  ADMIN_CLERK_USER_IDS: "user_production_admin",
} as NodeJS.ProcessEnv;

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
