import { expect, test } from '@playwright/test';
import {
  responsiveViewports,
  runResponsivePageCheck,
} from '../../playwright/helpers/run-responsive-page-check';

test.describe('creator dashboard responsive health', () => {
  for (const viewport of responsiveViewports) {
    test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
      await runResponsivePageCheck({
        page,
        path: '/dashboard/creator',
        screenshotName: 'creator-dashboard',
        viewport,
        overlapElements: 'main > section:nth-of-type(2) > article',
        additionalOverlapElements: [
          '[data-testid="collaboration-column"] > div:nth-child(2) > [data-testid="collaboration-card"]',
        ],
        containmentChecks: [
          { containers: '[data-testid="collaboration-card"]' },
        ],
        maximumPageHeight: viewport.width < 768 ? 10_000 : viewport.width < 1280 ? 8_000 : 5_000,
        assertPage: async () => {
          await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
          await expect(page).toHaveURL(/\/dashboard\/creator(?:[/?#]|$)/);
          await expect(page.locator('body')).toBeVisible();
        },
      });
    });
  }
});
