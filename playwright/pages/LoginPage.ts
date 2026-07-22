import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/sign-in');
    await expect(this.page.locator('body')).toBeVisible();
  }

  async signInWithEmail(email: string): Promise<void> {
    const emailInput = this.page.locator(
      'input[name="identifier"], input[name="emailAddress"], input[type="email"]',
    ).first();

    await expect(emailInput).toBeVisible();
    await emailInput.fill(email);

    const continueButton = this.page.getByRole('button', {
      name: 'Continue',
      exact: true,
    });

    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  async enterOtp(code: string): Promise<void> {
    const useAnotherMethod = this.page.getByRole('link', {
      name: 'Use another method',
      exact: true,
    });

    await expect(useAnotherMethod).toBeVisible();
    await useAnotherMethod.click();

    const emailCodeMethod = this.page.getByRole('button', {
      name: /email.*code|code.*email/i,
    });

    await expect(emailCodeMethod).toBeVisible();
    await emailCodeMethod.click();

    const sendCodeButton = this.page.getByRole('button', {
      name: 'Continue',
      exact: true,
    });

    await expect(sendCodeButton).toBeEnabled();
    await sendCodeButton.click();

    const verificationInput = this.page.getByRole('textbox', {
      name: 'Enter verification code',
      exact: true,
    });

    await expect(verificationInput).toBeVisible();
    await expect(verificationInput).toHaveAttribute('data-input-otp', 'true');
    await verificationInput.fill(code);
  }

  async login(email: string, otp: string): Promise<void> {
    await this.open();
    await this.signInWithEmail(email);
    await this.enterOtp(otp);

    await this.page.waitForLoadState('domcontentloaded');
  }
}
