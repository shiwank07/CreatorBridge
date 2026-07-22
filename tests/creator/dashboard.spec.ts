import { expect, test } from '@playwright/test';
import { createPageHealthCheck } from '../../playwright/helpers/run-page-health-check';
import { assertElementsDoNotOverlap } from '../../playwright/utils/layout-checks';

test('seeded creator can open the authenticated dashboard', async ({ page }) => {
  const healthCheck = createPageHealthCheck(page);
  await healthCheck.goto('/dashboard/creator');

  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    /Application error|Internal Server Error/i,
  );
  await page.screenshot({
    path: 'playwright/screenshots/creator-dashboard.png',
    fullPage: true,
  });

  await healthCheck.assert({
    checkImages: true,
    checkHorizontalOverflow: true,
    importantElements: page.locator('button, a, input, select, textarea'),
  });

  // The second top-level section is the four-card metrics grid in the actual dashboard markup.
  await assertElementsDoNotOverlap(page, 'main > section:nth-of-type(2) > article');
});
