import { Page, Route } from '@playwright/test';
import { URLS } from './urls';

/**
 * Network Interception Helpers — Reusable mock patterns.
 *
 * Usage:
 *   import { mockApi, mockEmpty, mockError, mockSlow } from '../helpers/network';
 *
 *   await mockApi(page, '/api/capacity/list_resource_requests', myData);
 *   await mockEmpty(page, '/api/capacity/list_resource_requests');
 *   await mockError(page, '/api/capacity/list_resource_requests', 500);
 *   await mockSlow(page, '/api/capacity/list_resource_requests', myData, 5000);
 */

/** Mock an API endpoint with custom JSON data */
export async function mockApi(page: Page, apiPath: string, data: any, status = 200) {
  const pattern = `${URLS.backend}${apiPath}*`;
  await page.route(pattern, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/** Mock an API endpoint with empty response */
export async function mockEmpty(page: Page, apiPath: string) {
  await mockApi(page, apiPath, { status: 'success', data: [], total_count: 0 });
}

/** Mock an API endpoint with error response */
export async function mockError(page: Page, apiPath: string, status = 500) {
  await mockApi(page, apiPath, { status: 'error', message: 'Mocked error' }, status);
}

/** Mock an API endpoint with delayed response */
export async function mockSlow(page: Page, apiPath: string, data: any, delayMs = 5000) {
  const pattern = `${URLS.backend}${apiPath}*`;
  await page.route(pattern, async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/** Capture all API calls made during a test (for contract validation) */
export async function captureApiCalls(page: Page): Promise<{ url: string; method: string; status: number }[]> {
  const calls: { url: string; method: string; status: number }[] = [];

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      calls.push({
        url: url.replace(URLS.backend, ''),
        method: response.request().method(),
        status: response.status(),
      });
    }
  });

  return calls;
}

/** Wait for a specific API call to complete and return its response data */
export async function waitForApiResponse<T = any>(
  page: Page,
  apiPath: string,
  timeout = 15_000
): Promise<{ status: number; data: T | null }> {
  const response = await page.waitForResponse(
    (resp) => resp.url().includes(apiPath),
    { timeout }
  );
  const status = response.status();
  const data = status === 200 ? await response.json().catch(() => null) : null;
  return { status, data };
}
