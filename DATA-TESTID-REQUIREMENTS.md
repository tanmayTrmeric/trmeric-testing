# Data-TestID Requirements for Trmeric Frontend

**Purpose:** These `data-testid` attributes MUST be added to the listed React components to stabilize E2E tests. Without them, UI tests rely on CSS classes that break on every style change.

**Convention:** `kebab-case`, format: `{component}-{element}`

**How to add:**
```jsx
// Before:
<Box className={styles.sidebar}>

// After:
<Box className={styles.sidebar} data-testid="potential-hub-sidebar">
```

---

## PRIORITY 1 — Blocks Golden Path Tests (Add Immediately)

### Potential Hub (`src/components/ActionHub/Potential/`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| PotentialHubShell | Main container | `potential-hub-shell` | Entry point for all resource tests |
| PotentialHubSidebar | Sidebar nav | `potential-hub-sidebar` | Navigate between views |
| PotentialHubSidebar | Resource-Centric tab | `sidebar-resource-centric` | Click to switch view |
| PotentialHubSidebar | Resource Requests tab | `sidebar-resource-requests` | Click to switch to demand view |
| PotentialHubSidebar | Lock overlay on tab | `sidebar-tab-locked` | Test non-RM lock behavior |
| PotentialHubHeader | Header bar | `potential-hub-header` | Verify header renders |
| KpiBentoStrip | KPI strip container | `kpi-bento-strip` | Verify metrics render |
| KpiBentoStrip | Each KPI card | `kpi-card-{metric}` | e.g., `kpi-card-utilization` |
| IntelTicker | Ticker bar | `intel-ticker` | Real-time alerts |
| AddResourcePanel | Panel container | `add-resource-panel` | VE-170 tests |
| AddResourcePanel | Save button | `add-resource-save-btn` | VE-170: save actually works |
| AddResourcePanel | Portfolio dropdown | `add-resource-portfolio-dropdown` | VE-170: portfolio selection |

### Resource Requests View (`DemandCentricView` / `DemandTable`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| DemandTable | Table container | `demand-table` | Main request table |
| DemandTable | Demand group row | `demand-group-{demandId}` | Expandable demand rows |
| DemandTable | Role sub-row | `role-row-{requestId}` | Individual role requests |
| DemandTable | Phase badge (SOL/EXEC) | `phase-badge-{requestId}` | VE-177: phase indicator |
| DemandTable | Skills display | `skills-display-{requestId}` | VE-177: skills in italic |
| DemandTable | Review button | `review-btn-{requestId}` | Opens matchmaking panel |
| MatchmakingPanel | Panel container | `matchmaking-panel` | The right-side panel |
| MatchmakingPanel | Search input | `matchmaking-search-input` | VE-180: manual override search |
| MatchmakingPanel | Candidate list | `matchmaking-candidates` | AI-ranked candidates |
| MatchmakingPanel | Allocate button | `allocate-btn-{resourceId}` | Soft-lock a resource |
| MatchmakingPanel | Soft-Lock button | `soft-lock-btn` | VE-181 |
| MatchmakingPanel | Hard-Lock button | `hard-lock-btn` | VE-184 |
| LockStateBadge | Badge element | `lock-badge-{timelineId}` | Shows soft/hard lock state |
| PendingChangesCard | Card container | `pending-timeline-changes-card` | VE-211: red card |
| PendingChangesCard | Approve button | `timeline-approve-btn-{changeId}` | VE-211 |
| PendingChangesCard | Reject button | `timeline-reject-btn-{changeId}` | VE-211 |

### Resource Profile (`src/components/ActionHub/Potential/ResourceProfile`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| ResourceProfile | Profile container | `resource-profile` | Main profile page |
| ResourceProfile | Name display | `resource-name` | Identity |
| ResourceProfile | Role display | `resource-role` | Role info |
| ResourceProfile | Allocation bar | `resource-allocation-bar` | Visual allocation |
| ResourceProfile | Timeline section | `resource-timeline` | Current allocations |

---

## PRIORITY 2 — Blocks Demand Lifecycle Tests

### Create Demand Form (`src/components/ActionHub/RoadMap/`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| CreateRoadMap | Form container | `create-demand-form` | Main form |
| CreateRoadMapSideNav | Side nav | `create-demand-sidenav` | Form sections |
| CreateRoadMapForm | Title input | `demand-title-input` | Required field |
| CreateRoadMapForm | Description textarea | `demand-description-input` | Required field |
| CreateRoadMapForm | Portfolio dropdown | `demand-portfolio-dropdown` | Required field |
| CreateRoadMapForm | Start date picker | `demand-start-date` | Date input |
| CreateRoadMapForm | End date picker | `demand-end-date` | Date input |
| CreateRoadMapForm | Priority selector | `demand-priority-selector` | Priority dropdown |
| CreateRoadMapForm | Type selector | `demand-type-selector` | Demand type |
| CreateRoadMapForm | Submit button | `demand-submit-btn` | Form submission |
| CreateRoadMapForm | Save draft button | `demand-save-draft-btn` | Save without submit |

### Demand Live (`src/components/ActionHub/DemandLive/`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| DemandLive (index) | Page container | `demand-live-page` | Main container |
| StageStepper | Stepper container | `demand-stage-stepper` | Shows current stage |
| StageStepper | Stage step | `stage-step-{stageName}` | e.g., `stage-step-solutioning` |
| ZoneHeader | Header | `demand-zone-header` | Title + status |
| ResourceRequestsCard | Card container | `demand-resource-requests-card` | VE-83: resource requests |
| ResourceRequestsCard | Add Role button | `add-role-requirement-btn` | VE-157: "+ Add Role Requirement" |
| ActivityFeed | Feed container | `demand-activity-feed` | Activity timeline |
| ActionSlideOut | Slide-out panel | `action-slide-out` | Create action panel |

### My Roadmaps / Demand List

| Component | Element | data-testid | Why |
|---|---|---|---|
| RoadmapsContainer | Container | `my-roadmaps-container` | Demand list page |
| RoadmapsContainer | Demand card | `demand-card-{demandId}` | Individual demand cards |
| RoadmapsContainer | Status filter | `demand-status-filter` | Filter by status |
| RoadmapsContainer | Search input | `demand-search-input` | Search demands |

---

## PRIORITY 3 — Blocks Actions Hub Tests

### Actions Hub (`src/components/ActionHub/DemandActions/`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| ActionsHub | Main container | `actions-hub` | Entry point |
| ActionsHub | List view toggle | `actions-view-list` | Switch to list |
| ActionsHub | Kanban view toggle | `actions-view-kanban` | Switch to kanban |
| ActionList | Table/list container | `actions-list` | Action items |
| ActionList | Action row | `action-row-{actionId}` | Individual action |
| ActionKanban | Kanban board | `actions-kanban-board` | Kanban columns |
| ActionKanban | Column | `kanban-column-{status}` | e.g., `kanban-column-open` |
| AddActions | Form container | `add-action-form` | Create action |
| AddActions | Title input | `action-title-input` | Required |
| AddActions | Assignee picker | `action-assignee-picker` | AssigneePicker dropdown |
| AddActions | Due date picker | `action-due-date` | Date input |
| AddActions | Priority selector | `action-priority-selector` | High/Medium/Low |
| AddActions | Submit button | `action-submit-btn` | Create action |
| TopMetrics | Metrics container | `actions-top-metrics` | KPI cards |
| DemandGateBlockedModal | Modal | `demand-gate-blocked-modal` | Blocks on rejected demands |

---

## PRIORITY 4 — Nice to Have

### Global / Common Components

| Component | Element | data-testid | Why |
|---|---|---|---|
| ProtectedRoutes | Auth wrapper | `protected-route` | Auth testing |
| ActionHubLayout | Main layout | `actionhub-layout` | Layout structure |
| RightNav | Right sidebar | `right-nav` | Navigation icons |
| SocketProvider | (no visual) | N/A | Socket events only |
| ConfirmationModal | Modal container | `confirmation-modal` | All confirmation dialogs |
| DeleteConfirmationModal | Modal container | `delete-confirmation-modal` | Delete dialogs |
| CommonModal | Modal container | `common-modal` | Generic modals |

### IdeaPad (`src/components/IdeaPad/`)

| Component | Element | data-testid | Why |
|---|---|---|---|
| IdeaPad | Form container | `ideapad-form` | Main form |
| IdeaPadSideNav | Side nav | `ideapad-sidenav` | Form sections |
| IdeaScopeAccordion | Section | `ideapad-scope-section` | Scope accordion |
| IdeaBusinessCaseAccordion | Section | `ideapad-business-case-section` | Business case |

---

## Summary

| Priority | Components | data-testid count | Blocks |
|---|---|---|---|
| **P1** | Potential Hub, Resource Requests, Matchmaking | 32 | Golden Path: Allocate Resource |
| **P2** | Create Demand, Demand Live, My Roadmaps | 22 | Golden Path: Create Demand |
| **P3** | Actions Hub, Kanban, Add Action | 15 | Actions Hub tests |
| **P4** | Global, IdeaPad | 10 | Future tests |
| **TOTAL** | | **79** | |

---

## How to Implement

1. **Branch:** Create `feature/add-data-testid-for-e2e` from develop
2. **Add attributes:** Open each component file, add `data-testid` to the listed elements
3. **Verify:** Run `npm run test:stories` after adding — tests that use `getByTestId` will start passing
4. **PR:** Merge to develop — zero functional impact, only adds HTML attributes
