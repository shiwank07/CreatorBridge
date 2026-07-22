import { expect, test as setup } from '@playwright/test';
import { LoginPage } from '../../playwright/pages/LoginPage';

const creatorAuthFile = 'playwright/.auth/creator.json';

setup('authenticate seeded creator', async ({ page }) => {
  const email = process.env.CREATOR_EMAIL;
  const otp = process.env.CLERK_TEST_OTP;

  if (!email || !otp) {
    throw new Error(
      'CREATOR_EMAIL and CLERK_TEST_OTP must be configured in .env.playwright',
    );
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(email, otp);

  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await page.goto('/dashboard/creator');
  await expect(page).not.toHaveURL(/\/sign-in(?:\/|\?|$)/);
  await expect(page.locator('body')).toBeVisible();
  await page.waitForLoadState('domcontentloaded');

  await page.context().storageState({ path: creatorAuthFile });
});
