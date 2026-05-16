import { APIRequestContext } from '@playwright/test';
import { URLS, API } from './urls';

/**
 * Backend API helper — makes authenticated API calls to Django backend.
 *
 * Usage in tests:
 *   const api = new TrmericAPI(request, cookies);
 *   const resources = await api.getResources();
 *   const rms = await api.getPortfolioRMs();
 */
export class TrmericAPI {
  private request: APIRequestContext;
  private cookieHeader: string;
  private baseUrl: string;

  constructor(request: APIRequestContext, cookies: { name: string; value: string }[]) {
    this.request = request;
    this.cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    this.baseUrl = URLS.backend;
  }

  private async get(path: string, params?: Record<string, string>) {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.get(url, {
      headers: { Cookie: this.cookieHeader },
      params,
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
  }

  private async post(path: string, body?: any) {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.post(url, {
      headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
      data: body,
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
  }

  // ── Resource Management ───────────────────────────────
  async getResources(params?: Record<string, string>) {
    return this.post(API.getResources, params);
  }

  async getPortfolioRMs(portfolioId?: string) {
    return this.get(API.portfolioResourceManagers, portfolioId ? { portfolio_id: portfolioId } : {});
  }

  async listResourceRequests(params?: Record<string, string>) {
    return this.get(API.listResourceRequests, params);
  }

  async getKpiSummary() {
    return this.get(API.getResourceKpiSummary);
  }

  // ── Health Check ──────────────────────────────────────
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request.get(`${this.baseUrl}/api/capacity/portfolio_resource_managers`);
      return [200, 401, 403].includes(response.status());
    } catch {
      return false;
    }
  }
}
