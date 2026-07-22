import { type Page } from '@playwright/test';

export type WaitForAppReadyOptions = {
  loadingSelectors?: string[];
  loadingTimeout?: number;
};

const defaultLoadingSelectors = [
  'main [aria-busy="true"]',
  'main [role="progressbar"]',
  'main [data-loading="true"]',
];

export async function waitForAppReady(
  page: Page,
  options: WaitForAppReadyOptions = {},
): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() =>
    document.readyState === 'interactive' || document.readyState === 'complete',
  );

  const selectors = options.loadingSelectors ?? defaultLoadingSelectors;
  await Promise.all(
    selectors.map((selector) =>
      page.locator(selector).first().waitFor({
        state: 'hidden',
        timeout: options.loadingTimeout ?? 5_000,
      }),
    ),
  );

  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    ),
  );
}
