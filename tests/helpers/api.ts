import { APIRequestContext } from '@playwright/test';
import { URLS, API } from './urls';

/**
 * Backend API helper — makes authenticated API calls to Django backend.
 *
 * Usage in tests:
 *   const api = new TrmericAPI(request, cookies);
 *   const resources = await api.getResources();
 *   const rms = await api.getPortfolioRMs();
 *   const demands = await api.listDemands();
 */

export interface ApiResponse<T = any> {
  status: number;
  data: T | null;
}

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

  private async get(path: string, params?: Record<string, string>): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.get(url, {
      headers: { Cookie: this.cookieHeader },
      params,
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
  }

  private async post(path: string, body?: any): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.post(url, {
      headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
      data: body,
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
  }

  private async put(path: string, body?: any): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.put(url, {
      headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
      data: body,
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
  }

  private async patch(path: string, body?: any): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.patch(url, {
      headers: { Cookie: this.cookieHeader, 'Content-Type': 'application/json' },
      data: body,
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
  }

  private async del(path: string): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.delete(url, {
      headers: { Cookie: this.cookieHeader },
    });
    return { status: response.status(), data: response.ok() ? await response.json() : null };
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

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request.get(`${this.baseUrl}/api/capacity/portfolio_resource_managers`);
      return [200, 401, 403].includes(response.status());
    } catch {
      return false;
    }
  }
}
