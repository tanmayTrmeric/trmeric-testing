import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../helpers/urls';

/**
 * Potential Hub Page Object — Resource Management
 *
 * Covers:
 *   - Sidebar navigation (Resource-Centric, Resource Requests, Retrospective, etc.)
 *   - KPI Bento Strip
 *   - Roster table (Resource-Centric view)
 *   - Demand table (Resource Requests view)
 *   - Matchmaking panel
 *   - Add Resource panel
 */
export class PotentialHubPage extends BasePage {

  // ── Sidebar ──────────────────────────────────────────────
  readonly sidebar = this.page.locator('[class*="sidebar"], [class*="Sidebar"], [role="navigation"], nav').first();
  readonly resourceCentricTab = this.page.getByText('Resource-Centric', { exact: false }).first();
  readonly resourceRequestsTab = this.page.getByText('Resource Requests', { exact: false }).first();
  readonly retrospectiveTab = this.page.getByText('Retrospective', { exact: false }).first();
  readonly allocatedTab = this.page.getByText('Allocated', { exact: false }).first();

  // ── KPI Strip ────────────────────────────────────────────
  readonly kpiStrip = this.page.locator('[class*="kpi"], [class*="bento"], [class*="strip"], [class*="KPI"]').first();

  // ── Roster Table (Resource-Centric) ──────────────────────
  readonly rosterTable = this.page.locator('table, [class*="roster"], [class*="table"]').first();
  readonly rosterRows = this.page.locator('tr, [class*="tableRow"], [class*="row"]');

  // ── Search ───────────────────────────────────────────────
  readonly searchInput = this.page.locator(
    'input[placeholder*="earch"], input[placeholder*="employee"], input[type="search"]'
  ).first();

  // ── Resource Requests View ───────────────────────────────
  readonly demandTable = this.page.locator('table, [class*="table"], [class*="Table"], [class*="demand"]').first();
  readonly demandGroupRows = this.page.locator('[class*="demandGroup"], tr[class*="demand"], [class*="groupRow"]');

  // ── Matchmaking Panel ────────────────────────────────────
  readonly matchmakingPanel = this.page.locator('[class*="matchPanel"], [class*="matchmaking"], [class*="MatchmakingPanel"]').first();
  readonly matchmakingSearch = this.page.locator('input[placeholder*="Search Full Roster"], input[placeholder*="earch"]');
  readonly softLockBtn = this.page.getByRole('button', { name: /soft.?lock/i }).first();
  readonly hardLockBtn = this.page.getByRole('button', { name: /hard.?lock/i }).first();

  // ── Pending Changes ──────────────────────────────────────
  readonly pendingChangesCard = this.page.getByText('Pending Timeline Changes', { exact: false }).first();

  // ── RM Required Banner ───────────────────────────────────
  readonly rmRequiredBanner = this.page.getByText('Resource Manager Access Required');

  // ── Lock Overlay (non-RM) ────────────────────────────────
  get resourceRequestsLockOverlay() {
    return this.resourceRequestsTab.locator('..').locator('[class*="not-allowed"]');
  }

  // ── Navigation ───────────────────────────────────────────

  async navigate() {
    await this.goto(ROUTES.potential);
  }

  async switchToResourceRequests() {
    await this.resourceRequestsTab.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  async switchToRetrospective() {
    await this.retrospectiveTab.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  async switchToResourceCentric() {
    await this.resourceCentricTab.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  // ── Assertions ───────────────────────────────────────────

  async assertHubLoaded() {
    await this.assertNoCrash();
    await expect(this.sidebar).toBeVisible({ timeout: 10_000 });
  }

  async assertRosterVisible() {
    await expect(this.rosterTable).toBeVisible({ timeout: 15_000 });
    const count = await this.rosterRows.count();
    expect(count).toBeGreaterThan(0);
  }

  async assertKpiVisible() {
    const visible = await this.kpiStrip.isVisible().catch(() => false);
    return visible;
  }

  async assertResourceRequestsUnlocked() {
    await expect(this.resourceRequestsTab).toBeVisible({ timeout: 10_000 });
    const locked = await this.resourceRequestsLockOverlay.isVisible().catch(() => false);
    expect(locked).toBeFalsy();
  }

  async assertResourceRequestsLocked() {
    const locked = await this.resourceRequestsLockOverlay.isVisible().catch(() => false);
    expect(locked).toBeTruthy();
  }

  async assertNoRmBanner() {
    await expect(this.rmRequiredBanner).not.toBeVisible();
  }

  // ── Actions ──────────────────────────────────────────────

  async search(query: string) {
    const visible = await this.searchInput.isVisible().catch(() => false);
    if (visible) {
      await this.searchInput.fill(query);
      await this.page.waitForTimeout(600); // debounce
    }
    return visible;
  }

  async clickFirstDemandGroup() {
    const count = await this.demandGroupRows.count();
    if (count > 0) {
      await this.demandGroupRows.first().click();
      return true;
    }
    return false;
  }

  async clickReviewButton() {
    const btn = this.page.getByRole('button', { name: /review/i }).first();
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.click();
      return true;
    }
    return false;
  }
}
