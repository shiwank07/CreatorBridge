import { test } from '@playwright/test';
import { runUiAuditPage } from '../../playwright/helpers/run-ui-audit-page';

const creatorPages = [
  ['dashboard', '/dashboard/creator'],
  ['edit-profile', '/dashboard/creator/edit'],
  ['history', '/dashboard/history'],
  ['verification', '/dashboard/verification'],
  ['account-settings', '/dashboard/settings/account'],
  ['notifications', '/notifications'],
  ['public-profile', '/creators/gamingcreator'],
] as const;

test.describe('creator UI audit', () => {
  for (const [name, route] of creatorPages) {
    test(name, async ({ page }) => {
      await runUiAuditPage(page, {
        route,
        screenshotName: `creator-${name}`,
      });
    });
  }
});
