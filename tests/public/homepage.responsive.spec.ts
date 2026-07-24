import { expect, test } from '@playwright/test';
import {
  responsiveViewports,
  runResponsivePageCheck,
} from '../../playwright/helpers/run-responsive-page-check';

test.describe('public homepage responsive health', () => {
  for (const viewport of responsiveViewports) {
    test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
      await runResponsivePageCheck({
        page,
        path: '/',
        screenshotName: 'homepage',
        viewport,
        overlapElements: '#how-it-works > div:first-child > .bridge-card',
        assertPage: async () => {
          await expect(page).toHaveURL(/\/$/);
          await expect(
            page.getByRole('heading', {
              name: /Creator signals\. Real brand partnerships\./i,
            }),
          ).toBeVisible();
          await expect(page.locator('body')).toBeVisible();
        },
      });
    });
  }
});
