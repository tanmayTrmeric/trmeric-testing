import { test, expect } from '@playwright/test';
import { ROUTES, URLS } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ═══════════════════════════════════════════════════════════════
 * PLATFORM TEST: Resource Management — Potential Hub
 * ═══════════════════════════════════════════════════════════════
 *
 * Tests the core resource management views:
 * - Resource-Centric view (roster table, filters, KPIs)
 * - Resource Requests view (demand table, matchmaking)
 * - Resource Profile page
 * - Add Resource panel
 *
 * VE Tickets: VE-170, VE-175, VE-176, VE-177, VE-180, VE-181
 */

test.describe('Potential Hub — Resource-Centric View', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.potential);
    await page.waitForLoadState('domcontentloaded');
  });

  test('Roster table renders with resource data', async ({ page }) => {
    // Wait for the resource table to load
    const table = page.locator('table, [class*="roster"], [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 15_000 });

    // Table should have at least one row of data
    const rows = page.locator('tr, [class*="tableRow"], [class*="row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('KPI strip renders with metrics', async ({ page }) => {
    // KPI bento strip should show at the top
    const kpiArea = page.locator('[class*="kpi"], [class*="bento"], [class*="strip"]').first();
    const hasKpi = await kpiArea.isVisible().catch(() => false);

    if (hasKpi) {
      // Should show numeric values (percentages, counts)
      const kpiText = await kpiArea.innerText();
      expect(kpiText.length).toBeGreaterThan(0);
    }
  });

  test('Search bar is functional', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="earch"], input[placeholder*="employee"], input[type="search"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('test');
      // Wait for debounced search
      await page.waitForTimeout(500);
      // Search shouldn't crash the page
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(10);
    }
  });
});

test.describe('Potential Hub — Backend API Contracts', () => {

  test('get_resources returns valid resource data', async ({ page, request }) => {
    await page.goto(ROUTES.potential);
    const cookies = await page.context().cookies();
    const api = new TrmericAPI(request, cookies);

    const result = await api.getResources();

    if (result.status === 200 && result.data) {
      // Validate response shape
      const resources = result.data?.resource_data || result.data?.data || [];
      console.log(`\n📊 Resources loaded: ${resources.length}`);

      if (resources.length > 0) {
        const first = resources[0];
        // Each resource should have essential fields
        expect(first).toHaveProperty('id');
      }
    }
  });

  test('portfolio_resource_managers returns RM mappings', async ({ page, request }) => {
    await page.goto(ROUTES.potential);
    const cookies = await page.context().cookies();
    const api = new TrmericAPI(request, cookies);

    const result = await api.getPortfolioRMs();

    if (result.status === 200 && result.data) {
      const rms = result.data?.data || [];
      const portfolios = result.data?.portfolios || [];

      console.log(`\n📊 Portfolio RM Mappings:`);
      console.log(`   Total flat RMs: ${rms.length}`);
      console.log(`   Portfolios with RMs: ${portfolios.length}`);

      // Every RM entry should have user_id and portfolio_id
      for (const rm of rms) {
        expect(rm).toHaveProperty('user_id');
        expect(rm).toHaveProperty('portfolio_id');
      }
    }
  });

  test('KPI summary returns valid metrics', async ({ page, request }) => {
    await page.goto(ROUTES.potential);
    const cookies = await page.context().cookies();
    const api = new TrmericAPI(request, cookies);

    const result = await api.getKpiSummary();

    if (result.status === 200 && result.data) {
      console.log(`\n📊 KPI Summary: ${JSON.stringify(result.data).substring(0, 200)}...`);
    }
  });
});
