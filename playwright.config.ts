import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.playwright'),
});

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const webServerPort = new URL(baseURL).port || '3000';

export default defineConfig({
  testDir: './tests',

  // Seeded users and shared database data should not be modified in parallel.
  fullyParallel: false,
  workers: 1,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  outputDir: 'test-results',

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
  ],

  use: {
    baseURL,

    headless: true,

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    viewport: {
      width: 1440,
      height: 900,
    },
  },

  projects: [
    {
      name: 'creator-setup',
      testMatch: /creator\.setup\.ts/,
    },
    {
      name: 'brand-setup',
      testMatch: /brand\.setup\.ts/,
    },
    {
      name: 'admin-setup',
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: [/public\/.*\.spec\.ts/, /auth\/creator-login\.spec\.ts/],
      testIgnore: [/.*\.setup\.ts/, /.*\.integration\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'creator-chromium',
      testMatch: /creator\/.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['creator-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/creator.json',
      },
    },
    {
      name: 'brand-chromium',
      testMatch: /brand\/.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['brand-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/brand.json',
      },
    },
    {
      name: 'admin-chromium',
      testMatch: /admin\/.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['admin-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
  ],

  webServer: {
    // A production server avoids long-run dev-compiler resets and hydration
    // timing drift. Never attach to an unknown stale process on the test port.
    command: `npm run build && npm run start:e2e -- --port ${webServerPort}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
