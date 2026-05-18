import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Demand Live Page Object
 *
 * The detail view for a single demand — shows live data,
 * activity feed, resource requirements, and lifecycle state.
 */
export class DemandLivePage extends BasePage {

  // ── Core Elements ────────────────────────────────────────
  readonly demandTitle = this.page.locator('h1, h2, [class*="title"], [class*="demandName"]').first();
  readonly activityFeed = this.page.locator('[class*="activity"], [class*="Activity"], [class*="feed"]').first();
  readonly resourceCard = this.page.locator('[class*="resource"], [class*="Resource"]').first();
  readonly statusBadge = this.page.locator('[class*="status"], [class*="badge"], [class*="state"]').first();

  // ── Lifecycle / Workflow ─────────────────────────────────
  readonly transitionBtn = this.page.getByRole('button', { name: /transition|approve|reject|submit/i }).first();
  readonly workflowStepper = this.page.locator('[class*="stepper"], [class*="workflow"], [class*="stage"]').first();

  // ── Tabs ─────────────────────────────────────────────────
  readonly overviewTab = this.page.getByText('Overview', { exact: false }).first();
  readonly kpisTab = this.page.getByText('KPIs', { exact: false }).first();
  readonly teamTab = this.page.getByText('Team', { exact: false }).first();

  async navigate(demandId: number | string) {
    await this.goto(`/actionhub/roadmap/${demandId}/live`);
  }

  async navigateToMyRoadmaps() {
    await this.goto('/actionhub/my-roadmaps');
  }

  async assertDemandLoaded() {
    await this.assertNoCrash();
    await this.assertHasContent();
  }

  async getDemandTitleText(): Promise<string> {
    return this.demandTitle.innerText().catch(() => '');
  }
}
