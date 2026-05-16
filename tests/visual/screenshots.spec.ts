import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/urls';

/**
 * ═══════════════════════════════════════════════════════════════
 * VISUAL REGRESSION TESTS — Pixel-Perfect Screenshot Comparison
 * ═══════════════════════════════════════════════════════════════
 *
 * Takes screenshots of critical pages and compares them against
 * saved baselines. Any CSS regression (broken layout, missing
 * elements, wrong colors) will cause a diff and fail the test.
 *
 * First run: creates baseline snapshots in tests/visual/snapshots/
 * Subsequent runs: compares against baselines, fails on diff
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test --project=visual --update-snapshots
 *
 * Usage:
 *   npx playwright test --project=visual
 */

test.describe('Visual Regression — Critical Pages', () => {

  test('Potential Hub — Resource-Centric View', async ({ page }) => {
    await page.goto(ROUTES.potential, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000); // Wait for data to load + render

    // Hide dynamic content that changes between runs (timestamps, counts)
    await page.evaluate(() => {
      // Hide any real-time tickers or live timestamps
      document.querySelectorAll('[class*="ticker"], [class*="Ticker"]').forEach(
        (el) => ((el as HTMLElement).style.visibility = 'hidden')
      );
    });

    await expect(page).toHaveScreenshot('potential-hub-resource-view.png', {
      fullPage: false, // Viewport only — consistent size
      mask: [
        // Mask dynamic elements that change between runs
        page.locator('[class*="ticker"], [class*="Ticker"]'),
      ],
    });
  });

  test('Actions Hub — Main View', async ({ page }) => {
    await page.goto(ROUTES.actions, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);

    await expect(page).toHaveScreenshot('actions-hub-main.png', {
      fullPage: false,
    });
  });

  test('Portfolios Page', async ({ page }) => {
    await page.goto(ROUTES.portfolios, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);

    await expect(page).toHaveScreenshot('portfolios-page.png', {
      fullPage: false,
    });
  });

  test('My Hub — Dashboard', async ({ page }) => {
    await page.goto(ROUTES.myHub, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);

    await expect(page).toHaveScreenshot('my-hub-dashboard.png', {
      fullPage: false,
    });
  });

  test('Login Page — Public (no auth)', async ({ page, context }) => {
    // Clear auth to see the public login page
    await context.clearCookies();
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: false,
    });
  });
});
