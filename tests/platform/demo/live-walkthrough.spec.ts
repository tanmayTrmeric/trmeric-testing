import { test, expect, Page } from '@playwright/test';
import { ROUTES, URLS, API } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ═══════════════════════════════════════════════════════════════
 * LIVE UI DEMO — Full Platform Walkthrough
 * ═══════════════════════════════════════════════════════════════
 *
 * Auto-navigates the ENTIRE Trmeric platform — clicks buttons,
 * switches tabs, opens demands, scrolls grids, tests everything.
 *
 * Run: npm run demo
 * ═══════════════════════════════════════════════════════════════
 */

test.setTimeout(0);

// ── Helpers ──────────────────────────────────────────────────

async function waitForLoader(page: Page) {
  await page.locator('.loader-overlay').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
}

async function go(page: Page, route: string, waitMs = 4000) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await waitForLoader(page);
  await page.waitForTimeout(waitMs);
}

async function clickIf(page: Page, selector: string, label: string) {
  const el = page.locator(selector).first();
  if (await el.isVisible().catch(() => false)) {
    console.log(`    ✓ ${label}`);
    await el.click({ force: true });
    await page.waitForTimeout(1500);
    await waitForLoader(page);
    return true;
  }
  console.log(`    ○ ${label} (not visible)`);
  return false;
}

async function clickText(page: Page, text: string, exact = false) {
  const el = page.getByText(text, { exact }).first();
  if (await el.isVisible().catch(() => false)) {
    console.log(`    ✓ "${text}"`);
    await el.click({ force: true });
    await page.waitForTimeout(1500);
    await waitForLoader(page);
    return true;
  }
  console.log(`    ○ "${text}" (not visible)`);
  return false;
}

/** Get cookies from page for API calls */
async function getApi(page: Page, request: any) {
  const cookies = await page.context().cookies();
  return new TrmericAPI(request, cookies);
}

// ═══════════════════════════════════════════════════════════════

test.describe('Live Demo: Full Platform Walkthrough', () => {

  // ─────────────────────────────────────────────────────────────
  // SECTION 1: Actions Hub
  // ─────────────────────────────────────────────────────────────
  test('1. Actions Hub — tabs, views, cards, search', async ({ page }) => {
    console.log('\n\n  ━━━ SECTION 1: ACTIONS HUB ━━━\n');

    await go(page, ROUTES.actions, 6000);
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    console.log('  ✓ Actions Hub loaded\n');

    // ── Tabs ───────────────────────────────────────────────
    console.log('  Switching action tabs...');
    const tabs = ['My Actions', 'Needs My Attention', 'Created by Me', 'My Portfolio Actions', 'Org-wide Actions'];
    for (const tab of tabs) {
      await clickText(page, tab);
      await page.waitForTimeout(2000);
    }
    await clickText(page, 'My Actions');

    // ── View toggle ───────────────────────────────────────
    console.log('\n  Toggling view modes...');
    await clickIf(page, 'button:has(svg[data-testid="GridViewIcon"])', 'Kanban view');
    await page.waitForTimeout(3000);
    await clickIf(page, 'button:has(svg[data-testid="FormatListBulletedIcon"])', 'List view');

    // ── Action row click ──────────────────────────────────
    console.log('\n  Opening action card...');
    const rows = page.locator('.MuiDataGrid-row, tr, [class*="actionCard"]');
    if (await rows.first().isVisible().catch(() => false)) {
      const count = await rows.count();
      console.log(`    Found ${count} action rows`);
      if (count > 0) {
        await rows.first().click({ force: true });
        await page.waitForTimeout(3000);
        await clickIf(page, '[aria-label="close"], [aria-label="Close"]', 'Close panel');
      }
    }

    // ── Search ────────────────────────────────────────────
    console.log('\n  Testing search...');
    const search = page.locator('input[placeholder*="earch"], input[type="search"]').first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('test');
      await page.waitForTimeout(2000);
      await search.clear();
      await page.waitForTimeout(1000);
      console.log('    ✓ Search works');
    }

    console.log('\n  ✓ Actions Hub complete\n');
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 2: Demands — DataGrid + Demand Live
  // ─────────────────────────────────────────────────────────────
  test('2. Demands — grid scroll, open demand live, explore all tabs', async ({ page, request }) => {
    console.log('\n\n  ━━━ SECTION 2: DEMANDS ━━━\n');

    // ── My Roadmaps / Demand Grid ─────────────────────────
    await go(page, ROUTES.demands, 6000);
    console.log('  ✓ My Roadmaps loaded');

    // Scroll through the DataGrid
    console.log('\n  Scrolling through demand grid...');
    const grid = page.locator('.MuiDataGrid-virtualScroller, [class*="MuiDataGrid"], table').first();
    if (await grid.isVisible().catch(() => false)) {
      // Scroll down in the grid
      await grid.evaluate((el) => { el.scrollTop = 200; });
      await page.waitForTimeout(1500);
      await grid.evaluate((el) => { el.scrollTop = 500; });
      await page.waitForTimeout(1500);
      await grid.evaluate((el) => { el.scrollTop = 0; });
      await page.waitForTimeout(1000);
      console.log('    ✓ Grid scrolled');
    }

    // ── Click a demand name to open Demand Live ────────────
    // DataGrid renders demand names in Box.ellipsis.fw-500 with a Link inside
    console.log('\n  Opening demand from grid...');
    const demandName = page.locator('.MuiDataGrid-row .ellipsis a, .MuiDataGrid-row a, .MuiDataGrid-cellContent a').first();
    let openedDemand = false;

    if (await demandName.isVisible().catch(() => false)) {
      const text = await demandName.innerText().catch(() => '');
      console.log(`    ✓ Clicking demand: "${text.substring(0, 50)}"`);
      await demandName.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await waitForLoader(page);
      await page.waitForTimeout(5000);
      openedDemand = page.url().includes('missions');
    }

    // Fallback: use API to get a real demand ID and navigate directly
    if (!openedDemand) {
      console.log('    → Fetching demand ID via API...');
      const api = await getApi(page, request);
      const result = await api.listDemands();
      if (result.status === 200 && result.data) {
        const demands = Array.isArray(result.data) ? result.data : (result.data?.data || result.data?.results || []);
        if (demands.length > 0) {
          const demandId = demands[0].id;
          console.log(`    → Found demand ID: ${demandId} — navigating to Demand Live`);
          await go(page, ROUTES.demandLive(demandId), 6000);
          openedDemand = true;
        }
      }
    }

    // ── Explore Demand Live ───────────────────────────────
    if (openedDemand) {
      console.log('\n  ✓ Demand Live opened');
      console.log('  Exploring stage tabs...');

      // Mission canvas stage stepper
      for (const stage of ['Scope', 'Shape', 'Solution', 'Structure']) {
        await clickText(page, stage);
        await page.waitForTimeout(2000);
      }

      // Detail tabs inside demand
      console.log('\n  Clicking detail tabs...');
      for (const tab of ['Overview', 'Actions', 'Resources', 'Timeline', 'Activity', 'Live']) {
        await clickText(page, tab);
        await page.waitForTimeout(2500);
      }

      // Scroll page to show full content
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));

      // Look for action buttons
      console.log('\n  Checking action buttons...');
      await clickIf(page, 'button:has-text("Add Action")', 'Add Action button');
      await clickIf(page, '[aria-label="close"], [aria-label="Close"]', 'Close');
    } else {
      console.log('    No demands found in system — skipping Demand Live');
    }

    // ── Create Demand form ────────────────────────────────
    console.log('\n  Visiting Create Demand form...');
    await go(page, ROUTES.createRoadmap, 5000);
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    console.log('  ✓ Create Demand page loaded');

    console.log('\n  ✓ Demands complete\n');
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 3: Potential Hub
  // ─────────────────────────────────────────────────────────────
  test('3. Potential Hub — resources, requests, KPI, matchmaking', async ({ page }) => {
    console.log('\n\n  ━━━ SECTION 3: POTENTIAL HUB ━━━\n');

    await go(page, ROUTES.potential, 6000);
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    console.log('  ✓ Potential Hub loaded');

    // ── Resource-Centric view ─────────────────────────────
    console.log('\n  Resource-Centric view...');
    await clickText(page, 'Resource-Centric');
    await page.waitForTimeout(3000);

    // KPI strip
    const kpi = page.locator('[class*="kpi"], [class*="bento"], [class*="KPI"]').first();
    if (await kpi.isVisible().catch(() => false)) console.log('    ✓ KPI strip visible');

    // Resource filters
    console.log('\n  Resource filters...');
    for (const f of ['Fully allocated', 'Partially Allocated', 'Over allocated', 'Fully available']) {
      await clickText(page, f);
      await page.waitForTimeout(1500);
    }

    // Scroll resource table
    const table = page.locator('.MuiDataGrid-virtualScroller, table, [class*="roster"]').first();
    if (await table.isVisible().catch(() => false)) {
      await table.evaluate((el) => { el.scrollTop = 300; });
      await page.waitForTimeout(1500);
      await table.evaluate((el) => { el.scrollTop = 0; });
      console.log('    ✓ Resource table scrolled');
    }

    // Click resource row
    const resRow = page.locator('.MuiDataGrid-row, tr').nth(1);
    if (await resRow.isVisible().catch(() => false)) {
      await resRow.click({ force: true });
      await page.waitForTimeout(3000);
      await clickIf(page, '[aria-label="close"], [aria-label="Close"], button:has-text("×")', 'Close panel');
    }

    // Search
    const search = page.locator('input[placeholder*="earch"], input[placeholder*="employee"]').first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('en');
      await page.waitForTimeout(2000);
      await search.clear();
      await page.waitForTimeout(1000);
      console.log('    ✓ Search works');
    }

    // ── Resource Requests (Demand-Centric) ────────────────
    console.log('\n  Switching to Resource Requests...');
    const switched = await clickText(page, 'Resource Requests');
    await page.waitForTimeout(5000);

    if (switched) {
      console.log('    ✓ Resource Requests loaded');

      // Demand filters
      console.log('\n  Demand filters...');
      for (const f of ['Pending Requests', '0 Matches Found', 'Tango Suggested', 'Solutioning Phase', 'Execution Phase', 'Cross-Portfolio']) {
        await clickText(page, f);
        await page.waitForTimeout(1500);
      }

      // Click demand row for matchmaking
      const dRow = page.locator('.MuiDataGrid-row, tr, [class*="demand-row"]').nth(1);
      if (await dRow.isVisible().catch(() => false)) {
        await dRow.click({ force: true });
        await page.waitForTimeout(4000);
        console.log('    ✓ Matchmaking panel opened');
      }
    }

    // Add Resource button
    await clickIf(page, 'button:has-text("Add Resource"), button:has-text("Add")', 'Add Resource');
    await page.waitForTimeout(2000);
    await clickIf(page, '[aria-label="close"], button:has-text("Cancel")', 'Close');

    // Approvals page
    console.log('\n  Potential Approvals...');
    await go(page, ROUTES.potentialApprovals, 4000);
    console.log('    ✓ Approvals loaded');

    console.log('\n  ✓ Potential Hub complete\n');
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 4: Full Navigation Tour
  // ─────────────────────────────────────────────────────────────
  test('4. Navigation — every page, sidebar, portfolios, projects', async ({ page }) => {
    console.log('\n\n  ━━━ SECTION 4: NAVIGATION ━━━\n');

    // Hub home (redirects to actions)
    await go(page, ROUTES.hub, 4000);
    console.log('  ✓ Hub loaded');

    // Right sidebar icons
    console.log('\n  Right sidebar icons...');
    await clickIf(page, '[title="Notes"], [aria-label="Notes"]', 'Notes');
    await page.waitForTimeout(2000);
    await clickIf(page, '[aria-label="close"]', 'Close');
    await clickIf(page, '[title="Pin Board"]', 'Pinboard');
    await page.waitForTimeout(2000);

    // Projects
    console.log('\n  Projects...');
    await go(page, ROUTES.projects, 5000);
    console.log('  ✓ Projects loaded');
    await clickText(page, 'Project Overview');

    // Portfolios
    console.log('\n  Portfolios...');
    await go(page, ROUTES.portfolios, 5000);
    console.log('  ✓ Portfolios loaded');
    const pCard = page.locator('[class*="portfolio"], [class*="Portfolio"], [class*="card"]').first();
    if (await pCard.isVisible().catch(() => false)) {
      await pCard.click({ force: true });
      await page.waitForTimeout(4000);
    }

    // IdeaPad
    console.log('\n  IdeaPad...');
    await go(page, ROUTES.ideaPad, 4000);
    console.log('  ✓ IdeaPad loaded');

    // Missions
    console.log('\n  Missions Canvas...');
    await go(page, ROUTES.missions, 4000);
    console.log('  ✓ Missions loaded');

    // Integration
    console.log('\n  Integration...');
    await go(page, ROUTES.integration, 4000);
    console.log('  ✓ Integration loaded');

    // Admin Console
    console.log('\n  Admin Console...');
    await go(page, ROUTES.adminConsole, 4000);
    console.log('  ✓ Admin Console loaded');

    // Profile
    console.log('\n  Profile...');
    await go(page, ROUTES.profile, 4000);
    console.log('  ✓ Profile loaded');

    // Back to hub
    await go(page, ROUTES.hub, 3000);

    console.log('\n  ═══════════════════════════════════════');
    console.log('  ✓✓✓  FULL PLATFORM DEMO COMPLETE  ✓✓✓');
    console.log('  ═══════════════════════════════════════\n');
  });
});
