import { expect, test } from '@playwright/test';
import {
  responsiveViewports,
  runResponsivePageCheck,
} from '../../playwright/helpers/run-responsive-page-check';

const adminLists = [
  ['creators', '/admin/creators'],
  ['brands', '/admin/brands'],
  ['users', '/admin/users'],
  ['collaborations', '/admin/collaborations'],
  ['verification', '/admin/verification'],
  ['email-logs', '/admin/email-logs'],
  ['reports', '/admin/reports'],
] as const;

test.describe('admin list responsive health', () => {
  for (const viewport of responsiveViewports) {
    for (const [name, path] of adminLists) {
      test(`${name} ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await runResponsivePageCheck({
          page,
          path,
          screenshotName: `admin-${name}`,
          viewport,
          overlapElements: 'main tbody > tr',
          assertPage: async () => {
            await expect(page).toHaveURL(/\/admin(?:[/?#]|$)/);
            await expect(page.locator('body')).not.toContainText(
              /Application error|Internal Server Error/i,
            );
          },
        });
      });
    }
  }
});
