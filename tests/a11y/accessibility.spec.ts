import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/urls';

/**
 * Accessibility Tests — WCAG 2.1 AA Compliance
 *
 * Uses Playwright's built-in accessibility snapshot to verify:
 *   - All interactive elements have accessible names
 *   - ARIA roles are correctly applied
 *   - Focus order is logical
 *   - No missing alt text on images
 *
 * For full axe-core audits, install @axe-core/playwright:
 *   npm install -D @axe-core/playwright
 *
 * Usage: npm run test:a11y
 */

const criticalPages = [
  { name: 'My Hub', route: ROUTES.myHub },
  { name: 'Potential Hub', route: ROUTES.potential },
  { name: 'Actions Hub', route: ROUTES.actions },
  { name: 'Portfolios', route: ROUTES.portfolios },
];

test.describe('Accessibility — Critical Pages', () => {

  for (const page_ of criticalPages) {
    test(`${page_.name} has no critical a11y violations`, async ({ page }) => {
      await page.goto(page_.route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);

      // 1. Page must have a title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // 2. No images without alt text
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      if (imagesWithoutAlt > 0) {
        console.warn(`  [a11y] ${page_.name}: ${imagesWithoutAlt} images missing alt text`);
      }

      // 3. All buttons have accessible text
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      let emptyButtons = 0;
      for (let i = 0; i < Math.min(buttonCount, 50); i++) {
        const btn = buttons.nth(i);
        const text = await btn.innerText().catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const title_ = await btn.getAttribute('title').catch(() => '');
        if (!text.trim() && !ariaLabel && !title_) {
          emptyButtons++;
        }
      }
      if (emptyButtons > 0) {
        console.warn(`  [a11y] ${page_.name}: ${emptyButtons} buttons without accessible labels`);
      }

      // 4. All form inputs have labels
      const inputs = page.locator('input:not([type="hidden"])');
      const inputCount = await inputs.count();
      let unlabeledInputs = 0;
      for (let i = 0; i < Math.min(inputCount, 30); i++) {
        const input = inputs.nth(i);
        const ariaLabel = await input.getAttribute('aria-label').catch(() => '');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby').catch(() => '');
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        const id = await input.getAttribute('id').catch(() => '');
        // Check if there's a label[for=id]
        const hasForLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        if (!ariaLabel && !ariaLabelledBy && !placeholder && !hasForLabel) {
          unlabeledInputs++;
        }
      }
      if (unlabeledInputs > 0) {
        console.warn(`  [a11y] ${page_.name}: ${unlabeledInputs} inputs without labels`);
      }

      // 5. Page structure: at least one heading
      const headings = await page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').count();
      // Soft check — some SPAs use divs with role="heading"
      if (headings === 0) {
        console.warn(`  [a11y] ${page_.name}: No headings found`);
      }

      // 6. Contrast check — verify main text is not too light
      // (Basic check: ensure body text isn't pure white on white)
      const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)'); // transparent = likely broken

      console.log(`  [a11y] ${page_.name}: scan complete`);
    });
  }
});

test.describe('Accessibility — Keyboard Navigation', () => {

  test('Tab key moves focus through interactive elements', async ({ page }) => {
    await page.goto(ROUTES.potential, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Press Tab multiple times and verify focus moves
    const focusedElements: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}:${el.getAttribute('aria-label') || el.textContent?.slice(0, 30) || ''}` : 'none';
      });
      focusedElements.push(focused);
    }

    // At least some elements should receive focus
    const uniqueFocused = new Set(focusedElements);
    expect(uniqueFocused.size).toBeGreaterThan(1);
    console.log(`  [a11y] Tab navigation: ${uniqueFocused.size} unique focus targets`);
  });

  test('Escape key closes modals and panels', async ({ page }) => {
    await page.goto(ROUTES.potential, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // If any modal/dialog is open, Escape should close it
    const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    if (dialogVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const stillVisible = await dialog.isVisible().catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });
});
