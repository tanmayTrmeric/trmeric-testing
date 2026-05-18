import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../helpers/urls';

/**
 * My Hub (Dashboard) Page Object
 */
export class MyHubPage extends BasePage {
  readonly dashboardContent = this.page.locator('#root').first();

  async navigate() {
    await this.goto(ROUTES.myHub);
  }

  async assertDashboardLoaded() {
    await this.assertNoCrash();
    await expect(this.dashboardContent).toBeVisible({ timeout: 15_000 });
  }
}
