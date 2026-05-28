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

// ── Frontend Routes (from App.jsx route config) ─────────────
export const ROUTES = {
  login: '/sign-in',
  hub: '/actionhub',                               // redirects to /actionhub/actions
  actions: '/actionhub/actions',
  demands: '/actionhub/my-roadmaps',
  createRoadmap: '/actionhub/create-roadmap',
  projects: '/actionhub/my-projects',
  portfolios: '/actionhub/view-portfolios',
  potential: '/actionhub/potential',
  potentialApprovals: '/actionhub/potential-approvals',
  pinboard: '/actionhub/pinboard',
  missions: '/actionhub/missions',
  ideaPad: '/actionhub/idea-pad',
  agents: '/actionhub/agents',
  tango: '/actionhub/tango',
  integration: '/actionhub/integration',
  adminConsole: '/actionhub/admin-console',
  createPortfolio: '/actionhub/create-portfolio',
  programs: '/actionhub/my-programs',
  profile: '/actionhub/my-profile',
  providers: '/actionhub/my-providers',

  /** Build demand live URL with roadmap ID */
  demandLive: (roadmapId: number | string) => `/actionhub/missions?roadmap_id=${roadmapId}`,
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

// ── ALL endpoints as flat array (for bulk contract tests) ────
export const ALL_ENDPOINTS: { name: string; method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string }[] = [
  // Auth
  { name: 'login', method: 'POST', path: API.login },
  { name: 'userInfo', method: 'GET', path: API.userInfo },
  { name: 'tenantUsers', method: 'GET', path: API.tenantUsers },
  { name: 'portfolioUsers', method: 'GET', path: API.portfolioUsers },
  { name: 'orgRoles', method: 'GET', path: API.orgRoles },

  // Capacity
  { name: 'getResources', method: 'POST', path: API.getResources },
  { name: 'getResourceDetails', method: 'POST', path: API.getResourceDetails },
  { name: 'getResourceKpiSummary', method: 'GET', path: API.getResourceKpiSummary },
  { name: 'getResourceHomeSummary', method: 'GET', path: API.getResourceHomeSummary },
  { name: 'getResourceMatchmaking', method: 'GET', path: API.getResourceMatchmaking },
  { name: 'portfolioResourceManagers', method: 'GET', path: API.portfolioResourceManagers },
  { name: 'addResource', method: 'POST', path: API.addResource },
  { name: 'updateResource', method: 'POST', path: API.updateResource },
  { name: 'createResourceRequest', method: 'POST', path: API.createResourceRequest },
  { name: 'listResourceRequests', method: 'GET', path: API.listResourceRequests },
  { name: 'allocateResource', method: 'POST', path: API.allocateResource },
  { name: 'upgradeLockType', method: 'POST', path: API.upgradeLockType },
  { name: 'releaseResource', method: 'POST', path: API.releaseResource },
  { name: 'rejectResourceRequest', method: 'POST', path: API.rejectResourceRequest },
  { name: 'indicateResourceAvailable', method: 'POST', path: API.indicateResourceAvailable },
  { name: 'getPendingTimelineChanges', method: 'GET', path: API.getPendingTimelineChanges },
  { name: 'approveTimelineChange', method: 'POST', path: API.approveTimelineChange },
  { name: 'rejectTimelineChange', method: 'POST', path: API.rejectTimelineChange },
  { name: 'getAllocationChanges', method: 'GET', path: API.getAllocationChanges },
  { name: 'getResourceGroups', method: 'GET', path: API.getResourceGroups },
  { name: 'createGroup', method: 'POST', path: API.createGroup },
  { name: 'exportResourceRequests', method: 'POST', path: API.exportResourceRequests },
  { name: 'holidays', method: 'GET', path: API.holidays },
  { name: 'unavailability', method: 'GET', path: API.unavailability },
  { name: 'allocateResourceToProject', method: 'POST', path: API.allocateResourceToProject },
  { name: 'bulkReleaseResources', method: 'POST', path: API.bulkReleaseResources },
  { name: 'lockResource', method: 'POST', path: API.lockResource },

  // Demand Actions
  { name: 'createDemandAction', method: 'POST', path: API.createDemandAction },
  { name: 'listDemandActions', method: 'GET', path: API.listDemandActions },
  { name: 'listActions', method: 'GET', path: API.listActions },
  { name: 'createAction', method: 'POST', path: API.createAction },

  // Demands / Roadmap
  { name: 'createDemand', method: 'POST', path: API.createDemand },
  { name: 'listDemands', method: 'GET', path: API.listDemands },
  { name: 'listDemandsByPortfolio', method: 'GET', path: API.listDemandsByPortfolio },
  { name: 'listMyApprovals', method: 'GET', path: API.listMyApprovals },
  { name: 'listApprovedDemands', method: 'GET', path: API.listApprovedDemands },
  { name: 'listArchivedDemands', method: 'GET', path: API.listArchivedDemands },
  { name: 'searchDemands', method: 'GET', path: API.searchDemands },
  { name: 'bulkDemandTransition', method: 'POST', path: API.bulkDemandTransition },
  { name: 'portfolioAccountability', method: 'GET', path: API.portfolioAccountability },
  { name: 'listDemandKpis', method: 'POST', path: API.listDemandKpis },
  { name: 'addDemandKpi', method: 'POST', path: API.addDemandKpi },

  // Entity Workflow
  { name: 'workflowDefinitions', method: 'GET', path: API.workflowDefinitions },
  { name: 'workflowStatuses', method: 'GET', path: API.workflowStatuses },
  { name: 'fieldAccessPolicies', method: 'GET', path: API.fieldAccessPolicies },

  // Authorization
  { name: 'getOrgRoles', method: 'GET', path: API.getOrgRoles },
  { name: 'getOrgUserRole', method: 'GET', path: API.getOrgUserRole },
  { name: 'approvalUserList', method: 'GET', path: API.approvalUserList },
  { name: 'createApprovalRequest', method: 'POST', path: API.createApprovalRequest },
  { name: 'approveRejectRequest', method: 'POST', path: API.approveRejectRequest },

  // Projects
  { name: 'listProjects', method: 'GET', path: API.listProjects },
  { name: 'createProject', method: 'POST', path: API.createProject },
  { name: 'listPortfolios', method: 'GET', path: API.listPortfolios },
  { name: 'addPortfolio', method: 'POST', path: API.addPortfolio },

  // Tenant
  { name: 'tenantReleaseCycles', method: 'GET', path: API.tenantReleaseCycles },
  { name: 'customFieldList', method: 'GET', path: API.customFieldList },
];
