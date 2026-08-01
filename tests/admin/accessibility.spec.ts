import { test } from "@playwright/test";
import { assertNoSeriousAccessibilityViolations } from "../../playwright/helpers/assert-accessible";

for (const [name, route] of [
  ["overview", "/admin"],
  ["users", "/admin/users"],
  ["creators", "/admin/creators"],
  ["brands", "/admin/brands"],
  ["collaborations", "/admin/collaborations"],
  ["verification", "/admin/verification"],
  ["reports", "/admin/reports"],
  ["email logs", "/admin/email-logs"],
] as const) {
  test(`accessibility: admin ${name}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await assertNoSeriousAccessibilityViolations(page);
  });
}
