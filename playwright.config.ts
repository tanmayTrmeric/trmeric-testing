import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Trmeric Platform Testing Framework — Production Configuration
 *
 * Features:
 *   - Global pre-flight checks (backend/frontend reachability)
 *   - CI auto-detection (headless, no slowMo, parallel API tests)
 *   - Multi-environment: dev, qa, eu, prod
 *   - Multi-role auth: RM, DO, PL, SM, DR
 *   - Deploy gate project for pre-deployment validation
 *
 * Usage:
 *   TRMERIC_ENV=dev  npx playwright test --project=platform
 *   TRMERIC_ENV=qa   npx playwright test --project=deploy-gate
 *   CI=true          npx playwright test --project=deploy-gate
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
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // Pre-flight: check env, backend, frontend before running anything
  globalSetup: './tests/global-setup.ts',

  fullyParallel: false,
  workers: IS_CI ? 2 : 1,
  retries: IS_CI ? 2 : 0,

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

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  snapshotDir: './tests/visual/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

  use: {
    baseURL: FRONTEND_URL,
    // CI = headless + no slowMo; Local = headed + slowMo for visibility
    headless: IS_CI,
    launchOptions: {
      slowMo: IS_CI ? 0 : 500,
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    // ── Auth Setup (runs first, all projects depend on it) ──
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    // ── Smoke Tests (no auth needed) ────────────────────────
    {
      name: 'smoke',
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    // ── Visual Regression ───────────────────────────────────
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

    // ── Platform Tests (auth, navigation, API, features) ────
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

    // ── User Story Tests (BDD, sprint-mapped) ───────────────
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

    // ── Accessibility ───────────────────────────────────────
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

    // ── Responsive — Tablet ─────────────────────────────────
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

    // ── Responsive — Mobile ─────────────────────────────────
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

    // ═══════════════════════════════════════════════════════
    // DEPLOY GATE — Run this before every deployment
    // Combines: smoke + API contracts + platform + auth
    // Command: npm run deploy:check
    // ═══════════════════════════════════════════════════════
    {
      name: 'deploy-gate',
      testMatch: [
        /smoke\/.*\.spec\.ts/,
        /platform\/api-contracts\/.*\.spec\.ts/,
        /platform\/auth\/.*\.spec\.ts/,
        /platform\/navigation\/.*\.spec\.ts/,
        /platform\/actions\/.*\.spec\.ts/,
        /platform\/resource-management\/.*\.spec\.ts/,
        /platform\/demands\/.*\.spec\.ts/,
      ],
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
      },
    },

    // ═══════════════════════════════════════════════════════
    // LIVE DEMO — Full UI walkthrough for stakeholder demos
    // Navigates everywhere, clicks everything, visual proof
    // Command: npm run demo
    // ═══════════════════════════════════════════════════════
    {
      name: 'demo',
      testMatch: /platform\/demo\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: './tests/.auth/user.json',
        video: 'on',
      },
    },
  ],

  outputDir: `./reports/${ENV}-results`,
});
