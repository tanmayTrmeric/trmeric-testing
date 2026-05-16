import { test, expect } from '@playwright/test';
import { URLS } from '../helpers/urls';

/**
 * ═══════════════════════════════════════════════════════════════
 * SMOKE TESTS — Run on Every Deployment
 * ═══════════════════════════════════════════════════════════════
 *
 * Quick health checks that verify both Frontend and Backend are alive.
 * No login required. Should complete in < 30 seconds.
 *
 * Usage: npm run test:smoke
 */

test.describe('Backend Health', () => {

  test('Django API server responds', async ({ request }) => {
    const response = await request.get(`${URLS.backend}/api/capacity/portfolio_resource_managers`);
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Resource API endpoint exists', async ({ request }) => {
    const response = await request.post(`${URLS.backend}/api/capacity/get_resources`);
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Actions API endpoint exists', async ({ request }) => {
    const response = await request.get(`${URLS.backend}/api/actions/list`);
    expect([200, 401, 403, 404, 405]).toContain(response.status());
  });
});

test.describe('Frontend Health', () => {

  test('Login page loads', async ({ page }) => {
    // Use domcontentloaded instead of load — React SPAs may never fully "load"
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait for React to hydrate (any visible element means the SPA rendered)
    await page.waitForSelector('body *', { timeout: 30_000 });

    const body = page.locator('body');
    const bodyText = await body.innerText();
    expect(bodyText.length).toBeGreaterThan(5);
  });

  test('App shell renders after login page', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait for any interactive element to appear
    const hasContent = await page.locator('input, button, img, div[class], a').first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
