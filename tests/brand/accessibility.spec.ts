import { test } from "@playwright/test";
import { assertNoSeriousAccessibilityViolations } from "../../playwright/helpers/assert-accessible";

for (const [name, route] of [
  ["dashboard", "/dashboard/brand"],
  ["edit profile", "/dashboard/brand/edit"],
  ["directory", "/creators"],
  ["notifications", "/notifications"],
  ["analytics", "/dashboard/brand/analytics"],
] as const) {
  test(`accessibility: brand ${name}`, async ({ page }) => {
    await page.goto(route);
    await assertNoSeriousAccessibilityViolations(page);
  });
}
