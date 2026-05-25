import { APIRequestContext } from '@playwright/test';
import { URLS, API } from './urls';

/**
 * Backend API helper — makes authenticated API calls to Django backend.
 *
 * Production features:
 *   - Automatic retry on network failures (configurable)
 *   - Always parses response body (even non-200)
 *   - Request timing for performance tracking
 *   - Structured error context for debugging
 *
 * Usage:
 *   const api = new TrmericAPI(request, cookies);
 *   const resources = await api.getResources();
 */

export interface ApiResponse<T = any> {
  status: number;
  data: T | null;
  /** Response time in milliseconds */
  duration: number;
  /** True if status is 2xx */
  ok: boolean;
  /** Raw status text for debugging */
  statusText: string;
}

interface RequestOptions {
  /** Number of retries on network failure (default: 2) */
  retries?: number;
  /** Timeout per request in ms (default: 30000) */
  timeout?: number;
}

const DEFAULT_RETRIES = 2;
const DEFAULT_TIMEOUT = 30_000;

export class TrmericAPI {
  private request: APIRequestContext;
  private cookieHeader: string;
  private baseUrl: string;

  constructor(request: APIRequestContext, cookies: { name: string; value: string }[]) {
    this.request = request;
    this.cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    this.baseUrl = URLS.backend;
  }

  /** Replace path params like {id} or {type} */
  private resolvePath(path: string, params: Record<string, string | number>): string {
    let resolved = path;
    for (const [key, value] of Object.entries(params)) {
      resolved = resolved.replace(`{${key}}`, String(value));
    }
    return resolved;
  }

  /** Parse response body safely — always returns data even on error responses */
  private async parseBody(response: { status: () => number; text: () => Promise<string> }): Promise<any> {
    try {
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private async get(path: string, params?: Record<string, string>, opts?: RequestOptions): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const retries = opts?.retries ?? DEFAULT_RETRIES;
    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const start = Date.now();
        const response = await this.request.get(url, {
          headers: { Cookie: this.cookieHeader },
          params,
          timeout,
        });
        const duration = Date.now() - start;
        const data = await this.parseBody(response);
        return {
          status: response.status(),
          data,
          duration,
          ok: response.ok(),
          statusText: `${response.status()}`,
        };
      } catch (err) {
        if (attempt === retries) {
          return { status: 0, data: null, duration: 0, ok: false, statusText: `NETWORK_ERROR: ${err}` };
        }
        // Brief pause before retry
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return { status: 0, data: null, duration: 0, ok: false, statusText: 'EXHAUSTED_RETRIES' };
  }

  private async post(path: string, body?: any, opts?: RequestOptions): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const retries = opts?.retries ?? DEFAULT_RETRIES;
    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const start = Date.now();
        const response = await this.request.post(url, {
          headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
          data: body,
          timeout,
        });
        const duration = Date.now() - start;
        const data = await this.parseBody(response);
        return {
          status: response.status(),
          data,
          duration,
          ok: response.ok(),
          statusText: `${response.status()}`,
        };
      } catch (err) {
        if (attempt === retries) {
          return { status: 0, data: null, duration: 0, ok: false, statusText: `NETWORK_ERROR: ${err}` };
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return { status: 0, data: null, duration: 0, ok: false, statusText: 'EXHAUSTED_RETRIES' };
  }

  private async put(path: string, body?: any, opts?: RequestOptions): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const retries = opts?.retries ?? DEFAULT_RETRIES;
    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const start = Date.now();
        const response = await this.request.put(url, {
          headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
          data: body,
          timeout,
        });
        const duration = Date.now() - start;
        const data = await this.parseBody(response);
        return {
          status: response.status(),
          data,
          duration,
          ok: response.ok(),
          statusText: `${response.status()}`,
        };
      } catch (err) {
        if (attempt === retries) {
          return { status: 0, data: null, duration: 0, ok: false, statusText: `NETWORK_ERROR: ${err}` };
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return { status: 0, data: null, duration: 0, ok: false, statusText: 'EXHAUSTED_RETRIES' };
  }

  private async patch(path: string, body?: any, opts?: RequestOptions): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const retries = opts?.retries ?? DEFAULT_RETRIES;
    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const start = Date.now();
        const response = await this.request.patch(url, {
          headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
          data: body,
          timeout,
        });
        const duration = Date.now() - start;
        const data = await this.parseBody(response);
        return {
          status: response.status(),
          data,
          duration,
          ok: response.ok(),
          statusText: `${response.status()}`,
        };
      } catch (err) {
        if (attempt === retries) {
          return { status: 0, data: null, duration: 0, ok: false, statusText: `NETWORK_ERROR: ${err}` };
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return { status: 0, data: null, duration: 0, ok: false, statusText: 'EXHAUSTED_RETRIES' };
  }

  private async del(path: string, opts?: RequestOptions): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const retries = opts?.retries ?? DEFAULT_RETRIES;
    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const start = Date.now();
        const response = await this.request.delete(url, {
          headers: { Cookie: this.cookieHeader },
          timeout,
        });
        const duration = Date.now() - start;
        const data = await this.parseBody(response);
        return {
          status: response.status(),
          data,
          duration,
          ok: response.ok(),
          statusText: `${response.status()}`,
        };
      } catch (err) {
        if (attempt === retries) {
          return { status: 0, data: null, duration: 0, ok: false, statusText: `NETWORK_ERROR: ${err}` };
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return { status: 0, data: null, duration: 0, ok: false, statusText: 'EXHAUSTED_RETRIES' };
  }

  /**
   * Raw request — use for contract tests that just need status codes.
   * Returns the raw Playwright APIResponse (not parsed).
   */
  async raw(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: any) {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = { Cookie: this.cookieHeader };
    if (body) headers['Content-Type'] = 'application/json';

    switch (method) {
      case 'GET':    return this.request.get(url, { headers });
      case 'POST':   return this.request.post(url, { headers, data: body });
      case 'PUT':    return this.request.put(url, { headers, data: body });
      case 'PATCH':  return this.request.patch(url, { headers, data: body });
      case 'DELETE': return this.request.delete(url, { headers });
    }
  }

  /**
   * Unwrap Django response envelope.
   * Many endpoints return { status: "success", data: {...}, message: "..." }
   * This extracts the inner `data` if present.
   */
  static unwrap<T = any>(response: ApiResponse): T | null {
    if (!response.data) return null;
    // If response has a nested data key (Django envelope), unwrap it
    if (response.data?.data !== undefined && response.data?.status !== undefined) {
      return response.data.data as T;
    }
    return response.data as T;
  }

  /**
   * Extract array from response — handles all common Django response shapes:
   * - Direct array: [...]
   * - Envelope: { data: [...] }
   * - Paginated: { results: [...] }
   */
  static toArray<T = any>(response: ApiResponse): T[] {
    if (!response.data) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.results)) return response.data.results;
    return [];
  }

  // ═══════════════════════════════════════════════════════
  // Demands / Roadmap
  // ═══════════════════════════════════════════════════════

  async createDemand(body: any) {
    return this.post(API.createDemand, body);
  }

  async getDemandDetails(demandId: number | string) {
    return this.get(`${API.getDemandDetails}${demandId}`);
  }

  async updateDemand(demandId: number | string, body: any) {
    return this.put(`${API.updateDemand}${demandId}`, body);
  }

  async updateDemandAttributes(demandId: number | string, body: any) {
    return this.patch(`${API.updateDemandAttributes}${demandId}`, body);
  }

  async approveDemand(demandId: number | string) {
    return this.post(`${API.approveDemand}${demandId}`);
  }

  async rejectDemand(demandId: number | string, body?: any) {
    return this.post(`${API.rejectDemand}${demandId}`, body);
  }

  async archiveDemand(demandId: number | string) {
    return this.post(`${API.archiveDemand}${demandId}`);
  }

  async listDemands(params?: Record<string, string>) {
    return this.get(API.listDemands, params);
  }

  async listDemandsByPortfolio(params?: Record<string, string>) {
    return this.get(API.listDemandsByPortfolio, params);
  }

  async listMyApprovals(params?: Record<string, string>) {
    return this.get(API.listMyApprovals, params);
  }

  async searchDemands(params?: Record<string, string>) {
    return this.get(API.searchDemands, params);
  }

  async getDemandLive(demandId: number | string) {
    return this.get(this.resolvePath(API.demandLive, { id: demandId }));
  }

  async getDemandActivity(demandId: number | string) {
    return this.get(this.resolvePath(API.demandActivity, { id: demandId }));
  }

  async getDemandResourceRequirements(demandId: number | string) {
    return this.get(this.resolvePath(API.demandResourceRequirements, { id: demandId }));
  }

  async getDemandProjectedCosts(demandId: number | string) {
    return this.get(this.resolvePath(API.demandProjectedCosts, { id: demandId }));
  }

  async getDemandFieldPermissions(demandId: number | string) {
    return this.get(this.resolvePath(API.demandFieldPermissions, { id: demandId }));
  }

  async getDemandDependencies(demandId: number | string) {
    return this.get(this.resolvePath(API.demandDependencies, { id: demandId }));
  }

  async listDemandKpis(body?: any) {
    return this.post(API.listDemandKpis, body);
  }

  // ═══════════════════════════════════════════════════════
  // Capacity / Resource Management
  // ═══════════════════════════════════════════════════════

  async getResources(body?: any) {
    return this.post(API.getResources, body);
  }

  async getResourceDetails(body: any) {
    return this.post(API.getResourceDetails, body);
  }

  async getPortfolioRMs(portfolioId?: string) {
    return this.get(API.portfolioResourceManagers, portfolioId ? { portfolio_id: portfolioId } : {});
  }

  async listResourceRequests(params?: Record<string, string>) {
    return this.get(API.listResourceRequests, params);
  }

  async createResourceRequest(body: any) {
    return this.post(API.createResourceRequest, body);
  }

  async allocateResource(body: any) {
    return this.post(API.allocateResource, body);
  }

  async upgradeLockType(body: any) {
    return this.post(API.upgradeLockType, body);
  }

  async releaseResource(body: any) {
    return this.post(API.releaseResource, body);
  }

  async rejectResourceRequest(body: any) {
    return this.post(API.rejectResourceRequest, body);
  }

  async indicateResourceAvailable(body: any) {
    return this.post(API.indicateResourceAvailable, body);
  }

  async getPendingTimelineChanges(params?: Record<string, string>) {
    return this.get(API.getPendingTimelineChanges, params);
  }

  async approveTimelineChange(body: any) {
    return this.post(API.approveTimelineChange, body);
  }

  async rejectTimelineChange(body: any) {
    return this.post(API.rejectTimelineChange, body);
  }

  async getAllocationChanges(params?: Record<string, string>) {
    return this.get(API.getAllocationChanges, params);
  }

  async exportResourceRequests(body?: any) {
    return this.post(API.exportResourceRequests, body);
  }

  async getKpiSummary() {
    return this.get(API.getResourceKpiSummary);
  }

  async getResourceMatchmaking(params?: Record<string, string>) {
    return this.get(API.getResourceMatchmaking, params);
  }

  async getResourceGroups(params?: Record<string, string>) {
    return this.get(API.getResourceGroups, params);
  }

  async getResourceHomeSummary(params?: Record<string, string>) {
    return this.get(API.getResourceHomeSummary, params);
  }

  async addResource(body: any) {
    return this.post(API.addResource, body);
  }

  // ═══════════════════════════════════════════════════════
  // Demand Actions Hub
  // ═══════════════════════════════════════════════════════

  async createDemandAction(body: any) {
    return this.post(API.createDemandAction, body);
  }

  async listDemandActions(params?: Record<string, string>) {
    return this.get(API.listDemandActions, params);
  }

  async completeDemandAction(actionId: number | string, body?: any) {
    return this.post(this.resolvePath(API.completeDemandAction, { id: actionId }), body);
  }

  async cancelDemandAction(actionId: number | string, body?: any) {
    return this.post(this.resolvePath(API.cancelDemandAction, { id: actionId }), body);
  }

  async reassignDemandAction(actionId: number | string, body: any) {
    return this.post(this.resolvePath(API.reassignDemandAction, { id: actionId }), body);
  }

  async addDemandActionComment(actionId: number | string, body: any) {
    return this.post(this.resolvePath(API.addDemandActionComment, { id: actionId }), body);
  }

  // ═══════════════════════════════════════════════════════
  // Entity Workflow
  // ═══════════════════════════════════════════════════════

  async getEntityCurrentStatus(entityType: string, entityId: number | string) {
    return this.get(`${API.entityCurrentStatus}${entityType}/${entityId}/`);
  }

  async getEntityHistory(entityType: string, entityId: number | string) {
    return this.get(this.resolvePath(API.entityHistory, { type: entityType, id: entityId }));
  }

  async getWorkflowStatuses(params?: Record<string, string>) {
    return this.get(API.workflowStatuses, params);
  }

  // ═══════════════════════════════════════════════════════
  // Auth / Users
  // ═══════════════════════════════════════════════════════

  async getUserInfo() {
    return this.get(API.userInfo);
  }

  async getOrgRoles() {
    return this.get(API.orgRoles);
  }

  async getPortfolios() {
    return this.get(API.listPortfolios);
  }

  // ═══════════════════════════════════════════════════════
  // Health Check
  // ═══════════════════════════════════════════════════════

  async healthCheck(): Promise<{ alive: boolean; status: number; duration: number }> {
    const start = Date.now();
    try {
      const response = await this.request.get(
        `${this.baseUrl}/api/capacity/portfolio_resource_managers`,
        { timeout: 10_000 }
      );
      return {
        alive: [200, 401, 403].includes(response.status()),
        status: response.status(),
        duration: Date.now() - start,
      };
    } catch {
      return { alive: false, status: 0, duration: Date.now() - start };
    }
  }
}
