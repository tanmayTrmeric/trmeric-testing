import { test as setup, expect } from '@playwright/test';
import { ALL_ROLES, isRoleConfigured, getFallbackAuthFile } from './helpers/roles';

/**
 * Authentication Setup — Production-Grade Multi-Role Login
 *
 * Features:
 *   - Token injection mode (instant, for CI)
 *   - Browser login mode (manual MFA, for local dev)
 *   - Validates auth actually worked (checks for redirect back to login)
 *   - Creates fallback auth files so unconfigured roles don't crash tests
 *   - Clear console output showing what's configured and what's skipped
 */

// ── Token Mode (instant, no browser) ────────────────────────
setup('Auth: Token injection (if configured)', async ({ page, context }) => {
  setup.setTimeout(0);

  const token = (process.env.TRMERIC_AUTH_TOKEN || '').trim();
  if (!token) {
    console.log('⏭  No TRMERIC_AUTH_TOKEN set — browser login will run for configured roles.\n');
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await context.storageState({ path: getFallbackAuthFile() });
    return;
  }

  console.log('\n🔑 Token mode — injecting JWT...\n');

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((jwt) => {
    localStorage.setItem('tenant_token', jwt);
    localStorage.setItem('trmeric_token', jwt);
  }, token);

  await context.addCookies([{
    name: 'tenant_token',
    value: token,
    domain: new URL(page.url()).hostname,
    path: '/',
  }]);

  await page.goto('/actionhub/my-hub', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // Validate token worked — we should NOT be on the login page
  const url = page.url();
  if (url.includes('/sign-in')) {
    console.log('Token injection failed — still on login page. Token may be expired.');
    // Still save the state so tests don't crash with ENOENT — they'll just get 401s
  } else {
    console.log('Token injected successfully');
  }

  // Save as default AND as RM (token user is RM)
  await context.storageState({ path: getFallbackAuthFile() });
  await context.storageState({ path: './tests/.auth/rm.json' });
});

// ── Browser Login Mode (per role) ───────────────────────────
for (const role of ALL_ROLES) {
  setup(`Auth: Login as ${role.name}`, async ({ page, context }) => {
    setup.setTimeout(0); // No timeout — wait for MFA

    // Skip if token mode is active (already authenticated)
    if (process.env.TRMERIC_AUTH_TOKEN) {
      console.log(`⏭  ${role.name} — skipped (using token mode)`);
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await context.storageState({ path: role.authFile });
      return;
    }

    const email = process.env[role.emailEnv] || '';
    const password = process.env[role.passEnv] || '';

    // Also check legacy env vars as fallback for RM
    const fallbackEmail = role.key === 'rm' ? (process.env.TRMERIC_TEST_EMAIL || '') : '';
    const fallbackPass = role.key === 'rm' ? (process.env.TRMERIC_TEST_PASSWORD || '') : '';

    const finalEmail = email || fallbackEmail;
    const finalPass = password || fallbackPass;

    if (!finalEmail || !finalPass) {
      console.log(`⏭  ${role.name} — skipped (${role.emailEnv} not set in .env)`);
      // Create empty auth file so tests that reference it don't crash
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await context.storageState({ path: role.authFile });
      return;
    }

    console.log(`\n🔑 Logging in as ${role.name} (${finalEmail})...\n`);

    // ── Screen 1: Email ─────────────────────────────────────
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input').first();
    await emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await emailInput.fill(finalEmail);

    // ── Screen 2: Password ──────────────────────────────────
    let passwordInput = page.locator('input[type="password"]').first();
    const passwordVisible = await passwordInput.isVisible().catch(() => false);

    if (!passwordVisible) {
      const continueBtn = page.locator('button:has-text("CONTINUE"), button:has-text("Continue"), button[type="submit"]').first();
      await continueBtn.click();
      await page.waitForTimeout(3000);
      passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    }

    await passwordInput.fill(finalPass);

    // ── Manual step: click login + handle MFA ────────────────
    console.log(`\n👆 ${role.name}: Email & password filled.`);
    console.log(`   Click the login button, then enter MFA if asked.\n`);

    // Wait until app loads (user clicks login + does MFA)
    await page.waitForURL('**/actionhub/**', { timeout: 0 });
    await page.waitForLoadState('domcontentloaded');

    // ── Validate login succeeded ─────────────────────────────
    const finalUrl = page.url();
    if (finalUrl.includes('/sign-in')) {
      console.log(`  ${role.name} login may have failed — still on sign-in page`);
    } else {
      console.log(`  ${role.name} logged in — saved to ${role.authFile}`);
    }

    await context.storageState({ path: role.authFile });

    // Also save as default user.json if this is the RM role
    if (role.key === 'rm') {
      await context.storageState({ path: getFallbackAuthFile() });
    }
  });
}
