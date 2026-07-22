import { test, expect } from '@playwright/test';

test.describe('Branzzo homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/localhost:3000/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('has no obvious broken page state', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).not.toContainText(
      'Application error',
    );

    await expect(page.locator('body')).not.toContainText(
      'Internal Server Error',
    );
  });
});