import { expect, test } from '@playwright/test';
import {
  responsiveViewports,
  runResponsivePageCheck,
} from '../../playwright/helpers/run-responsive-page-check';

test.describe('brand history responsive health', () => {
  for (const viewport of responsiveViewports) {
    test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
      await runResponsivePageCheck({
        page,
        path: '/dashboard/history',
        screenshotName: 'brand-history',
        viewport,
        overlapElements: '[data-testid="history-record"]',
        containmentChecks: [{ containers: '[data-testid="history-record"] > article' }],
        maximumPageHeight: viewport.width < 768 ? 6_000 : 4_000,
        assertPage: async () => {
          await expect(page).toHaveURL(/\/dashboard\/history(?:[/?#]|$)/);
          await expect(page.getByRole('heading', { name: 'Your collaboration record' })).toBeVisible();
        },
      });
    });
  }
});
