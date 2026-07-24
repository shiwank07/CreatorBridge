import { test } from '@playwright/test';
import { runUiAuditPage } from '../../playwright/helpers/run-ui-audit-page';

const adminPages = [
  ['overview', '/admin'],
  ['creators', '/admin/creators'],
  ['brands', '/admin/brands'],
  ['collaborations', '/admin/collaborations'],
  ['verification', '/admin/verification'],
  ['brand-verifications', '/admin/brand-verifications'],
  ['reports', '/admin/reports'],
  ['email-logs', '/admin/email-logs'],
  ['users', '/admin/users'],
  ['contacts', '/admin/contacts'],
  ['inquiries', '/admin/inquiries'],
] as const;

test.describe('admin UI audit', () => {
  for (const [name, route] of adminPages) {
    test(name, async ({ page }) => {
      await runUiAuditPage(page, {
        route,
        screenshotName: `admin-${name}`,
        expectedUrl: /\/admin(?:[/?#]|$)/,
      });
    });
  }

  test('collaboration detail', async ({ page }) => {
    await page.goto('/admin/collaborations');
    const detailHref = await page
      .locator('a[href^="/admin/collaborations/"]')
      .first()
      .getAttribute('href');
    test.skip(!detailHref, 'No seeded collaboration exists for the detail view');

    await runUiAuditPage(page, {
      route: detailHref!,
      screenshotName: 'admin-collaboration-detail',
      expectedUrl: /\/admin\/collaborations\/[^/?#]+/,
    });
  });
});
