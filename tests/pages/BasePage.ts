import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object — shared methods for all Trmeric pages.
 *
 * Every page object extends this. Encapsulates:
 *   - SPA navigation with proper waits
 *   - Error boundary checking
 *   - Common locator patterns
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to a route, wait for React SPA to hydrate */
  async goto(route: string) {
    await this.page.goto(route, { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('div[id="root"] *', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /** Assert no React error boundary on page */
  async assertNoCrash() {
    const error = this.page.locator('text=Something went wrong');
    await expect(error).not.toBeVisible();
  }

  /** Assert page has visible content (not blank white screen) */
  async assertHasContent() {
    const body = await this.page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(10);
  }

  /** Check if user is still authenticated (not redirected to sign-in) */
  async assertAuthenticated() {
    expect(this.page.url()).not.toContain('/sign-in');
  }

  /** Wait for a network request to complete */
  async waitForApi(urlPattern: string | RegExp, timeout = 15_000) {
    return this.page.waitForResponse(
      (resp) => {
        const url = resp.url();
        if (typeof urlPattern === 'string') return url.includes(urlPattern);
        return urlPattern.test(url);
      },
      { timeout }
    );
  }

  /** Get visible text content of the page */
  async getPageText(): Promise<string> {
    return this.page.locator('body').innerText();
  }
}
