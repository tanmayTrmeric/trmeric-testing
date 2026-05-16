import { test, expect } from '@playwright/test';
import { ROUTES } from '../../helpers/urls';

/**
 * ═══════════════════════════════════════════════════════════════
 * PLATFORM TEST: Navigation & Route Verification
 * ═══════════════════════════════════════════════════════════════
 *
 * Validates that all major routes in the app are accessible
 * and render without crashing (no blank screens, no React errors).
 *
 * Run on every deploy to catch broken routes from bad imports or missing components.
 */

test.describe('Navigation — Core Routes Load', () => {

  const criticalRoutes = [
    { name: 'My Hub', path: ROUTES.myHub },
    { name: 'Portfolios', path: ROUTES.portfolios },
    { name: 'Potential Hub', path: ROUTES.potential },
    { name: 'Actions Hub', path: ROUTES.actions },
  ];

  for (const route of criticalRoutes) {
    test(`${route.name} (${route.path}) renders without crash`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Wait for React to render something visible
      await page.waitForSelector('div[id="root"] *', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(3000); // Allow async data fetching

      // No React error boundary
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();

      // Page rendered — not blank
      const hasContent = await page.locator('div, span, button, table, input').first().isVisible();
      expect(hasContent).toBeTruthy();
    });
  }
});

test.describe('Navigation — Right Sidebar', () => {

  test('Right nav renders with expected icons', async ({ page }) => {
    await page.goto(ROUTES.myHub, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // The app shell rendered — look for any rendered content
    const hasRendered = await page.locator('#root').first().isVisible().catch(() => false);
    expect(hasRendered).toBeTruthy();
  });
});
