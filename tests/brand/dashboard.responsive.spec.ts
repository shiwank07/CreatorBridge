import { expect, test } from '@playwright/test';
import {
  responsiveViewports,
  runResponsivePageCheck,
} from '../../playwright/helpers/run-responsive-page-check';

test.describe('brand dashboard responsive health', () => {
  for (const viewport of responsiveViewports) {
    test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
      await runResponsivePageCheck({
        page,
        path: '/dashboard/brand',
        screenshotName: 'brand-dashboard',
        viewport,
        overlapElements: 'main > section:nth-of-type(2) > :is(a, article)',
        additionalOverlapElements: [
          '[data-testid="collaboration-column"] > div:nth-child(2) > [data-testid="collaboration-card"]',
        ],
        containmentChecks: [
          { containers: '[data-testid="collaboration-card"]' },
        ],
        maximumPageHeight: viewport.width < 768 ? 14_000 : viewport.width < 1280 ? 10_000 : 7_500,
        assertPage: async () => {
          await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
          await expect(page).toHaveURL(/\/dashboard\/brand(?:[/?#]|$)/);
          await expect(page.getByText('Brand Command Center', { exact: true })).toBeVisible();
          await expect(page.locator('body')).toBeVisible();
        },
      });
    });
  }
});
