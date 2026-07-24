import { expect, type Page } from '@playwright/test';
import { createPageHealthCheck } from './run-page-health-check';

export type UiAuditPageOptions = {
  route: string;
  screenshotName: string;
  expectedUrl?: RegExp;
  expectedStatus?: number;
};

export async function runUiAuditPage(
  page: Page,
  { route, screenshotName, expectedUrl, expectedStatus }: UiAuditPageOptions,
): Promise<void> {
  const healthCheck = createPageHealthCheck(page, {
    // Next's development-only HMR client routinely aborts stale hot-update
    // chunks during recompilation. Production assets remain fully monitored.
    ignoredNetworkPatterns: [/_next\/static\/webpack\/.*hot-update/],
    ignoredConsolePatterns:
      expectedStatus === 404
        ? [/Failed to load resource: the server responded with a status of 404/]
        : undefined,
  });
  const response = await healthCheck.goto(route);

  if (expectedUrl) await expect(page).toHaveURL(expectedUrl);
  if (expectedStatus) expect(response?.status()).toBe(expectedStatus);
  await expect(page.locator('body')).toBeVisible();
  if (/^\/sign-(?:in|up)(?:\/|$)/.test(route)) {
    await expect(
      page.locator(
        '.cl-rootBox, [data-clerk-component], form:has(input[name="identifier"]), form:has(input[name="emailAddress"])',
      ).first(),
      'Clerk auth UI should finish mounting before visual assertions',
    ).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.locator('body')).not.toContainText(
    /Application error|Internal Server Error/i,
  );

  await page.screenshot({
    path: `playwright/screenshots/ui-audit/${screenshotName}.png`,
    fullPage: true,
    animations: 'disabled',
  });

  await healthCheck.assert({
    checkImages: true,
    checkHorizontalOverflow: true,
    importantElements: page.locator(
      'a, button, input, select, textarea, [role="button"], [role="link"]',
    ),
  });

  const unnamedControls = await page
    .locator('button, input:not([type="hidden"]), select, textarea, [role="button"]')
    .evaluateAll((nodes) =>
      nodes.flatMap((node, index) => {
        const element = node as HTMLElement;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          rect.width === 0 ||
          rect.height === 0
        ) {
          return [];
        }

        const labelledBy = element.getAttribute('aria-labelledby');
        const hasLabelledBy = Boolean(
          labelledBy &&
            labelledBy
              .split(/\s+/)
              .every((id) => document.getElementById(id)?.textContent?.trim()),
        );
        const hasLabel =
          Boolean(element.getAttribute('aria-label')?.trim()) ||
          hasLabelledBy ||
          Boolean(element.textContent?.trim()) ||
          (element instanceof HTMLInputElement && Boolean(element.labels?.length)) ||
          (element instanceof HTMLSelectElement && Boolean(element.labels?.length)) ||
          (element instanceof HTMLTextAreaElement && Boolean(element.labels?.length));

        return hasLabel
          ? []
          : [{
              index,
              tag: element.tagName.toLowerCase(),
              type: element.getAttribute('type'),
            }];
      }),
    );

  expect(unnamedControls, 'Visible interactive controls must have an accessible name').toEqual([]);

  const mainCount = await page.locator('main').count();
  expect(mainCount, 'Each rendered application page should expose one main landmark').toBe(1);

  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('Tab');
  const firstTabStop = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return {
      tag: active?.tagName ?? '',
      visible: active
        ? active !== document.body &&
          active !== document.documentElement &&
          getComputedStyle(active).visibility !== 'hidden'
        : false,
    };
  });
  expect(
    firstTabStop.visible,
    `Keyboard navigation should reach a visible control; active element was ${firstTabStop.tag || 'none'}`,
  ).toBe(true);
}
