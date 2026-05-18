import { TrmericAPI } from './api';

/**
 * Test Data Factory — Creates and cleans up test data.
 *
 * Usage:
 *   const factory = new TestDataFactory(api);
 *   const demand = await factory.getOrSkip('demand');  // Fetches existing demand or skips test
 *   // At end:
 *   await factory.cleanup();                           // Removes anything this test created
 *
 * Philosophy:
 *   - Prefer READING existing data over CREATING new data
 *   - Only create data when the test specifically tests creation
 *   - Track created resources for cleanup
 *   - Never delete data that wasn't created by this test run
 */

export interface TestDemand {
  id: number;
  title: string;
  current_state?: string;
  portfolio_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface TestResource {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface TestResourceRequest {
  id: number;
  role_requested?: string;
  match_status?: string;
  demand_title?: string;
  request_type?: string;
}

export class TestDataFactory {
  private api: TrmericAPI;
  private createdIds: { type: string; id: number }[] = [];

  constructor(api: TrmericAPI) {
    this.api = api;
  }

  // ── Demand Data ──────────────────────────────────────────

  /** Get the first available demand, or null if none exist */
  async getFirstDemand(): Promise<TestDemand | null> {
    const result = await this.api.listDemands();
    if (result.status !== 200 || !result.data) return null;

    const demands = Array.isArray(result.data) ? result.data : (result.data?.data || result.data?.results || []);
    return demands.length > 0 ? demands[0] : null;
  }

  /** Get all demands */
  async getDemands(): Promise<TestDemand[]> {
    const result = await this.api.listDemands();
    if (result.status !== 200 || !result.data) return [];

    return Array.isArray(result.data) ? result.data : (result.data?.data || result.data?.results || []);
  }

  // ── Resource Data ────────────────────────────────────────

  /** Get all resources from the roster */
  async getResources(): Promise<TestResource[]> {
    const result = await this.api.getResources();
    if (result.status !== 200 || !result.data) return [];

    return result.data?.resource_data || result.data?.data || [];
  }

  /** Get first resource, or null */
  async getFirstResource(): Promise<TestResource | null> {
    const resources = await this.getResources();
    return resources.length > 0 ? resources[0] : null;
  }

  // ── Resource Request Data ────────────────────────────────

  /** Get all resource requests */
  async getResourceRequests(): Promise<TestResourceRequest[]> {
    const result = await this.api.listResourceRequests();
    if (result.status !== 200 || !result.data) return [];

    return result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
  }

  /** Get first resource request, or null */
  async getFirstResourceRequest(): Promise<TestResourceRequest | null> {
    const requests = await this.getResourceRequests();
    return requests.length > 0 ? requests[0] : null;
  }

  // ── Portfolio RM Data ────────────────────────────────────

  /** Get portfolio RM mappings */
  async getPortfolioRMs(): Promise<any[]> {
    const result = await this.api.getPortfolioRMs();
    if (result.status !== 200 || !result.data) return [];

    return result.data?.data || result.data?.flat_rms || [];
  }

  // ── Actions Data ─────────────────────────────────────────

  /** Get demand actions */
  async getDemandActions(params?: Record<string, string>): Promise<any[]> {
    const result = await this.api.listDemandActions(params);
    if (result.status !== 200 || !result.data) return [];

    return result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
  }

  // ── KPI Data ─────────────────────────────────────────────

  /** Get KPI summary */
  async getKpiSummary(): Promise<any> {
    const result = await this.api.getKpiSummary();
    return result.status === 200 ? result.data : null;
  }

  // ── Pending Timeline Changes ─────────────────────────────

  async getPendingTimelineChanges(): Promise<any[]> {
    const result = await this.api.getPendingTimelineChanges();
    if (result.status !== 200 || !result.data) return [];

    return result.data?.data || result.data?.results || (Array.isArray(result.data) ? result.data : []);
  }

  // ── Cleanup ──────────────────────────────────────────────

  /** Track a created resource for later cleanup */
  track(type: string, id: number) {
    this.createdIds.push({ type, id });
  }

  /** Clean up all test-created data (call in afterAll) */
  async cleanup() {
    // Currently a no-op — implement per-resource-type deletion as needed
    // We track IDs so future cleanup methods have the data
    if (this.createdIds.length > 0) {
      console.log(`\n  Cleanup: ${this.createdIds.length} tracked items (cleanup is manual for safety)`);
    }
    this.createdIds = [];
  }
}
