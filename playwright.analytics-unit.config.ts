import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /(analytics-(formulas|db\.integration)|admin-search\.integration|payment-security|cloudflare-mongodb|index-deployment|email-foundation|email-delivery\.integration|clerk-security|clerk-sync\.integration)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
});
