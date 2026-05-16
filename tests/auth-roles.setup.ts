import { test as setup } from '@playwright/test';

/**
 * Multi-Role Auth Setup
 *
 * Logs in as different personas and saves each session.
 * Tests can then use the specific role's auth state.
 *
 * Required .env variables:
 *   TRMERIC_TEST_EMAIL / TRMERIC_TEST_PASSWORD           — Resource Manager
 *   TRMERIC_TEST_NONRM_EMAIL / TRMERIC_TEST_NONRM_PASSWORD — Demand Owner (non-RM)
 *   TRMERIC_TEST_PL_EMAIL / TRMERIC_TEST_PL_PASSWORD       — Portfolio Leader
 */

const ROLES = [
  {
    name: 'Resource Manager',
    file: './tests/.auth/rm.json',
    emailEnv: 'TRMERIC_TEST_EMAIL',
    passEnv: 'TRMERIC_TEST_PASSWORD',
  },
  {
    name: 'Demand Owner',
    file: './tests/.auth/do.json',
    emailEnv: 'TRMERIC_TEST_NONRM_EMAIL',
    passEnv: 'TRMERIC_TEST_NONRM_PASSWORD',
  },
  {
    name: 'Portfolio Leader',
    file: './tests/.auth/pl.json',
    emailEnv: 'TRMERIC_TEST_PL_EMAIL',
    passEnv: 'TRMERIC_TEST_PL_PASSWORD',
  },
];

for (const role of ROLES) {
  setup(`Login as ${role.name}`, async ({ page }) => {
    setup.setTimeout(0); // No timeout for MFA

    const email = process.env[role.emailEnv] || '';
    const password = process.env[role.passEnv] || '';

    if (!email || !password) {
      console.log(`⏭️  Skipping ${role.name} — ${role.emailEnv} not set in .env`);
      await page.goto('/');
      await page.context().storageState({ path: role.file });
      return;
    }

    console.log(`\n🔑 Logging in as ${role.name} (${email})...`);

    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(password);

    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Continue")').first();
    await submitButton.click();

    // Handle MFA — wait for you to type the code
    try {
      const mfaInput = page.locator('input[name="code"], input[placeholder*="code"], input[type="tel"]').first();
      await mfaInput.waitFor({ state: 'visible', timeout: 5_000 });
      console.log(`\n🔐 MFA for ${role.name} — enter code in browser. Take your time.\n`);
      await page.waitForURL('**/actionhub/**', { timeout: 0 });
    } catch {
      // No MFA
    }

    await page.waitForURL('**/actionhub/**', { timeout: 30_000 }).catch(() => {
      return page.waitForNavigation({ timeout: 15_000 });
    });

    console.log(`✅ ${role.name} logged in — saved to ${role.file}`);
    await page.context().storageState({ path: role.file });
  });
}
