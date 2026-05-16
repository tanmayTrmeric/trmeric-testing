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
};

// ── Backend API Endpoints ───────────────────────────────────
export const API = {
  // Auth
  login: '/api/users/login',

  // Capacity / Resource Management
  getResources: '/api/capacity/get_resources',
  getResourceDetails: '/api/capacity/get_resource_details',
  getResourceKpiSummary: '/api/capacity/get_resource_kpi_summary',
  portfolioResourceManagers: '/api/capacity/portfolio_resource_managers',
  createResourceRequest: '/api/capacity/create_resource_request_action',
  listResourceRequests: '/api/capacity/list_resource_requests',
  allocateResource: '/api/capacity/allocate_resource_request',
  lockResource: '/api/capacity/lock_resource',

  // Actions
  listActions: '/api/actions/list',
  createAction: '/api/actions/create',

  // Demands / Roadmap
  listDemands: '/api/roadmap/list',
  getDemandDetails: '/api/roadmap/details',

  // Projects
  listProjects: '/api/workflow/list',
  getProjectDetails: '/api/workflow/details',
};
