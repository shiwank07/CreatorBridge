import { test } from "@playwright/test";
import { assertNoSeriousAccessibilityViolations } from "../../playwright/helpers/assert-accessible";

for (const [name, route] of [
  ["dashboard", "/dashboard/creator"],
  ["edit profile", "/dashboard/creator/edit"],
  ["verification", "/dashboard/verification"],
  ["notifications", "/notifications"],
  ["analytics", "/dashboard/creator/analytics"],
] as const) {
  test(`accessibility: creator ${name}`, async ({ page }) => {
    await page.goto(route);
    await assertNoSeriousAccessibilityViolations(page);
  });
}
