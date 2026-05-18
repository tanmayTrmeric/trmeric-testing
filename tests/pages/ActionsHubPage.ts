import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../helpers/urls';

/**
 * Actions Hub Page Object
 *
 * Covers:
 *   - Actions list / kanban view
 *   - Filter tabs (All, Overdue, In Progress, etc.)
 *   - Action detail drawer
 *   - Add Actions form
 */
export class ActionsHubPage extends BasePage {

  // ── Core Elements ────────────────────────────────────────
  readonly actionsList = this.page.locator('[class*="action"], [class*="kanban"], [class*="list"], table').first();
  readonly filterTabs = this.page.locator('[role="tab"], [class*="tab"], button:has-text("Overdue"), button:has-text("All")');
  readonly addActionBtn = this.page.getByRole('button', { name: /add action/i }).first();

  // ── Search ───────────────────────────────────────────────
  readonly searchInput = this.page.locator('input[placeholder*="earch"], input[type="search"]').first();

  async navigate() {
    await this.goto(ROUTES.actions);
  }

  async assertPageLoaded() {
    await this.assertNoCrash();
    await expect(this.actionsList).toBeVisible({ timeout: 15_000 });
  }

  async getFilterTabCount(): Promise<number> {
    return this.filterTabs.count();
  }

  async search(query: string) {
    const visible = await this.searchInput.isVisible().catch(() => false);
    if (visible) {
      await this.searchInput.fill(query);
      await this.page.waitForTimeout(600);
    }
    return visible;
  }
}
