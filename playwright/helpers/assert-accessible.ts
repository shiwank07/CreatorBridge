import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function assertNoSeriousAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = result.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}
