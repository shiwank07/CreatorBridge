import { expect, test } from '@playwright/test';
import { createPageHealthCheck } from '../../playwright/helpers/run-page-health-check';
import { assertElementsDoNotOverlap } from '../../playwright/utils/layout-checks';

test('seeded admin can open the authenticated dashboard', async ({ page }) => {
  const healthCheck = createPageHealthCheck(page);
  await healthCheck.goto('/admin');

  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await expect(page).toHaveURL(/\/admin(?:[/?#]|$)/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    /Application error|Internal Server Error/i,
  );
  await page.screenshot({
    path: 'playwright/screenshots/admin-dashboard.png',
    fullPage: true,
  });

  await healthCheck.assert({
    checkImages: true,
    checkHorizontalOverflow: true,
    importantElements: page.locator('button, a, input, select, textarea'),
  });

  // Statistic cards have a direct monospaced metric value; navigation panels do not.
  await assertElementsDoNotOverlap(
    page,
    'main section .bridge-card:has(> p.font-mono)',
  );
});
