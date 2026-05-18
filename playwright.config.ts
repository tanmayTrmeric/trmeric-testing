import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env file so credentials and config are available
dotenv.config();

/**
 * Trmeric Platform Testing Framework — Playwright Configuration
 *
 * Multi-instance support:
 *   TRMERIC_ENV=dev  npm run test:smoke     ← Dev (default)
 *   TRMERIC_ENV=qa   npm run test:platform  ← QA/Test
 *   TRMERIC_ENV=eu   npm run test:platform  ← EU
 *   TRMERIC_ENV=prod npm run test:smoke     ← Production (smoke only!)
 */

// ── Instance URLs ───────────────────────────────────────────
const INSTANCES: Record<string, { frontend: string; backend: string }> = {
  dev: {
    frontend: 'http://localhost:5173',
    backend: 'https://trmeric-strong.trmeric.com',
  },
  qa: {
    frontend: 'https://trmeric-live.trmeric.com',
    backend: 'https://trmeric-strong.trmeric.com',
  },
  eu: {
    frontend: 'https://trmeric-eu.trmeric.com',
    backend: 'https://trmeric-eu-strong.trmeric.com',
  },
  prod: {
    frontend: 'https://app.trmeric.com',
    backend: 'https://api.trmeric.com',
  },
};

const ENV = process.env.TRMERIC_ENV || 'dev';
const instance = INSTANCES[ENV] || INSTANCES.dev;

const FRONTEND_URL = instance.frontend;
const BACKEND_URL = process.env.TRMERIC_BASE_URL || instance.backend;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html', { open: 'never', outputFolder: `reports/${ENV}` }],
    ['list'],
    ['json', { outputFile: `reports/${ENV}-results.json` }],
    ['./tests/reporters/summary-reporter.ts', {
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      outputDir: 'reports',
    }],
  ],

  timeout: 60_000,

  // Visual regression: snapshot comparison settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,     // Allow 1% pixel diff (font rendering, anti-aliasing)
      threshold: 0.2,              // Color diff threshold per pixel
      animations: 'disabled',      // Freeze animations for stable screenshots
    },
  },

  // Snapshot directory for visual baselines
  snapshotDir: './tests/visual/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: FRONTEND_URL,
    headless: false,
    launchOptions: {
      slowMo: 500,
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'smoke',
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },
    {
      name: 'platform',
      testMatch: /platform\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },
    {
      name: 'user-stories',
      testMatch: /user-stories\/(?!_TEMPLATE).*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },

    // ── Accessibility ────────────────────────────────────
    {
      name: 'a11y',
      testMatch: /a11y\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },

    // ── Responsive — Tablet ──────────────────────────────
    {
      name: 'tablet',
      testMatch: /platform\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['iPad Pro 11'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },

    // ── Responsive — Mobile ──────────────────────────────
    {
      name: 'mobile',
      testMatch: /smoke\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Pixel 7'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },
  ],

  outputDir: `./reports/${ENV}-results`,
});
