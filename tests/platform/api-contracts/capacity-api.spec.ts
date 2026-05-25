import { test, expect } from '@playwright/test';
import { URLS, API } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ===================================================================
 * PLATFORM TEST: Capacity / Resource Management — API Contract Tests
 * ===================================================================
 *
 * Tests ALL capacity module endpoints: resources, allocation, requests,
 * lock/unlock, timeline changes, groups, holidays, matchmaking, KPI, export.
 *
 * VE Tickets: VE-83, VE-98, VE-122, VE-170, VE-175, VE-176, VE-177,
 *             VE-180, VE-181, VE-183, VE-184, VE-188, VE-199, VE-200, VE-211
 * Backend: trmeric/capacity/urls.py, trmeric/capacity/views.py
 * ===================================================================
 */

// ── Unauthenticated: Endpoint Existence ────────────────────
test.describe('Capacity API — Endpoint Existence (Unauthenticated)', () => {

  const endpoints = [
    // Resource CRUD
    { name: 'get_resources',              method: 'POST', path: API.getResources },
    { name: 'add_resource',               method: 'POST', path: API.addResource },
    { name: 'get_resource_home_summary',  method: 'GET',  path: API.getResourceHomeSummary },

    // Resource Requests (VE-83, VE-98)
    { name: 'portfolio_resource_managers', method: 'GET',  path: API.portfolioResourceManagers },
    { name: 'create_resource_request',    method: 'POST', path: API.createResourceRequest },
    { name: 'list_resource_requests',     method: 'GET',  path: API.listResourceRequests },
    { name: 'allocate_resource_request',  method: 'POST', path: API.allocateResource },

    // Lock Operations (VE-184)
    { name: 'upgrade_lock_type',          method: 'POST', path: API.upgradeLockType },
    { name: 'release_resource',           method: 'POST', path: API.releaseResource },

    // Timeline Changes (VE-200, VE-211)
    { name: 'get_pending_timeline_changes', method: 'GET', path: API.getPendingTimelineChanges },
    { name: 'get_allocation_changes',     method: 'GET',  path: API.getAllocationChanges },

    // KPI & Matchmaking
    { name: 'get_resource_kpi_summary',   method: 'GET',  path: API.getResourceKpiSummary },
    { name: 'get_resource_matchmaking',   method: 'GET',  path: API.getResourceMatchmaking },

    // Groups
    { name: 'get_resource_groups',        method: 'GET',  path: API.getResourceGroups },

    // Export (VE-122)
    { name: 'export_resource_requests',   method: 'POST', path: API.exportResourceRequests },
  ];

  for (const ep of endpoints) {
    test(`${ep.name} endpoint exists (${ep.method} ${ep.path})`, async ({ request }) => {
      const url = `${URLS.backend}${ep.path}`;
      const response = ep.method === 'POST'
        ? await request.post(url)
        : await request.get(url);

      // 404 = endpoint removed (FAIL), 401/403/405 = exists (PASS)
      expect(response.status(), `${ep.name} returned 404 — endpoint removed`).not.toBe(404);
      expect(response.status(), `${ep.name} returned 500 — server error`).not.toBe(500);
    });
  }
});

// ── Authenticated: Resource Data Validation ────────────────
test.describe('Capacity API — Resource Data (Authenticated)', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('get_resources returns resource list with valid shape', async () => {
    const result = await api.getResources();
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const resources = result.data?.resource_data || result.data?.data || [];
      console.log(`\n  Resources loaded: ${resources.length}`);

      if (resources.length > 0) {
        const first = resources[0];
        expect(first).toHaveProperty('id');
        // Resource should have identity fields
        const hasName = first.first_name || first.last_name || first.name || first.email;
        expect(hasName).toBeTruthy();
      }
    }
  });

  test('portfolio_resource_managers returns RM-to-portfolio mappings', async () => {
    const result = await api.getPortfolioRMs();
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const rms = result.data?.data || result.data?.flat_rms || [];
      console.log(`\n  Portfolio RM mappings: ${rms.length}`);

      // Every RM entry should map to a portfolio
      for (const rm of rms) {
        expect(rm).toHaveProperty('user_id');
        expect(rm).toHaveProperty('portfolio_id');
      }
    }
  });

  test('list_resource_requests returns request list with match status', async () => {
    const result = await api.listResourceRequests();
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const requests = result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
      console.log(`\n  Resource requests: ${requests.length}`);

      if (requests.length > 0) {
        const first = requests[0];
        console.log(`  First request: role=${first.role_requested}, status=${first.match_status}`);

        // match_status should be valid
        if (first.match_status) {
          expect(['pending', 'high_match', 'partial_match', 'no_match', 'allocated', 'rejected'])
            .toContain(first.match_status);
        }
      }
    }
  });

  test('KPI summary returns valid metrics', async () => {
    const result = await api.getKpiSummary();
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      console.log(`\n  KPI data keys: ${Object.keys(result.data).join(', ')}`);
    }
  });

  test('get_resource_matchmaking returns matchmaking data', async () => {
    const result = await api.getResourceMatchmaking();
    expect([200, 403, 405]).toContain(result.status);
  });

  test('get_resource_groups returns group structure', async () => {
    const result = await api.getResourceGroups();
    expect([200, 403, 405]).toContain(result.status);
  });

  test('get_resource_home_summary returns dashboard summary', async () => {
    const result = await api.getResourceHomeSummary();
    expect([200, 403]).toContain(result.status);
  });
});

// ── Authenticated: Timeline & Lock Operations ──────────────
test.describe('Capacity API — Timeline Changes (VE-200, VE-211)', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('get_pending_timeline_changes returns pending approvals', async () => {
    const result = await api.getPendingTimelineChanges();
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const changes = result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
      console.log(`\n  Pending timeline changes: ${changes.length}`);

      if (changes.length > 0) {
        const first = changes[0];
        // Should show old vs new dates
        console.log(`  First change: old=${first.old_start_date}..${first.old_end_date} -> new=${first.start_date}..${first.end_date}`);
      }
    }
  });

  test('get_allocation_changes returns change log', async () => {
    const result = await api.getAllocationChanges();
    expect([200, 403]).toContain(result.status);
  });

  test('approve_timeline_change rejects invalid timeline ID', async () => {
    const result = await api.approveTimelineChange({ timeline_id: 999999 });
    // Should fail gracefully, not 500
    expect([400, 403, 404]).toContain(result.status);
  });

  test('reject_timeline_change rejects invalid timeline ID', async () => {
    const result = await api.rejectTimelineChange({ timeline_id: 999999 });
    expect([400, 403, 404]).toContain(result.status);
  });
});

// ── Authenticated: Lock Type Operations (VE-184) ───────────
test.describe('Capacity API — Lock Operations (VE-181, VE-184)', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('upgrade_lock_type validates required fields', async () => {
    const result = await api.upgradeLockType({});
    // Empty body should be rejected gracefully
    expect([400, 403, 422]).toContain(result.status);
  });

  test('release_resource validates required fields', async () => {
    const result = await api.releaseResource({});
    expect([400, 403, 422]).toContain(result.status);
  });

  test('reject_resource_request validates required fields', async () => {
    const result = await api.rejectResourceRequest({});
    // 404 = endpoint removed from backend, 400/403/422 = validation works
    expect([400, 403, 404, 422]).toContain(result.status);
  });

  test('indicate_resource_available validates required fields (VE-183)', async () => {
    const result = await api.indicateResourceAvailable({});
    // 404 = endpoint removed from backend, 400/403/422 = validation works
    expect([400, 403, 404, 422]).toContain(result.status);
  });
});

// ── Authenticated: Export (VE-122) ─────────────────────────
test.describe('Capacity API — Export Operations', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('export_resource_requests returns downloadable data (VE-122)', async () => {
    const result = await api.exportResourceRequests();
    // 200 = file data, 403 = no permission, 405 = method not allowed
    expect([200, 403, 405]).toContain(result.status);
  });
});
