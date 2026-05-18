import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 *
 * Handles both token injection and browser-based login flows.
 */
export class LoginPage extends BasePage {
  readonly emailInput = this.page.locator('input').first();
  readonly passwordInput = this.page.locator('input[type="password"]').first();
  readonly continueBtn = this.page.locator(
    'button:has-text("CONTINUE"), button:has-text("Continue"), button[type="submit"]'
  ).first();
  readonly loginBtn = this.page.locator(
    'button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]'
  ).first();

  async navigate() {
    await this.goto('/sign-in');
  }

  async fillEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    const visible = await this.passwordInput.isVisible().catch(() => false);
    if (!visible) {
      await this.continueBtn.click();
      await this.page.waitForTimeout(3000);
      await this.passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    }
    await this.passwordInput.fill(password);
  }

  async injectToken(token: string) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.page.evaluate((jwt) => {
      localStorage.setItem('tenant_token', jwt);
      localStorage.setItem('trmeric_token', jwt);
    }, token);
  }

  async assertLoginPageVisible() {
    await expect(this.emailInput).toBeVisible({ timeout: 20_000 });
  }
}
