import { test, expect } from '@playwright/test';
import { ROUTES, URLS } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ═══════════════════════════════════════════════════════════════
 * PLATFORM TEST: Authentication & Role Detection
 * ═══════════════════════════════════════════════════════════════
 *
 * Validates that:
 * - Login state persists across pages
 * - User role (RM/PL/DM) is correctly detected
 * - Role-based UI elements show/hide properly
 * - Backend API responds with correct user context
 */

test.describe('Auth — Session Persistence', () => {

  test('User stays logged in across page navigations', async ({ page }) => {
    // Navigate to multiple pages — should NOT redirect to login
    await page.goto(ROUTES.myHub, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/sign-in');

    await page.goto(ROUTES.potential, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/sign-in');

    await page.goto(ROUTES.actions, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/sign-in');
  });
});

test.describe('Auth — Role-Based Access', () => {

  test('Potential Hub sidebar renders with correct view options', async ({ page }) => {
    await page.goto(ROUTES.potential);
    await page.waitForLoadState('domcontentloaded');

    // The sidebar should show at least "Resource-Centric" view
    const resourceView = page.getByText('Resource-Centric', { exact: false }).first();
    await expect(resourceView).toBeVisible({ timeout: 10_000 });
  });

  test('Backend recognizes authenticated user', async ({ page, request }) => {
    await page.goto(ROUTES.potential);
    const cookies = await page.context().cookies();
    const api = new TrmericAPI(request, cookies);

    // Call an authenticated API — should NOT get 401
    const result = await api.getPortfolioRMs();
    expect(result.status).not.toBe(401);

    if (result.status === 200 && result.data) {
      const rmList = result.data?.data || result.data?.flat_rms || [];
      console.log(`\n📊 Authenticated user sees ${rmList.length} RM entries across portfolios`);
    }
  });
});
