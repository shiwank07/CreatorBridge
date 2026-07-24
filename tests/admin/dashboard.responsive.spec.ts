import { expect, test } from '@playwright/test';
import {
  responsiveViewports,
  runResponsivePageCheck,
} from '../../playwright/helpers/run-responsive-page-check';

test.describe('admin dashboard responsive health', () => {
  for (const viewport of responsiveViewports) {
    test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
      await runResponsivePageCheck({
        page,
        path: '/admin',
        screenshotName: 'admin-dashboard',
        viewport,
        overlapElements: 'main section .bridge-card:has(> p.font-mono)',
        containmentChecks: [
          { containers: 'main section .bridge-card' },
        ],
        assertPage: async () => {
          await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
          await expect(page).toHaveURL(/\/admin(?:[/?#]|$)/);
          await expect(
            page.getByRole('heading', { name: 'Overview', exact: true }),
          ).toBeVisible();
          await expect(page.locator('body')).toBeVisible();
        },
      });
    });
  }
});
