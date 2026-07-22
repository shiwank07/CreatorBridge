import { expect, test as setup } from '@playwright/test';
import { LoginPage } from '../../playwright/pages/LoginPage';

const brandAuthFile = 'playwright/.auth/brand.json';

setup('authenticate seeded brand', async ({ page }) => {
  const email = process.env.BRAND_EMAIL;
  const otp = process.env.CLERK_TEST_OTP;

  if (!email || !otp) {
    throw new Error(
      'BRAND_EMAIL and CLERK_TEST_OTP must be configured in .env.playwright',
    );
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(email, otp);

  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await page.goto('/dashboard/brand');
  await expect(page).toHaveURL(/\/dashboard\/brand(?:[/?#]|$)/);
  await expect(page.getByText('Brand Command Center', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toBeVisible();
  await page.waitForLoadState('domcontentloaded');

  await page.context().storageState({ path: brandAuthFile });
});
