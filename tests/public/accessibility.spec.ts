import { test } from "@playwright/test";
import { assertNoSeriousAccessibilityViolations } from "../../playwright/helpers/assert-accessible";

for (const [name, route] of [
  ["homepage", "/"],
  ["sign-in", "/sign-in"],
  ["sign-up", "/sign-up"],
  ["creator directory", "/creators"],
  ["creator profile", "/creators/gamingcreator"],
  ["brand profile", "/brands/nike"],
] as const) {
  test(`accessibility: ${name}`, async ({ page }) => {
    await page.goto(route);
    await assertNoSeriousAccessibilityViolations(page);
  });
}
