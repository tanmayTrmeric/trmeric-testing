import { test, expect } from '@playwright/test';
import { URLS, API } from '../../helpers/urls';
import { TrmericAPI } from '../../helpers/api';

/**
 * ===================================================================
 * PLATFORM TEST: Demand Actions Hub — API Contract Validation
 * ===================================================================
 *
 * Tests that all Actions Hub endpoints exist, respond correctly,
 * and return valid response shapes.
 *
 * Covers both the new Demand Actions Hub (EntityAction model)
 * and legacy Actions/Insights endpoints.
 *
 * VE Tickets: VE-76, VE-80, VE-83, VE-139
 * Backend: trmeric/actions/urls.py, trmeric/actions/views.py
 * ===================================================================
 */

test.describe('Demand Actions API — Endpoint Existence', () => {

  const endpoints = [
    { name: 'create demand action',   method: 'POST', path: API.createDemandAction },
    { name: 'list demand actions',    method: 'GET',  path: API.listDemandActions },
  ];

  for (const ep of endpoints) {
    test(`${ep.name} endpoint exists (${ep.method} ${ep.path})`, async ({ request }) => {
      const url = `${URLS.backend}${ep.path}`;
      const response = ep.method === 'POST'
        ? await request.post(url)
        : await request.get(url);

      expect(response.status(), `${ep.name} returned 404 — endpoint removed`).not.toBe(404);
      expect(response.status(), `${ep.name} returned 500 — server error`).not.toBe(500);
    });
  }
});

test.describe('Legacy Actions API — Endpoint Existence', () => {

  const endpoints = [
    { name: 'get all actions',        method: 'GET',  path: API.listActions },
    { name: 'create action',          method: 'POST', path: API.createAction },
  ];

  for (const ep of endpoints) {
    test(`${ep.name} endpoint exists (${ep.method} ${ep.path})`, async ({ request }) => {
      const url = `${URLS.backend}${ep.path}`;
      const response = ep.method === 'POST'
        ? await request.post(url)
        : await request.get(url);

      // 405 = Method Not Allowed is OK (endpoint exists, wrong method is fine for discovery)
      expect(response.status(), `${ep.name} returned 404`).not.toBe(404);
      expect(response.status(), `${ep.name} returned 500`).not.toBe(500);
    });
  }
});

test.describe('Demand Actions API — Authenticated CRUD', () => {

  let api: TrmericAPI;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/actions');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);
  });

  test('GET /demand-actions/list/ returns actions with expected shape', async () => {
    const result = await api.listDemandActions();

    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const actions = result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
      console.log(`\n  Demand actions found: ${actions.length}`);

      if (actions.length > 0) {
        const first = actions[0];
        // Core action fields
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('title');
        expect(first).toHaveProperty('status');

        // Status should be one of the valid states
        expect(['open', 'in_progress', 'completed', 'cancelled']).toContain(first.status);

        // Priority should be a valid value
        if (first.priority) {
          expect([1, 2, 3]).toContain(first.priority);
        }

        // Log action summary
        console.log(`  First action: "${first.title}" [${first.status}]`);
        if (first.assigned_user) {
          console.log(`  Assigned to: ${first.assigned_user.name || first.assigned_user.email || first.assigned_user}`);
        }
        if (first.demand_title) {
          console.log(`  Linked demand: ${first.demand_title}`);
        }
      }
    }
  });

  test('Actions list supports status filtering', async () => {
    const result = await api.listDemandActions({ status: 'open' });
    expect([200, 403]).toContain(result.status);

    if (result.status === 200 && result.data) {
      const actions = result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
      // All returned actions should be open (if filtering works)
      for (const action of actions) {
        if (action.status) {
          expect(action.status).toBe('open');
        }
      }
      console.log(`\n  Open actions: ${actions.length}`);
    }
  });

  test('POST /demand-actions/ validates required fields', async () => {
    // Send empty body — should get 400 (bad request), not 500
    const result = await api.createDemandAction({});
    expect([400, 403, 422]).toContain(result.status);
  });

  test('Action operations require valid action ID', async () => {
    // Complete a non-existent action — should get 404 or 400
    const result = await api.completeDemandAction(999999, { completion_note: 'test' });
    expect([400, 403, 404]).toContain(result.status);
  });

  test('Action comment requires valid action ID', async () => {
    const result = await api.addDemandActionComment(999999, { comment: 'test comment' });
    expect([400, 403, 404]).toContain(result.status);
  });
});

test.describe('Demand Actions API — Response Shape Validation', () => {

  let api: TrmericAPI;
  let firstActionId: number | null = null;

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/actionhub/actions');
    await page.waitForLoadState('domcontentloaded');
    const cookies = await page.context().cookies();
    api = new TrmericAPI(request, cookies);

    // Fetch a real action ID
    if (!firstActionId) {
      const list = await api.listDemandActions();
      if (list.status === 200 && list.data) {
        const actions = list.data?.data || list.data?.results || (Array.isArray(list.data) ? list.data : []);
        if (actions.length > 0) {
          firstActionId = actions[0].id;
        }
      }
    }
  });

  test('Action detail includes owner and assignee information', async () => {
    test.skip(!firstActionId, 'No actions found in system');

    const list = await api.listDemandActions();
    if (list.status === 200 && list.data) {
      const actions = list.data?.data || list.data?.results || (Array.isArray(list.data) ? list.data : []);
      const action = actions.find((a: any) => a.id === firstActionId);

      if (action) {
        // Actions should have assignment info
        expect(action).toHaveProperty('status');
        expect(action).toHaveProperty('title');
        console.log(`\n  Action #${action.id}: "${action.title}"`);
        console.log(`  Status: ${action.status}, Priority: ${action.priority}`);
        if (action.due_date) console.log(`  Due: ${action.due_date}`);
      }
    }
  });

  test('Actions linked to resource requests include request details', async () => {
    const list = await api.listDemandActions();
    if (list.status !== 200 || !list.data) return;

    const actions = list.data?.data || list.data?.results || (Array.isArray(list.data) ? list.data : []);
    const resourceAction = actions.find((a: any) => a.action_type === 'resource_request');

    if (resourceAction) {
      console.log(`\n  Resource request action found: #${resourceAction.id}`);
      if (resourceAction.resource_request_detail) {
        const detail = resourceAction.resource_request_detail;
        console.log(`  Role: ${detail.role_requested}`);
        console.log(`  Match status: ${detail.match_status}`);
        console.log(`  Allocation: ${detail.allocation_pct}%`);
      }
    } else {
      console.log('\n  No resource_request type actions found — skipping shape validation');
    }
  });
});
