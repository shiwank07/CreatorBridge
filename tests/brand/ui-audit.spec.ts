import { test } from '@playwright/test';
import { runUiAuditPage } from '../../playwright/helpers/run-ui-audit-page';

const brandPages = [
  ['dashboard', '/dashboard/brand'],
  ['edit-profile', '/dashboard/brand/edit'],
  ['history', '/dashboard/history'],
  ['verification', '/dashboard/verification'],
  ['account-settings', '/dashboard/settings/account'],
  ['notifications', '/notifications'],
  ['creator-directory', '/creators'],
  ['public-profile', '/brands/nike'],
  ['campaign-inquiry', '/campaign-inquiry?creator=gamingcreator'],
] as const;

test.describe('brand UI audit', () => {
  for (const [name, route] of brandPages) {
    test(name, async ({ page }) => {
      await runUiAuditPage(page, {
        route,
        screenshotName: `brand-${name}`,
      });
    });
  }
});
