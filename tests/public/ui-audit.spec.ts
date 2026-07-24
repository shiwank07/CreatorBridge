import { test } from '@playwright/test';
import { runUiAuditPage } from '../../playwright/helpers/run-ui-audit-page';

const publicPages = [
  ['homepage', '/', /^http:\/\/localhost:3000\/?$/, undefined],
  ['about', '/about', /\/about(?:[/?#]|$)/, undefined],
  ['contact', '/contact', /\/contact(?:[/?#]|$)/, undefined],
  ['privacy', '/privacy', /\/privacy(?:[/?#]|$)/, undefined],
  ['terms', '/terms', /\/terms(?:[/?#]|$)/, undefined],
  ['community-guidelines', '/community-guidelines', /\/community-guidelines(?:[/?#]|$)/, undefined],
  ['trust-safety', '/trust-safety', /\/trust-safety(?:[/?#]|$)/, undefined],
  ['pricing', '/pricing', /\/pricing(?:[/?#]|$)/, undefined],
  ['creator-directory', '/creators', /\/creators(?:[/?#]|$)/, undefined],
  ['creator-profile', '/creators/gamingcreator', /\/creators\/gamingcreator(?:[/?#]|$)/, undefined],
  ['brand-profile', '/brands/nike', /\/brands\/nike(?:[/?#]|$)/, undefined],
  ['sign-in', '/sign-in', /\/sign-in(?:[/?#]|$)/, undefined],
  ['sign-up', '/sign-up', /\/sign-up(?:[/?#]|$)/, undefined],
  ['forbidden', '/403', /\/403(?:[/?#]|$)/, undefined],
  ['not-found', '/ui-audit-missing-page', /\/ui-audit-missing-page(?:[/?#]|$)/, 404],
] as const;

test.describe('public UI audit', () => {
  for (const [name, route, expectedUrl, expectedStatus] of publicPages) {
    test(name, async ({ page }) => {
      await runUiAuditPage(page, {
        route,
        screenshotName: `public-${name}`,
        expectedUrl,
        expectedStatus,
      });
    });
  }
});
