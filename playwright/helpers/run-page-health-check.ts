import { type Locator, type Page, type Response } from '@playwright/test';
import { assertNoBrokenVisibleImages } from '../utils/broken-images';
import { monitorConsole, type ErrorPattern } from '../utils/console-monitor';
import {
  assertElementsInsideViewport,
  assertNoHorizontalPageOverflow,
} from '../utils/layout-checks';
import { monitorNetwork } from '../utils/network-monitor';
import { waitForAppReady, type WaitForAppReadyOptions } from './wait-for-app-ready';

export type PageHealthCheckOptions = {
  ignoredConsolePatterns?: ErrorPattern[];
  ignoredNetworkPatterns?: ErrorPattern[];
  appReady?: WaitForAppReadyOptions;
};

export type PageHealthAssertions = {
  checkImages?: boolean;
  checkHorizontalOverflow?: boolean;
  importantElements?: Locator;
};

export function createPageHealthCheck(
  page: Page,
  options: PageHealthCheckOptions = {},
) {
  // These listeners are intentionally attached when the helper is created,
  // before goto() can initiate document or asset requests.
  const consoleMonitor = monitorConsole(page, {
    ignoredPatterns: options.ignoredConsolePatterns,
  });
  const networkMonitor = monitorNetwork(page, {
    ignoredUrlPatterns: options.ignoredNetworkPatterns,
  });

  return {
    consoleMonitor,
    networkMonitor,
    goto: async (url: string): Promise<Response | null> => {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      await waitForAppReady(page, options.appReady);
      return response;
    },
    assert: async (assertions: PageHealthAssertions = {}): Promise<void> => {
      consoleMonitor.assertNoErrors();
      networkMonitor.assertNoCriticalFailures();

      if (assertions.checkImages) await assertNoBrokenVisibleImages(page);
      if (assertions.checkHorizontalOverflow) await assertNoHorizontalPageOverflow(page);
      if (assertions.importantElements) {
        await assertElementsInsideViewport(page, assertions.importantElements);
      }
    },
  };
}

export type PageHealthCheck = ReturnType<typeof createPageHealthCheck>;
