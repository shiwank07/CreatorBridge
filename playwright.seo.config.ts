import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/public",
  testMatch: /seo-metadata\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
});
