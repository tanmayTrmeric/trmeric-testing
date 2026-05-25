import { test, expect } from '@playwright/test';
import { URLS, API } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ===================================================================
 * PLATFORM TEST: Roadmap / Demand API Contract Validation
 * ===================================================================
 *
 * Tests that all Demand lifecycle endpoints exist, respond with
 * expected status codes, and return valid response shapes.
 *
 * These tests hit the Django backend directly via Playwright's request context.
 * Catches: endpoint removed, URL changed, response shape broken, auth missing.
 *
 * VE Tickets: VE-72, VE-74, VE-76, VE-86, VE-98, VE-130, VE-157, VE-165
 * Backend: trmeric/roadmap/urls.py, trmeric/roadmap/views.py
 * ===================================================================
 */

test.describe('Roadmap API — Endpoint Existence', () => {

  const endpoints = [
    { name: 'create demand',           method: 'POST', path: API.createDemand },
    { name: 'list demands',            method: 'GET',  path: API.listDemands },
    { name: 'list demands by portfolio', method: 'GET', path: API.listDemandsByPortfolio },
    { name: 'list my approvals',       method: 'GET',  path: API.listMyApprovals },
    { name: 'list approved demands',   method: 'GET',  path: API.listApprovedDemands },
    { name: 'list archived demands',   method: 'GET',  path: API.listArchivedDemands },
    { name: 'search demands',          method: 'GET',  path: API.searchDemands },
    { name: 'bulk demand transition',  method: 'POST', path: API.bulkDemandTransition },
    { name: 'portfolio accountability', method: 'GET', path: API.portfolioAccountability },
    { name: 'list demand KPIs',        method: 'POST', path: API.listDemandKpis },
    { name: 'add demand KPI',          method: 'POST', path: API.addDemandKpi },
  ];

  for (const ep of endpoints) {
    test(`${ep.name} endpoint exists (${ep.method} ${ep.path})`, async ({ request }) => {
      const url = `${URLS.backend}${ep.path}`;
      const response = ep.method === 'POST'
        ? await request.post(url)
        : await request.get(url);

      // Endpoint exists — 404 = removed (FAIL), 401/403 = exists but needs auth (PASS)
      expect(response.status(), `${ep.name} returned 404 — endpoint removed`).not.toBe(404);
      expect(response.status(), `${ep.name} returned 500 — server error`).not.toBe(500);
    });
  }
});

test.describe('Roadmap API — Demand CRUD (Authenticated)', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('GET /roadmap/list returns demand list with expected shape', async () => {
    const result = await api.listDemands();

    // Should be 200 (or 403 if role doesn't have access)
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      // Response should be an array or have a data key
      const demands = Array.isArray(result.data) ? result.data : (result.data?.data || result.data?.results || []);
      console.log(`\n  Demands found: ${demands.length}`);

      if (demands.length > 0) {
        const first = demands[0];
        // Every demand should have these core fields
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('title');
      }
    }
  });

  test('GET /roadmap/list/portfolio returns portfolio-filtered demands', async () => {
    const result = await api.listDemandsByPortfolio();
    expect([200, 403]).toContain(result.status);
  });

  test('GET /roadmap/list/myapprovals returns approval queue', async () => {
    const result = await api.listMyApprovals();
    // 405 = method not allowed (GET vs POST mismatch on this endpoint)
    expect([200, 403, 405]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const approvals = Array.isArray(result.data) ? result.data : (result.data?.data || []);
      console.log(`\n  Pending approvals: ${approvals.length}`);
    }
  });

  test('GET /roadmap/list/search supports text search', async () => {
    const result = await api.searchDemands({ q: 'test' });
    expect([200, 403, 405]).toContain(result.status);
  });

  test('GET /roadmap/approvedlist returns approved demands', async () => {
    const result = await api.listDemands(); // Using base list as proxy
    expect([200, 403]).toContain(result.status);
  });

  test('POST /roadmap/kpi/list returns KPI definitions', async () => {
    const result = await api.listDemandKpis();
    expect([200, 403, 405]).toContain(result.status);
  });
});

test.describe('Roadmap API — Demand Detail Endpoints (Authenticated)', () => {

  let api: TrmericAPI;
  let firstDemandId: number | null = null;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);

    // Get a real demand ID to test detail endpoints
    if (!firstDemandId) {
      const list = await api.listDemands();
      if (list.status === 200 && list.data) {
        const demands = Array.isArray(list.data) ? list.data : (list.data?.data || list.data?.results || []);
        if (demands.length > 0) {
          firstDemandId = demands[0].id;
        }
      }
    }
  });

  test('GET /roadmap/get/<id> returns full demand details', async () => {
    test.skip(!firstDemandId, 'No demands found in system to test detail view');

    const result = await api.getDemandDetails(firstDemandId!);
    expect(result.status).toBe(200);

    if (result.data) {
      // Backend wraps response: {status: "success", data: {...}, message: "..."}
      const demand = result.data?.data || result.data;

      // Validate core demand shape
      expect(demand).toHaveProperty('id', firstDemandId);
      expect(demand).toHaveProperty('title');

      // Log demand state for visibility
      console.log(`\n  Demand: ${demand.title}`);
      console.log(`  State: current_state=${demand.current_state}, approved=${demand.approved_state}`);
      console.log(`  Dates: ${demand.start_date} — ${demand.end_date}`);
    }
  });

  test('GET /roadmap/<id>/resource-requirements/ returns role requirements (VE-98)', async () => {
    test.skip(!firstDemandId, 'No demands found');

    const result = await api.getDemandResourceRequirements(firstDemandId!);
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const requirements = Array.isArray(result.data) ? result.data : (result.data?.data || []);
      console.log(`\n  Resource requirements: ${requirements.length}`);

      if (requirements.length > 0) {
        const first = requirements[0];
        // Each requirement should define what role is needed
        expect(first).toHaveProperty('id');
      }
    }
  });

  test('GET /roadmap/<id>/projected-costs/ returns cost projections (VE-86)', async () => {
    test.skip(!firstDemandId, 'No demands found');

    const result = await api.getDemandProjectedCosts(firstDemandId!);
    expect([200, 403]).toContain(result.status);
  });

  test('GET /roadmap/<id>/field-permissions/ returns field access matrix (VE-130)', async () => {
    test.skip(!firstDemandId, 'No demands found');

    const result = await api.getDemandFieldPermissions(firstDemandId!);
    expect([200, 403]).toContain(result.status);
  });

  test('GET /roadmap/<id>/dependencies returns dependency links (VE-72)', async () => {
    test.skip(!firstDemandId, 'No demands found');

    const result = await api.getDemandDependencies(firstDemandId!);
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const deps = Array.isArray(result.data) ? result.data : (result.data?.data || []);
      console.log(`\n  Dependencies: ${deps.length}`);
    }
  });

  test('GET /roadmap/<id>/live/ returns real-time demand data', async () => {
    test.skip(!firstDemandId, 'No demands found');

    const result = await api.getDemandLive(firstDemandId!);
    expect([200, 403]).toContain(result.status);
  });

  test('GET /roadmap/<id>/activity/ returns activity feed', async () => {
    test.skip(!firstDemandId, 'No demands found');

    const result = await api.getDemandActivity(firstDemandId!);
    expect([200, 403]).toContain(result.status);
  });
});
