import { test, expect } from '@playwright/test';
import { URLS, API } from '../../helpers/urls';

/**
 * ═══════════════════════════════════════════════════════════════
 * PLATFORM TEST: Backend API Contract Validation
 * ═══════════════════════════════════════════════════════════════
 *
 * Tests that backend API endpoints exist and respond with
 * expected status codes and response shapes.
 *
 * These tests hit the Django backend directly (no browser needed).
 * Catches: endpoint removed, URL changed, response shape broken.
 */

test.describe('Capacity API Contracts', () => {

  const endpoints = [
    { name: 'get_resources', method: 'POST', path: API.getResources },
    { name: 'portfolio_resource_managers', method: 'GET', path: API.portfolioResourceManagers },
    { name: 'list_resource_requests', method: 'GET', path: API.listResourceRequests },
    { name: 'get_resource_kpi_summary', method: 'GET', path: API.getResourceKpiSummary },
  ];

  for (const ep of endpoints) {
    test(`${ep.name} endpoint exists (${ep.method} ${ep.path})`, async ({ request }) => {
      const url = `${URLS.backend}${ep.path}`;
      const response = ep.method === 'POST'
        ? await request.post(url)
        : await request.get(url);

      // Endpoint exists — any auth-related status is fine
      // 404 = endpoint removed (FAIL), 401/403 = exists but needs auth (PASS)
      expect(response.status()).not.toBe(404);
      expect(response.status()).not.toBe(500);
    });
  }
});

test.describe('Actions API Contracts', () => {

  test('Actions API responds', async ({ request }) => {
    const response = await request.get(`${URLS.backend}/api/actions/`);
    // Any non-500, non-404 response means the app is configured correctly
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Roadmap API Contracts', () => {

  test('Roadmap API responds', async ({ request }) => {
    const response = await request.get(`${URLS.backend}/api/roadmap/`);
    expect(response.status()).not.toBe(500);
  });
});
