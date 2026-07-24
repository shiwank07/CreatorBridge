import { expect, type Locator, type Page } from '@playwright/test';
import { createPageHealthCheck } from './run-page-health-check';
import {
  assertChildrenInsideContainer,
  assertElementsDoNotOverlap,
} from '../utils/layout-checks';

export type ResponsiveViewport = {
  width: number;
  height: number;
};

export const responsiveViewports: ResponsiveViewport[] = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

type ResponsivePageCheckOptions = {
  page: Page;
  path: string;
  screenshotName: string;
  viewport: ResponsiveViewport;
  overlapElements: string | Locator;
  additionalOverlapElements?: Array<string | Locator>;
  containmentChecks?: Array<{
    containers: string | Locator;
    childSelector?: string;
  }>;
  maximumPageHeight?: number;
  assertPage: () => Promise<void>;
};

export async function runResponsivePageCheck({
  page,
  path,
  screenshotName,
  viewport,
  overlapElements,
  additionalOverlapElements = [],
  containmentChecks = [],
  maximumPageHeight,
  assertPage,
}: ResponsivePageCheckOptions): Promise<void> {
  const healthCheck = createPageHealthCheck(page);

  await page.setViewportSize(viewport);
  await healthCheck.goto(path);
  await assertPage();

  await healthCheck.assert({
    checkImages: true,
    checkHorizontalOverflow: true,
    importantElements: page.locator('button, a, input, select, textarea'),
  });
  await assertElementsDoNotOverlap(page, overlapElements);
  for (const elements of additionalOverlapElements) {
    await assertElementsDoNotOverlap(page, elements);
  }
  for (const check of containmentChecks) {
    await assertChildrenInsideContainer(
      page,
      check.containers,
      check.childSelector,
    );
  }
  if (maximumPageHeight) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(
      height,
      `Page height ${height}px exceeds the route-specific compact-state limit ${maximumPageHeight}px`,
    ).toBeLessThanOrEqual(maximumPageHeight);
  }

  await page.screenshot({
    path: `playwright/screenshots/responsive/${screenshotName}-${viewport.width}x${viewport.height}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  healthCheck.consoleMonitor.assertNoErrors();
  healthCheck.networkMonitor.assertNoCriticalFailures();
}
