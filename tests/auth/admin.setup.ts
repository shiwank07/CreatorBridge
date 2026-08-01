import { expect, test as setup } from '@playwright/test';
import { LoginPage } from '../../playwright/pages/LoginPage';

const adminAuthFile = 'playwright/.auth/admin.json';

setup('authenticate seeded admin', async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const otp = process.env.CLERK_TEST_OTP;

  if (!email || !otp) {
    throw new Error(
      'ADMIN_EMAIL and CLERK_TEST_OTP must be configured in .env.playwright',
    );
  }

  try {
    const loginPage = new LoginPage(page);
    await loginPage.login(email, otp);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page, 'The Clerk session did not authorize the configured development admin at /admin.').toHaveURL(
      /\/admin(?:[/?#]|$)/,
      { timeout: 20_000 },
    );
    await expect(
      page.getByRole('heading', { name: 'Overview', exact: true }),
      'Admin authorization completed, but the Overview page did not become ready.',
    ).toBeVisible();

    await page.context().storageState({ path: adminAuthFile });
  } catch (error) {
    throw new Error(
      `Admin authentication setup failed before storageState was saved. Final path: ${new URL(page.url()).pathname}. ` +
        `Verify the Clerk development account, test OTP support, ADMIN_EMAIL allowlist, and Clerk instance keys. ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }
});
