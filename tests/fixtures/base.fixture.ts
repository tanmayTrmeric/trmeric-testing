import { test as base, expect, Page } from '@playwright/test';
import { TrmericAPI } from '../helpers/api';
import { ROUTES, URLS } from '../helpers/urls';
import { ROLES, RoleConfig } from '../helpers/roles';

/**
 * Trmeric Test Fixtures — Shared setup for all tests
 *
 * Provides:
 *   - `api`          — Authenticated TrmericAPI instance (auto-created from page cookies)
 *   - `potentialHub`  — Navigate + wait for Potential Hub
 *   - `actionsHub`    — Navigate + wait for Actions Hub
 *   - `myHub`         — Navigate + wait for My Hub
 *   - `assertNoCrash` — Verify page didn't error-boundary
 *   - `waitForApp`    — Wait for React SPA to hydrate
 */

type TrmericFixtures = {
  api: TrmericAPI;
  waitForApp: (page: Page) => Promise<void>;
  assertNoCrash: (page: Page) => Promise<void>;
  navigateTo: (page: Page, route: string) => Promise<void>;
};

export const test = base.extend<TrmericFixtures>({

  // Auto-creates an authenticated API client from the current page session
  api: async ({ page, request }, use) => {
    // Navigate once to pick up cookies from storageState
    await page.goto(ROUTES.potential, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const cookies = await page.context().cookies();
    const api = new TrmericAPI(request, cookies);
    await use(api);
  },

  // Waits for React SPA to hydrate — use instead of waitForTimeout
  waitForApp: async ({}, use) => {
    await use(async (page: Page) => {
      await page.waitForLoadState('domcontentloaded');
      // Wait for React root to have children (SPA hydrated)
      await page.waitForSelector('div[id="root"] *', { timeout: 15_000 }).catch(() => {});
      // Small buffer for async data fetches
      await page.waitForTimeout(2000);
    });
  },

  // Asserts the page didn't hit a React error boundary
  assertNoCrash: async ({}, use) => {
    await use(async (page: Page) => {
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(10);
    });
  },

  // Navigate to a route with standard SPA waits
  navigateTo: async ({}, use) => {
    await use(async (page: Page, route: string) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('div[id="root"] *', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(2000);
    });
  },
});

export { expect };
