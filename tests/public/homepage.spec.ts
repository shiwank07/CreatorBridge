import { test, expect } from '@playwright/test';

test.describe('Branzzo homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/localhost:3000/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Branzzo home' })).toHaveAttribute('href', '/');
    await expect(page.getByTestId('branzzo-logo').first()).toBeVisible();
    await expect(page.getByTestId('branzzo-wordmark').first()).toHaveText('Branzzo');
  });

  test('serves install and social branding assets', async ({ request }) => {
    for (const path of ['/favicon.ico', '/icon.png', '/apple-icon.png', '/branding/branzzo-og.png']) {
      const response = await request.get(path);
      expect(response.ok(), `${path} should load`).toBe(true);
      expect((await response.body()).byteLength, `${path} should not be empty`).toBeGreaterThan(1_000);
    }
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`keeps the logo visible without horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      await expect(page.getByTestId('branzzo-logo').first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

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
