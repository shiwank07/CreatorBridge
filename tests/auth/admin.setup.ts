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

  const loginPage = new LoginPage(page);
  await loginPage.login(email, otp);

  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin(?:[/?#]|$)/);
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('body')).toBeVisible();
  await page.waitForLoadState('domcontentloaded');

  await page.context().storageState({ path: adminAuthFile });
});
