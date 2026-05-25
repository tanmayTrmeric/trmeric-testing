import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Setup — Pre-flight checks before any test runs.
 *
 * Validates:
 *   1. Environment configuration
 *   2. Backend reachability
 *   3. Frontend reachability (dev mode)
 *   4. Auth file directories exist
 *
 * Fails fast with clear errors so you don't wait 15 minutes
 * only to find out the backend was down.
 */

const INSTANCES: Record<string, { frontend: string; backend: string }> = {
  dev:  { frontend: 'http://localhost:5173', backend: 'https://trmeric-strong.trmeric.com' },
  qa:   { frontend: 'https://trmeric-live.trmeric.com', backend: 'https://trmeric-strong.trmeric.com' },
  eu:   { frontend: 'https://trmeric-eu.trmeric.com', backend: 'https://trmeric-eu-strong.trmeric.com' },
  prod: { frontend: 'https://app.trmeric.com', backend: 'https://api.trmeric.com' },
};

async function globalSetup() {
  const env = process.env.TRMERIC_ENV || 'dev';
  const instance = INSTANCES[env] || INSTANCES.dev;
  const backend = process.env.TRMERIC_BASE_URL || instance.backend;
  const frontend = instance.frontend;

  console.log('\n========================================');
  console.log('  TRMERIC PRE-FLIGHT CHECKS');
  console.log('========================================\n');
  console.log(`  Environment:  ${env.toUpperCase()}`);
  console.log(`  Frontend:     ${frontend}`);
  console.log(`  Backend:      ${backend}`);

  const errors: string[] = [];
  const warnings: string[] = [];

  // ── 1. Check auth configuration ────────────────────────
  const hasToken = !!(process.env.TRMERIC_AUTH_TOKEN || '').trim();
  const hasRmEmail = !!(process.env.TRMERIC_RM_EMAIL || process.env.TRMERIC_TEST_EMAIL || '').trim();

  if (hasToken) {
    console.log('  Auth mode:    Token injection');
  } else if (hasRmEmail) {
    console.log('  Auth mode:    Browser login (MFA required)');
  } else {
    warnings.push('No auth configured — set TRMERIC_AUTH_TOKEN or TRMERIC_RM_EMAIL in .env');
    console.log('  Auth mode:    NONE (smoke tests only)');
  }

  // ── 2. Backend reachability ────────────────────────────
  console.log('\n  Checking backend...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${backend}/api/capacity/portfolio_resource_managers`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const status = res.status;
    if (status === 502 || status === 503) {
      errors.push(`Backend returned ${status} — server is down or deploying`);
      console.log(`  Backend:      FAIL (${status})`);
    } else {
      console.log(`  Backend:      OK (${status})`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      errors.push(`Backend unreachable — timed out after 10s (${backend})`);
      console.log('  Backend:      TIMEOUT');
    } else {
      errors.push(`Backend unreachable — ${err.message || err} (${backend})`);
      console.log(`  Backend:      FAIL (${err.message || 'connection refused'})`);
    }
  }

  // ── 3. Frontend reachability (only for dev) ────────────
  if (env === 'dev') {
    console.log('  Checking frontend...');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      await fetch(frontend, { signal: controller.signal });
      clearTimeout(timeout);
      console.log('  Frontend:     OK');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        errors.push(`Frontend unreachable — is your dev server running? (${frontend})`);
      } else {
        errors.push(`Frontend unreachable — run "npm run dev" in the frontend project first (${frontend})`);
      }
      console.log('  Frontend:     FAIL — start your dev server');
    }
  }

  // ── 4. Ensure auth directory exists ────────────────────
  const authDir = path.resolve(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // ── 5. Check .env file ─────────────────────────────────
  const envFile = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) {
    warnings.push('.env file not found — copy .env.example to .env and configure credentials');
  }

  // ── Report ─────────────────────────────────────────────
  if (warnings.length > 0) {
    console.log('\n  WARNINGS:');
    for (const w of warnings) {
      console.log(`    - ${w}`);
    }
  }

  if (errors.length > 0) {
    console.log('\n  BLOCKERS:');
    for (const e of errors) {
      console.log(`    - ${e}`);
    }
    console.log('\n========================================');
    console.log('  PRE-FLIGHT FAILED — Fix the above');
    console.log('========================================\n');
    throw new Error(`Pre-flight failed:\n${errors.join('\n')}`);
  }

  console.log('\n========================================');
  console.log('  PRE-FLIGHT PASSED — Starting tests');
  console.log('========================================\n');
}

export default globalSetup;
