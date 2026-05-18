/**
 * Trmeric URL Configuration — Multi-Instance Support
 *
 * Switch between instances using TRMERIC_ENV environment variable:
 *   TRMERIC_ENV=dev   npm run test:smoke    ← Dev instance
 *   TRMERIC_ENV=qa    npm run test:smoke    ← QA/Test instance
 *   TRMERIC_ENV=eu    npm run test:smoke    ← EU instance
 *   TRMERIC_ENV=prod  npm run test:smoke    ← Production (read-only tests!)
 *
 * Or override directly:
 *   TRMERIC_FRONTEND_URL=https://custom.trmeric.com npm run test:smoke
 */

// ── Instance Configuration ──────────────────────────────────
const INSTANCES: Record<string, { frontend: string; backend: string }> = {
  dev: {
    frontend: 'http://localhost:5173',
    backend: 'https://trmeric-strong.trmeric.com',
  },
  qa: {
    frontend: 'https://trmeric-live.trmeric.com',
    backend: 'https://trmeric-strong.trmeric.com',
  },
  eu: {
    frontend: 'https://trmeric-eu.trmeric.com',
    backend: 'https://trmeric-eu-strong.trmeric.com',
  },
  prod: {
    frontend: 'https://app.trmeric.com',
    backend: 'https://api.trmeric.com',
  },
};

// ── Active Environment ──────────────────────────────────────
const ENV = process.env.TRMERIC_ENV || 'dev'; // Default to dev
const instance = INSTANCES[ENV] || INSTANCES.dev;

export const URLS = {
  frontend: instance.frontend,
  backend: process.env.TRMERIC_BASE_URL || instance.backend,
  env: ENV,
};

// Log which instance we're testing (visible in console output)
console.log(`\n🔧 Testing: ${ENV.toUpperCase()} instance`);
console.log(`   Frontend: ${URLS.frontend}`);
console.log(`   Backend:  ${URLS.backend}\n`);

// ── Frontend Routes ─────────────────────────────────────────
export const ROUTES = {
  login: '/sign-in',
  hub: '/actionhub',
  myHub: '/actionhub/my-hub',
  demands: '/actionhub/demands',
  projects: '/actionhub/view-projects',
  portfolios: '/actionhub/view-portfolios',
  potential: '/actionhub/potential',
  potentialApprovals: '/actionhub/potential-approvals',
  actions: '/actionhub/actions',
  pinboard: '/actionhub/pinboard',
  createRoadmap: '/actionhub/create-roadmap',
  myRoadmaps: '/actionhub/my-roadmaps',
  missions: '/actionhub/missions',
  ideaPad: '/actionhub/idea-pad',
  createPortfolio: '/actionhub/create-portfolio',
  agents: '/actionhub/agents',
  tango: '/actionhub/tango',
  integration: '/actionhub/integration',
  adminConsole: '/actionhub/admin-console',
};

// ── Backend API Endpoints ───────────────────────────────────
export const API = {
  // Auth
  login: '/api/users/login',
  userInfo: '/api/users/user',
  tenantUsers: '/api/users/tenant-user-list',
  portfolioUsers: '/api/users/portfolio-users',
  orgRoles: '/api/users/get-org-role',

  // ── Capacity / Resource Management ─────────────────────
  getResources: '/api/capacity/get_resources',
  getResourceDetails: '/api/capacity/get_resource_details',
  getResourceKpiSummary: '/api/capacity/get_resource_kpi_summary',
  getResourceHomeSummary: '/api/capacity/get_resource_home_summary',
  getResourceMatchmaking: '/api/capacity/get_resource_matchmaking',
  portfolioResourceManagers: '/api/capacity/portfolio_resource_managers',
  addResource: '/api/capacity/add_resource',
  updateResource: '/api/capacity/update_resource_details',

  // Resource Requests (VE-83, VE-98, VE-180)
  createResourceRequest: '/api/capacity/create_resource_request_action',
  listResourceRequests: '/api/capacity/list_resource_requests',
  allocateResource: '/api/capacity/allocate_resource_request',
  upgradeLockType: '/api/capacity/upgrade_lock_type',
  releaseResource: '/api/capacity/release_resource',
  rejectResourceRequest: '/api/capacity/reject_resource_request_action',
  indicateResourceAvailable: '/api/capacity/indicate_resource_available',

  // Timeline Changes (VE-200, VE-211)
  getPendingTimelineChanges: '/api/capacity/get_pending_timeline_changes',
  approveTimelineChange: '/api/capacity/approve_timeline_change',
  rejectTimelineChange: '/api/capacity/reject_timeline_change',
  getAllocationChanges: '/api/capacity/get_allocation_changes',

  // Resource Groups
  getResourceGroups: '/api/capacity/get_resource_groups',
  createGroup: '/api/capacity/create_group',

  // Exports (VE-122)
  exportResourceRequests: '/api/capacity/export_resource_requests',

  // Holidays & Unavailability (VE-175)
  holidays: '/api/capacity/holidays',
  unavailability: '/api/capacity/unavailability',

  // Resource Allocation
  allocateResourceToProject: '/api/capacity/allocate_resource',
  bulkReleaseResources: '/api/capacity/bulk_release_project_resources',
  lockResource: '/api/capacity/lock_resource',

  // ── Demand Actions Hub (VE-83, VE-139) ─────────────────
  createDemandAction: '/api/demand-actions/',
  listDemandActions: '/api/demand-actions/list/',
  completeDemandAction: '/api/demand-actions/{id}/complete/',
  cancelDemandAction: '/api/demand-actions/{id}/cancel/',
  reassignDemandAction: '/api/demand-actions/{id}/reassign/',
  addDemandActionComment: '/api/demand-actions/{id}/comment/',

  // Legacy Actions
  listActions: '/api/action/get_actions',
  createAction: '/api/action/add',
  getProjectActions: '/api/action/get_actions/project/',
  getRoadmapActions: '/api/action/get_actions/roadmap/',

  // ── Demands / Roadmap ──────────────────────────────────
  createDemand: '/api/roadmap/create',
  getDemandDetails: '/api/roadmap/get/',
  updateDemand: '/api/roadmap/update/',
  updateDemandAttributes: '/api/roadmap/update_attributes/',
  approveDemand: '/api/roadmap/approve/',
  rejectDemand: '/api/roadmap/reject/',
  archiveDemand: '/api/roadmap/archive/',
  deleteDemand: '/api/roadmap/delete/',
  listDemands: '/api/roadmap/list',
  listDemandsByPortfolio: '/api/roadmap/list/portfolio',
  listMyApprovals: '/api/roadmap/list/myapprovals',
  listApprovedDemands: '/api/roadmap/approvedlist',
  listArchivedDemands: '/api/roadmap/archivedlist',
  searchDemands: '/api/roadmap/list/search',
  bulkDemandTransition: '/api/roadmap/bulk-transition',
  portfolioAccountability: '/api/roadmap/list/portfolio-accountability',

  // Demand Live & Activity
  demandLive: '/api/roadmap/{id}/live/',
  demandActivity: '/api/roadmap/{id}/activity/',

  // Demand Resource Requirements (VE-98, VE-157)
  demandResourceRequirements: '/api/roadmap/{id}/resource-requirements/',
  demandProjectedCosts: '/api/roadmap/{id}/projected-costs/',
  demandFieldPermissions: '/api/roadmap/{id}/field-permissions/',
  demandDependencies: '/api/roadmap/{id}/dependencies',
  demandOwners: '/api/roadmap/{id}/demand_owners',

  // Demand KPIs
  listDemandKpis: '/api/roadmap/kpi/list',
  addDemandKpi: '/api/roadmap/kpi/add',

  // ── Entity Workflow ────────────────────────────────────
  workflowDefinitions: '/api/entity-workflow/definitions/',
  workflowStatuses: '/api/entity-workflow/statuses/',
  entityCurrentStatus: '/api/entity-workflow/entity/',
  entityTransition: '/api/entity-workflow/{type}/{id}/transition/',
  entityHistory: '/api/entity-workflow/{type}/{id}/history/',
  entityStageTimings: '/api/entity-workflow/{type}/{id}/stage-timings/',
  fieldAccessPolicies: '/api/entity-workflow/field-access-policies/',

  // ── Authorization ──────────────────────────────────────
  getOrgRoles: '/api/get_org_roles/',
  getOrgUserRole: '/api/get_org_user_role/',
  approvalUserList: '/api/get_approval_user_list',
  createApprovalRequest: '/api/create_approval_request',
  approveRejectRequest: '/api/approve_reject_request',

  // ── Projects ───────────────────────────────────────────
  listProjects: '/api/projects/',
  getProjectDetails: '/api/projects/get/',
  createProject: '/api/project/create/',
  listPortfolios: '/api/projects/portfolio/list',
  addPortfolio: '/api/projects/portfolio/add',

  // ── Tenant ─────────────────────────────────────────────
  tenantReleaseCycles: '/api/tenant/release-cycles',
  customFieldList: '/api/tenant/custom-field/list',
};
