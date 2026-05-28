import { test, expect } from '@playwright/test';
import { URLS, ALL_ENDPOINTS } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ===================================================================
 * ALL API ENDPOINTS — Comprehensive Contract Test
 * ===================================================================
 *
 * Tests EVERY backend endpoint for existence (not 404/500).
 * Unauthenticated: checks endpoint responds (401/403 = exists).
 * Authenticated: validates response shape where possible.
 *
 * Total: ${ALL_ENDPOINTS.length}+ endpoints tested.
 * ===================================================================
 */

// ── Unauthenticated: Every endpoint exists ──────────────────
test.describe(`All API Endpoints — Existence Check (${ALL_ENDPOINTS.length} endpoints)`, () => {

  // Skip parameterized endpoints (contain {id}, {type}) — those need real IDs
  const staticEndpoints = ALL_ENDPOINTS.filter(ep => !ep.path.includes('{'));

  for (const ep of staticEndpoints) {
    test(`[${ep.method}] ${ep.name} — ${ep.path}`, async ({ request }) => {
      const url = `${URLS.backend}${ep.path}`;
      const response = ep.method === 'POST'
        ? await request.post(url)
        : ep.method === 'PUT'
        ? await request.put(url)
        : ep.method === 'PATCH'
        ? await request.patch(url)
        : ep.method === 'DELETE'
        ? await request.delete(url)
        : await request.get(url);

      const status = response.status();
      console.log(`    ${ep.name}: ${status}`);

      // 404 = endpoint removed (FAIL)
      expect(status, `${ep.name} returned 404 — endpoint missing`).not.toBe(404);
      // 500+ = server crash (FAIL)
      expect(status, `${ep.name} returned ${status} — server error`).toBeLessThan(500);
    });
  }
});

// ── Authenticated: Shape validation for key data endpoints ───
test.describe('All API Endpoints — Authenticated Data Validation', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/actions');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('GET /api/users/user returns user info', async () => {
    const r = await api.getUserInfo();
    expect([200, 403]).toContain(r.status);
    if (r.ok) {
      console.log(`    User: ${JSON.stringify(r.data).substring(0, 100)}`);
    }
  });

  test('GET /api/users/get-org-role returns roles', async () => {
    const r = await api.getOrgRoles();
    expect([200, 403]).toContain(r.status);
    if (r.ok) console.log(`    Roles: ${JSON.stringify(r.data).substring(0, 100)}`);
  });

  test('GET /api/roadmap/list returns demand list', async () => {
    const r = await api.listDemands();
    expect([200, 403]).toContain(r.status);
    if (r.ok) {
      const demands = TrmericAPI.toArray(r);
      console.log(`    Demands: ${demands.length} items`);
    }
  });

  test('GET /api/roadmap/list/myapprovals returns approvals', async () => {
    const r = await api.listMyApprovals();
    expect([200, 403]).toContain(r.status);
    if (r.ok) console.log(`    Approvals: ${JSON.stringify(r.data).substring(0, 100)}`);
  });

  test('GET /api/demand-actions/list/ returns actions', async () => {
    const r = await api.listDemandActions();
    expect([200, 403]).toContain(r.status);
    if (r.ok) {
      const actions = TrmericAPI.toArray(r);
      console.log(`    Actions: ${actions.length} items`);
      if (actions.length > 0) {
        const first = actions[0];
        expect(first).toHaveProperty('id');
      }
    }
  });

  test('POST /api/capacity/get_resources returns resources', async () => {
    const r = await api.getResources();
    expect([200, 403]).toContain(r.status);
    if (r.ok) {
      const resources = r.data?.resource_data || r.data?.data || [];
      console.log(`    Resources: ${resources.length} items`);
    }
  });

  test('GET /api/capacity/portfolio_resource_managers returns RM map', async () => {
    const r = await api.getPortfolioRMs();
    expect([200, 403]).toContain(r.status);
    if (r.ok) {
      const rms = r.data?.data || r.data?.flat_rms || [];
      console.log(`    Portfolio RMs: ${rms.length} mappings`);
    }
  });

  test('GET /api/capacity/get_resource_home_summary returns summary', async () => {
    const r = await api.getResourceHomeSummary();
    expect([200, 403]).toContain(r.status);
    if (r.ok) console.log(`    Home summary keys: ${Object.keys(r.data || {}).join(', ')}`);
  });

  test('GET /api/projects/portfolio/list returns portfolios', async () => {
    const r = await api.getPortfolios();
    expect([200, 403]).toContain(r.status);
    if (r.ok) console.log(`    Portfolios: ${JSON.stringify(r.data).substring(0, 100)}`);
  });

  test('GET /api/entity-workflow/statuses/ returns workflow statuses', async () => {
    const r = await api.getWorkflowStatuses();
    expect([200, 403]).toContain(r.status);
    if (r.ok) console.log(`    Workflow statuses: ${JSON.stringify(r.data).substring(0, 100)}`);
  });
});
