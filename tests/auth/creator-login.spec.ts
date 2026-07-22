import { test, expect } from '@playwright/test';
import { LoginPage } from '../../playwright/pages/LoginPage';

test.describe('Creator authentication', () => {
  test('creator can sign in using Clerk test OTP', async ({ page }) => {
    const email = process.env.CREATOR_EMAIL;
    const otp = process.env.CLERK_TEST_OTP;

    if (!email || !otp) {
      throw new Error(
        'CREATOR_EMAIL and CLERK_TEST_OTP must be configured in .env.playwright',
      );
    }

    const loginPage = new LoginPage(page);

    await loginPage.login(email, otp);

    await expect(page).not.toHaveURL(/sign-in/);

    await expect(page.locator('body')).not.toContainText(
      /invalid code|verification failed|something went wrong/i,
    );
  });
});