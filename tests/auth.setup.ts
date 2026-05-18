import { test as setup } from '@playwright/test';
import { ALL_ROLES, isRoleConfigured, getFallbackAuthFile } from './helpers/roles';

/**
 * Authentication Setup — Multi-Role Login
 *
 * Logs in as each configured role and saves browser state.
 * Skips roles without credentials in .env.
 *
 * Login flow per role:
 *   1. Fill email
 *   2. Fill password
 *   3. YOU click login button manually (avoids Google SSO redirect)
 *   4. YOU enter MFA if prompted
 *   5. Auth state saved to tests/.auth/{role}.json
 *
 * Token mode: Set TRMERIC_AUTH_TOKEN to skip all browser logins.
 */

// ── Token Mode (instant, no browser) ────────────────────────
setup('Auth: Token injection (if configured)', async ({ page, context }) => {
  setup.setTimeout(0);

  const token = (process.env.TRMERIC_AUTH_TOKEN || '').trim();
  if (!token) {
    // No token — browser login per role will handle auth.
    // Still create a minimal user.json so tests don't crash with ENOENT
    // if no role credentials are configured either.
    console.log('⏭️  No TRMERIC_AUTH_TOKEN set — browser login will run for configured roles.\n');
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

  // Save as default AND as RM (token user is RM)
  await context.storageState({ path: getFallbackAuthFile() });
  await context.storageState({ path: './tests/.auth/rm.json' });
  console.log('✅ Token injected — saved auth state');
});

// ── Browser Login Mode (per role) ───────────────────────────
for (const role of ALL_ROLES) {
  setup(`Auth: Login as ${role.name}`, async ({ page, context }) => {
    setup.setTimeout(0); // No timeout — wait for MFA

    // Skip if token mode is active (already authenticated)
    if (process.env.TRMERIC_AUTH_TOKEN) {
      console.log(`⏭️  ${role.name} — skipped (using token mode)`);
      // Copy token auth state to this role's file
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
      console.log(`⏭️  ${role.name} — skipped (${role.emailEnv} not set in .env)`);
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
      // Two-step: click CONTINUE first
      const continueBtn = page.locator('button:has-text("CONTINUE"), button:has-text("Continue"), button[type="submit"]').first();
      await continueBtn.click();
      await page.waitForTimeout(3000);
      passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    }

    await passwordInput.fill(finalPass);

    // ── YOU click login + handle MFA ────────────────────────
    console.log(`\n👆 ${role.name}: Email & password filled.`);
    console.log(`   Click the login button, then enter MFA if asked.\n`);

    // Wait forever until app loads
    await page.waitForURL('**/actionhub/**', { timeout: 0 });

    await page.waitForLoadState('domcontentloaded');
    console.log(`✅ ${role.name} logged in — saved to ${role.authFile}`);
    await context.storageState({ path: role.authFile });

    // Also save as default user.json if this is the RM role
    if (role.key === 'rm') {
      await context.storageState({ path: getFallbackAuthFile() });
    }
  });
}
