# Trmeric Testing Suite — Complete Enhancement Plan

**Prepared by: Tanmay Sharma | Date: May 17, 2026**
**Based on: Deep analysis of Frontend (60+ routes, 45 Redux slices, 30+ component areas), Backend (300+ API endpoints, 40+ Django apps), and AI Service (23 route files, matchmaking, agents, insights)**

---

## The Business Case

Right now, manual QA after every sprint eats **2-3 days minimum**. Someone has to:
- Log in as 5 different roles and click through every feature
- Verify 300+ API endpoints still respond
- Check that resource allocation, demand lifecycle, actions, portfolios all still work
- Test across dev, QA, EU environments
- Verify real-time socket events are firing
- Confirm AI agents still generate sensible output

**With full automation, this drops to a 15-minute CI pipeline run.** That's not a nice-to-have — that's the difference between shipping weekly and shipping daily.

---

## Current Coverage vs. Total Surface Area

```
CURRENT STATE (what we test today):
  39 tests across 8 files
  Covers: smoke, basic API contracts, RM access, visual regression

TOTAL SURFACE AREA (what exists in Trmeric):
  Frontend: 60+ routes, 45 Redux slices, 100+ components, 5 AI agents
  Backend:  300+ API endpoints, 40+ apps, 15+ models, 8 celery tasks
  AI:       23 route blueprints, matchmaking, insights, tango, knowledge

COVERAGE GAP:
  ~5% covered today → target 80%+ of critical paths
```

---

## Enhancement Plan — Organized by Business Impact

### TIER 1: Highest Impact (Blocks Every Sprint)

These are the workflows that get manually tested EVERY sprint because they break the most and affect the most users.

---

#### 1.1 Demand Lifecycle — End to End

**Why this matters:** Every sprint touches demands. If create/approve/transition breaks, the entire platform is useless.

**Backend endpoints to test:**
```
POST /api/roadmap/create                          → createRoadmap
GET  /api/roadmap/get/<id>                        → GetRoadmapDetails
PUT  /api/roadmap/update/<id>                     → updateRoadmapDetails
PATCH /api/roadmap/update_attributes/<id>         → updateRoadmapAttributes
POST /api/roadmap/approve/<id>                    → ApproveRoadmap
POST /api/roadmap/reject/<id>                     → RejectRoadmap
POST /api/roadmap/archive/<id>                    → ArchiveRoadmap
DELETE /api/roadmap/delete/<id>                   → DeleteRoadmap (soft)
POST /api/roadmap/bulk-transition                 → BulkDemandTransition (VE-74)
GET  /api/roadmap/list                            → GetRoadmapList
GET  /api/roadmap/list/portfolio                  → GetRoadmapListByPortfolio
GET  /api/roadmap/list/myapprovals                → GetMyApprovalRoadmapList
GET  /api/roadmap/<id>/live/                      → DemandLiveView
GET  /api/roadmap/<id>/activity/                  → DemandActivityView
```

**Frontend routes to test:**
```
/actionhub/create-roadmap                         → CreateRoadMap form
/actionhub/edit-roadmap/:roadmap_id               → Edit demand
/actionhub/my-roadmaps                            → RoadmapsContainer
/actionhub/demand-live/:roadmap_id                → DemandLive (redirects to missions)
/actionhub/missions?roadmap_id={id}               → Missions page
```

**Test files to create:**
```
tests/platform/demand-lifecycle/
  create-demand.spec.ts              → 8 tests
    AC1: Create demand form loads with all required fields
    AC2: Portfolio dropdown populated from API
    AC3: Demand Owner dropdown shows eligible users (PortfolioLeaderMap)
    AC4: Date pickers enforce start < end validation
    AC5: Submit creates demand via POST /api/roadmap/create
    AC6: Created demand appears in /actionhub/my-roadmaps list
    AC7: Demand starts in "Intake" status (entity_workflow initialized)
    AC8: Solution team roles saved to demand (solution_team JSON field)

  demand-details.spec.ts             → 5 tests
    AC1: GET /api/roadmap/get/<id> returns full demand with resource_requirements
    AC2: Edit form pre-fills all existing values
    AC3: Update via PUT saves changes
    AC4: Demand Live page shows current status + stage stepper
    AC5: Activity feed shows creation event

  demand-approval.spec.ts            → 6 tests (multi-role)
    AC1: Demand appears in approver's "My Approvals" list
    AC2: Approve sets approved_state=1, transitions to Solutioning
    AC3: Reject sets approved_state=2, notifies creator
    AC4: Only users with 'roadmap_approve' permission see approve button
    AC5: Approval triggers notification (check via API or socket)
    AC6: Rejected demand can be edited and re-submitted

  demand-transitions.spec.ts         → 7 tests
    AC1: Entity workflow status shows current stage + allowed transitions
    AC2: Transition guards block if required fields empty
    AC3: Intake -> Solutioning transition works when guards pass
    AC4: Solutioning -> Final Review auto-releases solutioning resources
    AC5: Final Review -> Execution transition
    AC6: Execution -> Completed releases ALL resources (VE-199)
    AC7: Bulk transition works for multiple demands (VE-74)

  demand-dependencies.spec.ts        → 3 tests (VE-72)
    AC1: Add dependency (SS/SF/FS/FF) between two demands
    AC2: Dependency shows in demand details
    AC3: Delete dependency removes link
```

**Estimated manual time saved: 45 min/sprint**

---

#### 1.2 Resource Request & Allocation — Full Flow

**Why this matters:** This is THE core VE feature set. Resource allocation bugs caused the Amruta incident. Every sprint has resource-related tickets.

**Backend endpoints to test:**
```
POST /api/capacity/create_resource_request_action → createResourceRequestAction
GET  /api/capacity/list_resource_requests         → listResourceRequests
POST /api/capacity/allocate_resource_request      → allocateResourceRequest (soft-lock)
POST /api/capacity/upgrade_lock_type              → upgradeLockType (hard-lock, VE-184)
POST /api/capacity/release_resource               → releaseResourceAllocation
POST /api/capacity/reject_resource_request_action → rejectResourceRequestAction
POST /api/capacity/indicate_resource_available    → indicateResourceAvailable (VE-183)
GET  /api/capacity/get_pending_timeline_changes   → getPendingTimelineChanges (VE-211)
POST /api/capacity/approve_timeline_change        → approveTimelineChange (VE-211)
POST /api/capacity/reject_timeline_change         → rejectTimelineChange (VE-211)
GET  /api/capacity/get_allocation_changes         → getAllocationChanges
POST /api/capacity/export_resource_requests       → exportResourceRequests (VE-122)
```

**Frontend components to test:**
```
Potential Hub Shell                → PotentialHubShell.jsx
Resource Requests tab              → DemandCentricView / ResourceRequestsCard
Matchmaking Panel                  → MatchmakingPanel
Soft-Lock / Hard-Lock buttons      → LockStateBadge
Add Resource panel                 → AddResourcePanel / AddResourceForm
Pending Timeline Changes card      → PendingChangesCard (VE-211)
Manual Override Search             → search input in matchmaking (VE-180)
Cross-Portfolio Selector           → dropdown for other portfolio RMs (VE-188)
KPI Bento Strip                    → KpiBentoStrip
Intel Ticker                       → IntelTicker (conflicts highlighted)
```

**Test files to create:**
```
tests/platform/resource-management/
  resource-request-creation.spec.ts      → 6 tests (VE-83, VE-101, VE-157)
    AC1: DO creates resource request from Demand Live "Resource Requests" card
    AC2: "Define What You Need" form has Role, Skills, Portfolio, Commitment%, Dates dropdowns
    AC3: Submit calls POST /api/capacity/create_resource_request_action
    AC4: Request appears in RM's Resource Requests tab with "pending" status
    AC5: Request shows SOL/EXEC badge based on request_type (VE-177)
    AC6: Skills shown in italic next to allocation % (VE-177)

  resource-allocation-flow.spec.ts       → 8 tests (VE-180, VE-181, VE-184)
    AC1: RM sees AI-ranked candidates in matchmaking panel (match_count > 0)
    AC2: Manual Override search returns results when typing 2+ chars (VE-180)
    AC3: "Allocate" button on search result soft-locks resource
    AC4: Soft-lock creates resource_timeline with lock_type='soft'
    AC5: "Hard-Lock" button sends lock_type='hard' to backend (VE-184)
    AC6: Hard-locked resource shows different badge than soft-locked
    AC7: Release button sets is_released=True, resource becomes available
    AC8: Reject request updates match_status='rejected' with reason

  timeline-changes.spec.ts              → 5 tests (VE-200, VE-211)
    AC1: Changing demand dates triggers cascade_demand_dates
    AC2: Resource timelines show pending_approval=True
    AC3: "Pending Timeline Changes" red card appears for RM
    AC4: Approve keeps new dates, sets pending_approval=False
    AC5: Reject reverts to old_start_date/old_end_date

  cross-portfolio.spec.ts               → 3 tests (VE-188, VE-189)
    AC1: RM picks another portfolio's RM from dropdown
    AC2: Cross-portfolio request creates action for target RM
    AC3: Target RM sees "Resource Request Details" blue card (VE-189)

  alternate-availability.spec.ts         → 2 tests (VE-183)
    AC1: "Propose Alternate Availability Date" button appears when no matches
    AC2: Submit sends available_date + notes to demand owner

  export-resources.spec.ts              → 2 tests (VE-122)
    AC1: "Export to Excel" button triggers download
    AC2: Downloaded file contains expected columns (role, status, dates)

  auto-operations.spec.ts               → 3 tests (VE-185/186, VE-199)
    AC1: API test — auto_hard_lock_conversion converts soft->hard within 14 days
    AC2: API test — auto_release_on_demand_state_change releases on completed
    AC3: API test — auto_release_expired_allocations releases past-end-date
```

**Estimated manual time saved: 60 min/sprint**

---

#### 1.3 Actions Hub — Complete Workflow

**Why this matters:** Actions drive accountability. Every demand creates actions. Broken actions = no one knows what to do.

**Backend endpoints to test:**
```
POST /api/demand-actions/                         → CreateDemandAction
GET  /api/demand-actions/list/                    → ListDemandActions
PUT  /api/demand-actions/<id>/                    → UpdateDemandAction
POST /api/demand-actions/<id>/complete/            → CompleteDemandAction
POST /api/demand-actions/<id>/cancel/              → CancelDemandAction
POST /api/demand-actions/<id>/reassign/            → ReassignDemandAction
POST /api/demand-actions/<id>/comment/             → AddDemandActionComment
```

**Frontend components to test:**
```
ActionsHub.jsx          → List + Kanban + Activities views
ActionList.jsx          → Table/list rendering
ActionKanban.jsx        → Kanban board
AddActions.jsx          → Create action form
AssigneePicker.jsx      → User assignment dropdown
TopMetrics.jsx          → KPI summary
DemandGateGuard.jsx     → Blocks actions on rejected/cancelled demands
```

**Test files to create:**
```
tests/platform/actions/
  action-crud.spec.ts                → 7 tests
    AC1: Create action with title, description, assignee, due date, priority
    AC2: Action appears in list view
    AC3: Action appears on kanban board in correct column
    AC4: Update action title/description/priority
    AC5: Complete action with completion_note
    AC6: Cancel action with cancellation_reason
    AC7: Reassign action to different user

  action-comments.spec.ts           → 3 tests
    AC1: Add comment to action
    AC2: Comment appears in activity feed
    AC3: Multiple comments render in chronological order

  action-filters.spec.ts            → 4 tests
    AC1: Filter by status (open, in_progress, completed, cancelled)
    AC2: Filter by priority (high, medium, low)
    AC3: Filter by assignee
    AC4: Overdue actions highlighted

  demand-gate.spec.ts               → 3 tests
    AC1: Cannot create action on rejected demand (DemandGateBlockedModal shows)
    AC2: Cannot create action on cancelled demand
    AC3: Can create action on active demand
```

**Estimated manual time saved: 30 min/sprint**

---

### TIER 2: High Impact (Core Platform Stability)

These catch regressions that silently break features across the platform.

---

#### 2.1 Authentication & Role-Based Access — Full Matrix

**Why this matters:** The Amruta bug was a role detection issue. Every role sees a different UI. If isResourceManager is wrong, entire features disappear.

**Test files to create:**
```
tests/platform/auth/
  multi-role-access.spec.ts          → 15 tests (3 per role x 5 roles)
    For each role (RM, DO, PL, SM, DR):
      AC1: Login succeeds, redirects to /actionhub
      AC2: Role-specific nav items visible (e.g., RM sees Resource Requests, DO doesn't)
      AC3: Protected pages return correct content (not "Access Denied")

  role-detection-api.spec.ts         → 5 tests
    AC1: GET /api/users/user returns correct role for RM
    AC2: GET /api/users/user returns correct role for DO
    AC3: GET /api/users/user returns correct role for PL
    AC4: portfolio_resource_managers API returns RM mappings correctly
    AC5: PortfolioLeaderMap correctly maps PL to RM equivalent (RC1 from original)

  session-management.spec.ts         → 4 tests
    AC1: Session persists across 5 page navigations (no redirect to /sign-in)
    AC2: Token refresh works (expired token auto-refreshes)
    AC3: Logout clears all cookies/localStorage
    AC4: Multi-tab session sync (BroadcastSessionManager)
```

---

#### 2.2 Entity Workflow Engine — Status Transitions

**Why this matters:** This is the state machine behind every demand. If transitions break, demands get stuck.

**Backend endpoints to test:**
```
GET  /api/entity-workflow/entity/<type>/<id>/           → EntityCurrentStatusView
POST /api/entity-workflow/<type>/<id>/initialize/       → EntityStatusInitializeView
POST /api/entity-workflow/<type>/<id>/transition/       → EntityStatusTransitionView
GET  /api/entity-workflow/<type>/<id>/history/          → EntityStatusHistoryView
GET  /api/entity-workflow/<type>/<id>/stage-timings/    → EntityStageTimingView
GET  /api/entity-workflow/statuses/?entity_type=roadmap → WorkflowStatusByEntityTypeView
```

**Test files to create:**
```
tests/platform/entity-workflow/
  workflow-status.spec.ts            → 6 tests
    AC1: New demand initialized with correct starting status
    AC2: Current status API returns stage + allowed transitions
    AC3: Transition with passing guards succeeds
    AC4: Transition with failing guards returns error + which guard failed
    AC5: Status history records all transitions with timestamps
    AC6: Stage timing logs entry/exit for each stage

  field-access-policies.spec.ts      → 4 tests (VE-130)
    AC1: Read-only fields not editable in UI
    AC2: Hidden fields not visible for restricted roles
    AC3: Edit-allowed fields are editable
    AC4: Field access changes based on workflow stage

  stage-completion.spec.ts           → 3 tests (VE-150)
    AC1: "Mark Stage Complete" button enabled when all required fields filled
    AC2: Skip solutioning works when configured
    AC3: Stage completion triggers auto-transition
```

---

#### 2.3 Complete Route Verification

**Why this matters:** React SPAs fail silently. A bad import or missing component = blank white page. Test every route.

**Test files to create:**
```
tests/platform/navigation/
  all-routes.spec.ts                 → 25+ tests (one per critical route)
    Every route from the App.jsx router:
      /actionhub/actions
      /actionhub/my-roadmaps
      /actionhub/view-portfolios
      /actionhub/potential
      /actionhub/potential-approvals
      /actionhub/potential/resource/:id
      /actionhub/idea-pad
      /actionhub/missions
      /actionhub/agents
      /actionhub/tango
      /actionhub/pinboard
      /actionhub/integration
      /actionhub/my-projects
      /actionhub/my-portfolios
      /actionhub/my-programs
      /actionhub/spend
      /actionhub/admin-console
      /actionhub/create-roadmap
      /actionhub/create-demand
      /actionhub/create-portfolio
      /actionhub/create-project-screen-one
      /actionhub/my-offers
      /actionhub/my-providers
      /actionhub/my-customers
      /actionhub/onboard

    For each:
      - Page loads (no blank screen)
      - No React error boundary ("Something went wrong")
      - No console errors (500s, missing modules)
      - At least one interactive element visible
```

---

#### 2.4 API Contract Testing — Full Coverage

**Why this matters:** Backend deploys can silently remove/rename endpoints. Contract tests catch this in minutes, not days.

**Test files to create:**
```
tests/platform/api-contracts/
  roadmap-api.spec.ts               → 15 tests
    Every roadmap endpoint: exists (not 404), not 500, auth required (401/403)
    POST /api/roadmap/create
    GET  /api/roadmap/get/<id>
    PUT  /api/roadmap/update/<id>
    POST /api/roadmap/approve/<id>
    POST /api/roadmap/reject/<id>
    GET  /api/roadmap/list
    GET  /api/roadmap/list/portfolio
    GET  /api/roadmap/list/myapprovals
    GET  /api/roadmap/<id>/live/
    GET  /api/roadmap/<id>/activity/
    GET  /api/roadmap/<id>/resource-requirements/
    GET  /api/roadmap/<id>/projected-costs/
    GET  /api/roadmap/<id>/field-permissions/
    GET  /api/roadmap/<id>/dependencies
    POST /api/roadmap/bulk-transition

  capacity-api.spec.ts              → 20 tests (extend existing)
    Every capacity endpoint: exists, correct method, auth required
    POST /api/capacity/create_resource_request_action
    GET  /api/capacity/list_resource_requests
    POST /api/capacity/allocate_resource_request
    POST /api/capacity/upgrade_lock_type
    POST /api/capacity/release_resource
    POST /api/capacity/indicate_resource_available
    GET  /api/capacity/get_pending_timeline_changes
    POST /api/capacity/approve_timeline_change
    POST /api/capacity/reject_timeline_change
    POST /api/capacity/add_resource
    POST /api/capacity/get_resource_details
    GET  /api/capacity/get_resources
    GET  /api/capacity/get_resource_kpi_summary
    GET  /api/capacity/get_resource_matchmaking
    POST /api/capacity/allocate_resource
    GET  /api/capacity/get_resource_groups
    POST /api/capacity/export_resource_requests
    GET  /api/capacity/holidays
    GET  /api/capacity/unavailability
    GET  /api/capacity/get_resource_home_summary

  actions-api.spec.ts               → 10 tests
    POST /api/demand-actions/
    GET  /api/demand-actions/list/
    PUT  /api/demand-actions/<id>/
    POST /api/demand-actions/<id>/complete/
    POST /api/demand-actions/<id>/cancel/
    POST /api/demand-actions/<id>/reassign/
    POST /api/demand-actions/<id>/comment/
    GET  /api/action/get_actions
    POST /api/action/add
    PUT  /api/action/update/<id>

  entity-workflow-api.spec.ts       → 8 tests
    GET  /api/entity-workflow/entity/roadmap/<id>/
    POST /api/entity-workflow/roadmap/<id>/initialize/
    POST /api/entity-workflow/roadmap/<id>/transition/
    GET  /api/entity-workflow/roadmap/<id>/history/
    GET  /api/entity-workflow/statuses/?entity_type=roadmap
    GET  /api/entity-workflow/definitions/
    GET  /api/entity-workflow/field-access-policies/
    POST /api/entity-workflow/roadmap/<id>/mark-stage-complete/

  authorization-api.spec.ts         → 8 tests
    GET  /api/get_org_roles/
    GET  /api/get_org_user_role/
    POST /api/auth/update_user_portfolio
    GET  /api/get_approval_user_list
    POST /api/create_approval_request
    POST /api/approve_reject_request
    GET  /api/get_project_roles/
    POST /api/admin/portfolio-access/

  users-api.spec.ts                 → 6 tests
    POST /api/users/login
    GET  /api/users/user
    GET  /api/users/tenant-user-list
    GET  /api/users/portfolio-users
    GET  /api/users/get-org-role
    GET  /api/users/get/preference

  ai-api.spec.ts                    → 8 tests
    POST /trmeric_ai/match_making/fetch/<data_type>
    POST /trmeric_ai/match_making/shortlist_provider
    GET  /trmeric_ai/agents/portfolios_management/portfolio/list
    POST /trmeric_ai/agents/actions/ai_summary
    GET  /trmeric_ai/potential/resources
    GET  /trmeric_ai/potential/insights
    GET  /trmeric_ai/insight/live/<entity_type>/<id>
    POST /trmeric_ai/roadmap/scope
```

**Estimated manual time saved: 90 min/sprint** (currently nobody tests all 300 endpoints)

---

### TIER 3: Medium Impact (Feature Completeness)

---

#### 3.1 Portfolio Management

**Test files to create:**
```
tests/platform/portfolio/
  portfolio-crud.spec.ts             → 5 tests
    AC1: Create portfolio form loads
    AC2: Submit creates portfolio via API
    AC3: Portfolio appears in /actionhub/view-portfolios
    AC4: Edit portfolio updates details
    AC5: Portfolio shows demand count + resource count

  portfolio-accountability.spec.ts   → 3 tests (VE-76/165)
    AC1: GET /api/roadmap/list/portfolio-accountability returns demands by portfolio
    AC2: Demand count matches UI
    AC3: Accountability view shows assignee + status + cost snapshot
```

---

#### 3.2 IdeaPad — Idea to Demand Pipeline

**Test files to create:**
```
tests/platform/ideapad/
  idea-creation.spec.ts             → 5 tests
    AC1: IdeaPad form loads at /actionhub/idea-pad
    AC2: All accordion sections expand (Scope, Business Case, Journey, Spark, Actions, Documents)
    AC3: Submit creates idea
    AC4: Idea appears in /actionhub/my-ideas
    AC5: Promote idea to demand creates roadmap linked to idea

  idea-edit.spec.ts                 → 2 tests
    AC1: Edit form loads at /actionhub/edit-idea-pad/:idea_id
    AC2: Save updates idea
```

---

#### 3.3 Project Management

**Test files to create:**
```
tests/platform/projects/
  project-creation.spec.ts          → 5 tests
    AC1: Multi-step form loads (Counter1-Counter16 steps)
    AC2: Navigate forward/backward between steps
    AC3: Final review page shows all entered data
    AC4: Submit creates project
    AC5: Project appears in /actionhub/my-projects

  project-details.spec.ts           → 4 tests
    AC1: Project page loads at /projects/:projectid
    AC2: Discover tab renders
    AC3: Engage tab renders
    AC4: Build tab renders
```

---

#### 3.4 AI Agents

**Test files to create:**
```
tests/platform/ai-agents/
  tango-chat.spec.ts                → 4 tests
    AC1: Tango chat loads at /actionhub/tango
    AC2: Message input accepts text
    AC3: Sending message shows loading state
    AC4: Response renders in chat (or timeout gracefully)

  agent-views.spec.ts               → 3 tests
    AC1: Agents page loads at /actionhub/agents
    AC2: Agent cards render (Orion, Tango, Spend, Portfolio, Roadmap)
    AC3: Selecting an agent opens interaction view

  portfolio-agent.spec.ts           → 2 tests
    AC1: Portfolio agent API responds
    AC2: Spend analysis API responds
```

---

#### 3.5 Integrations

**Test files to create:**
```
tests/platform/integrations/
  integration-page.spec.ts          → 3 tests
    AC1: Integration page loads at /actionhub/integration
    AC2: Available integrations list renders (Jira, ADO, Slack, Google Drive)
    AC3: Integration status indicators show connected/disconnected
```

---

#### 3.6 Resource Profile & Capacity

**Test files to create:**
```
tests/platform/resource-management/
  resource-profile.spec.ts          → 4 tests
    AC1: Resource profile loads at /actionhub/potential/resource/:id
    AC2: Profile shows name, role, skills, allocation bar
    AC3: Timeline section shows current/future allocations
    AC4: Unavailability periods shown (VE-175)

  resource-crud.spec.ts             → 4 tests (VE-170)
    AC1: "Add Resource" panel opens
    AC2: Portfolio dropdown populated from system
    AC3: Role options come from system (not hardcoded)
    AC4: Save Resource actually persists to database

  resource-search.spec.ts           → 3 tests
    AC1: Search bar in Potential Hub filters resources by name
    AC2: Search by role returns matching resources
    AC3: Search by skill returns matching resources
```

---

### TIER 4: Infrastructure & Advanced

---

#### 4.1 Test Data Factory (Helper Module)

**Why this matters:** Tests currently depend on existing data in QA. If someone deletes the test demand, tests fail. A factory creates fresh data for each test run.

**File to create:**
```
tests/helpers/factory.ts

export class TrmericFactory {
  // Create a test demand (via API) and return its ID
  async createDemand(overrides?: Partial<DemandInput>): Promise<{ id: number; title: string }>

  // Create a resource request on a demand
  async createResourceRequest(demandId: number, overrides?: Partial<RequestInput>): Promise<{ id: number }>

  // Create an action
  async createAction(demandId: number, overrides?: Partial<ActionInput>): Promise<{ id: number }>

  // Cleanup — delete everything created in this test run
  async cleanup(): Promise<void>
}
```

This makes tests **self-contained** — no "test failed because someone deleted the test data" problems.

---

#### 4.2 API Response Schema Validation

**Why this matters:** Backend changes response shapes without telling frontend. Frontend renders blank because `.data.resource_data` became `.data.resources`. Schema validation catches this instantly.

**File to create:**
```
tests/helpers/schemas.ts

// Zod schemas for all critical API responses
export const ResourceListSchema = z.object({
  resource_data: z.array(z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    role: z.string(),
    allocation: z.number(),
    // ...
  }))
});

export const DemandDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  current_state: z.number(),
  approved_state: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  portfolio_list: z.array(z.object({...})),
  resource_requirements: z.array(z.object({...})),
  status_info: z.object({
    current_status: z.string(),
    stage: z.string(),
    allowed_transitions: z.array(z.object({...})),
  }),
});
```

Then in API contract tests:
```typescript
test('get_resources returns valid schema', async ({ request }) => {
  const response = await api.getResources();
  const parsed = ResourceListSchema.safeParse(response.data);
  expect(parsed.success).toBeTruthy();
});
```

---

#### 4.3 Real-Time Socket Event Testing

**Why this matters:** Socket events drive live updates. If they break, users don't see real-time changes.

**Events to test (from SocketProvider.jsx):**
```
tests/platform/realtime/
  socket-events.spec.ts             → 6 tests
    AC1: actions.status_changed event triggers Redux dispatch
    AC2: actions.assigned event updates action list
    AC3: actions.overdue event shows notification
    AC4: Agent message streaming events render in chat
    AC5: Demand status change event updates DemandLive view
    AC6: Resource allocation change event updates Potential Hub
```

---

#### 4.4 Visual Regression — All Critical Views

**Extend existing visual tests:**
```
tests/visual/
  screenshots.spec.ts               → 15 tests (extend from 5 to 15)
    Existing 5 + add:
    - Create Roadmap form
    - Resource Requests view (demand-centric)
    - Matchmaking panel (when open)
    - Actions Hub kanban view
    - IdeaPad form
    - Portfolio view
    - Resource Profile page
    - Admin Console
    - Missions canvas
    - Agent chat view
```

---

#### 4.5 Performance Budgets

**File to create:**
```
tests/platform/performance/
  page-load-times.spec.ts           → 8 tests
    For each critical page, measure time from navigation to first meaningful content:
      Potential Hub:     < 5s
      Actions Hub:       < 4s
      My Roadmaps:       < 4s
      Demand Live:       < 5s
      Portfolios:        < 4s
      Create Roadmap:    < 3s
      Missions:          < 5s
      Agent Chat:        < 3s

  api-response-times.spec.ts        → 5 tests
    For key APIs, verify response time under load:
      list_resource_requests: < 2s
      get_resources:          < 2s
      get_roadmap_list:       < 2s
      portfolio_resource_managers: < 1s
      demand-actions/list/:   < 1s
```

---

#### 4.6 CI/CD Pipeline (GitHub Actions)

**File to create:**
```
.github/workflows/e2e-tests.yml

Triggers:
  - On every PR to main/develop
  - On every deploy to QA environment
  - Nightly full regression at 2:00 AM

Jobs:
  smoke:
    - npm run test:smoke (10s)
    - Blocks merge if fails

  api-contracts:
    - npm run test:platform --project=api-contracts (30s)
    - Blocks merge if fails

  e2e:
    - npm run test:platform (2 min)
    - Blocks merge if fails

  visual:
    - npm run test:visual (1 min)
    - Warning only (doesn't block merge)

  user-stories:
    - npm run test:stories (2 min)
    - Nightly only

Artifacts:
  - HTML report uploaded to GitHub Actions artifacts
  - Screenshots/traces on failure
  - Slack notification on failure
```

---

#### 4.7 Accessibility Testing

**File to create:**
```
tests/platform/accessibility/
  a11y-critical-pages.spec.ts       → 8 tests
    For each page, run axe-core accessibility audit:
      Login page
      Potential Hub
      Actions Hub
      Create Roadmap form
      Demand Live
      Portfolios
      IdeaPad
      Agent Chat

    Check for:
      - Missing aria labels
      - Insufficient color contrast
      - Missing form labels
      - Keyboard navigation support
      - Screen reader compatibility
```

---

## Complete Test Count Summary

| Category | Files | Tests | Priority |
|---|---|---|---|
| **Demand Lifecycle** | 5 | 29 | TIER 1 |
| **Resource Allocation** | 7 | 29 | TIER 1 |
| **Actions Hub** | 4 | 17 | TIER 1 |
| **Auth & Roles** | 3 | 24 | TIER 2 |
| **Entity Workflow** | 3 | 13 | TIER 2 |
| **Route Verification** | 1 | 25 | TIER 2 |
| **API Contracts** | 8 | 75 | TIER 2 |
| **Portfolio** | 2 | 8 | TIER 3 |
| **IdeaPad** | 2 | 7 | TIER 3 |
| **Projects** | 2 | 9 | TIER 3 |
| **AI Agents** | 3 | 9 | TIER 3 |
| **Integrations** | 1 | 3 | TIER 3 |
| **Resource Profile** | 3 | 11 | TIER 3 |
| **Socket Events** | 1 | 6 | TIER 4 |
| **Visual Regression** | 1 | 15 | TIER 4 |
| **Performance** | 2 | 13 | TIER 4 |
| **Accessibility** | 1 | 8 | TIER 4 |
| **Existing Tests** | 8 | 39 | DONE |
| **TOTAL** | **57** | **~340** | |

---

## Implementation Timeline

```
SPRINT N (Current):     Already have 39 tests across 8 files
                        Coverage: ~5% of critical paths

SPRINT N+1:             + Tier 1 (75 tests)
                        Demand lifecycle + Resource allocation + Actions
                        Coverage: ~30% of critical paths
                        Manual QA saved: ~2 hours/sprint

SPRINT N+2:             + Tier 2 (145 tests)
                        Auth matrix + Workflow engine + All routes + Full API contracts
                        Coverage: ~60% of critical paths
                        Manual QA saved: ~4 hours/sprint

SPRINT N+3:             + Tier 3 (47 tests)
                        Portfolio + IdeaPad + Projects + AI + Resources
                        Coverage: ~75% of critical paths
                        Manual QA saved: ~5 hours/sprint

SPRINT N+4:             + Tier 4 (42 tests) + CI/CD pipeline
                        Socket + Visual + Performance + a11y + GitHub Actions
                        Coverage: ~85% of critical paths
                        Manual QA: runs automatically, team just checks report
```

---

## The Bottom Line

```
TODAY:
  39 tests | 5% coverage | Manual QA: 2-3 days/sprint | No CI integration

TARGET (4 sprints from now):
  340 tests | 85% coverage | Auto QA: 15 min pipeline | CI blocks broken PRs

WHAT THIS MEANS FOR THE COMPANY:
  - Ship features 2x faster (no QA bottleneck)
  - Catch bugs before users do (not after)
  - Every VE ticket has proof it works (HTML report)
  - New team members onboard faster (tests are documentation)
  - Stakeholders see green checkmarks, not "trust me it works"
```

---

*Generated from deep analysis of:*
*- Trmeric Frontend: 60+ routes, 45 Redux slices, 100+ components*
*- Trmeric Backend: 300+ API endpoints, 40+ Django apps, 15+ models*
*- Trmeric AI: 23 route blueprints, matchmaking, agents, insights*
*- Current trmeric-testing suite: 39 tests across 8 files*
