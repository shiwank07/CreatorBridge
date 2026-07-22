import { expect, test } from '@playwright/test';
import { createPageHealthCheck } from '../../playwright/helpers/run-page-health-check';
import { assertElementsDoNotOverlap } from '../../playwright/utils/layout-checks';

test('seeded brand can open the authenticated dashboard', async ({ page }) => {
  const healthCheck = createPageHealthCheck(page);
  await healthCheck.goto('/dashboard/brand');

  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await expect(page).toHaveURL(/\/dashboard\/brand(?:[/?#]|$)/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByText('Brand Command Center', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    /Application error|Internal Server Error/i,
  );
  await page.screenshot({
    path: 'playwright/screenshots/brand-dashboard.png',
    fullPage: true,
  });

  await healthCheck.assert({
    checkImages: true,
    checkHorizontalOverflow: true,
    importantElements: page.locator('button, a, input, select, textarea'),
  });

  // Brand metrics are links (or articles when non-clickable) in the second top-level section.
  await assertElementsDoNotOverlap(
    page,
    'main > section:nth-of-type(2) > :is(a, article)',
  );
});
