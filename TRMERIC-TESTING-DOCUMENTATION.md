# Trmeric Testing Suite — Team Documentation

**Prepared by: Tanmay Sharma | Date: May 17, 2026**
**Purpose: Team walkthrough & future roadmap alignment**

---

## 1. What Is This?

The Trmeric Testing Suite is an **automated end-to-end (E2E) testing framework** built specifically for the Trmeric platform. It uses **Playwright** (Microsoft's industry-leading browser automation tool) to test the application exactly the way a real user would — opening a browser, clicking buttons, filling forms, and verifying results.

### The Problem It Solves

| Before (Manual QA) | After (Automated) |
|---|---|
| "Amruta, please login as RM8 and check if Resource Requests tab is unlocked" | `npm run test:stories` — 6 tests pass in 45 seconds |
| Manual regression takes 2-3 hours per sprint | Full regression runs in under 5 minutes |
| QA gaps when someone is on leave | Tests run 24/7, same checks every time |
| "It works on my machine" | Tests run against dev, QA, EU, and prod environments |
| No proof that features work post-deploy | HTML reports with screenshots and video evidence |

### How It Fits Into Trmeric

```
Trmeric Ecosystem
  |
  +-- Trmeric Frontend (React + Vite)     <-- What users see
  |     - ActionHub, Potential Hub, IdeaPad, DemandLive
  |
  +-- Trmeric Backend (Django REST API)   <-- Business logic + database
  |     - /api/capacity/*, /api/actions/*, /api/roadmap/*
  |
  +-- Trmeric AI (Python)                 <-- AI suggestions, matchmaking
  |
  +-- Trmeric Testing (THIS REPO)         <-- Automated verification layer
        - Tests Frontend pages load correctly
        - Tests Backend APIs respond correctly
        - Tests user workflows end-to-end
        - Tests role-based access (RM, DO, PL, SM, DR)
```

---

## 2. Architecture Overview

### Test Pyramid We Follow

```
          /  Visual Regression  \          ← Catches CSS/layout breakage
         /    User Story Tests   \         ← Maps 1:1 to VE sprint tickets
        /     Platform Tests      \        ← Tests core features (routes, auth, hubs)
       /    API Contract Tests     \       ← Validates backend endpoints exist & respond
      /       Smoke Tests           \      ← "Is the app alive?" — 30-second check
     /_____________________________\
```

### Project Structure

```
trmeric-testing/
|
+-- playwright.config.ts              Config: environments, timeouts, reporters
+-- package.json                      All npm commands (30+ scripts)
+-- .env.example                      Template for credentials (5 roles)
+-- .env                              Your credentials (gitignored, never commit)
|
+-- tests/
|   +-- auth.setup.ts                 Master login: handles token injection + MFA
|   +-- auth-roles.setup.ts           Multi-role login (RM, DO, PL)
|   +-- .auth/                        Saved browser sessions (gitignored)
|   |   +-- rm.json                   Resource Manager session cookies
|   |   +-- do.json                   Demand Owner session cookies
|   |   +-- pl.json                   Portfolio Leader session cookies
|   |   +-- sm.json                   Solution Manager session cookies
|   |   +-- dr.json                   Demand Requestor session cookies
|   |
|   +-- helpers/                      Shared utilities
|   |   +-- urls.ts                   URL config for 4 environments + all API endpoints
|   |   +-- api.ts                    TrmericAPI class — authenticated backend calls
|   |   +-- roles.ts                  Role definitions — single source of truth
|   |
|   +-- smoke/                        Health checks (no login needed)
|   |   +-- smoke.spec.ts             Backend health (3 APIs) + Frontend health (2 checks)
|   |
|   +-- platform/                     Core platform tests
|   |   +-- api-contracts/
|   |   |   +-- capacity-api.spec.ts  Tests 4 capacity endpoints + actions + roadmap APIs
|   |   +-- auth/
|   |   |   +-- role-detection.spec.ts  Session persistence + role-based access
|   |   +-- navigation/
|   |   |   +-- routes.spec.ts        All critical routes render without crash
|   |   +-- resource-management/
|   |       +-- potential-hub.spec.ts  Roster table, KPI strip, search, API contracts
|   |       +-- actions-hub.spec.ts   Actions page renders, filters work
|   |
|   +-- user-stories/                 Sprint-mapped BDD tests
|   |   +-- _TEMPLATE.spec.ts         Copy this for every new VE ticket
|   |   +-- US-resource-manager-access.spec.ts
|   |                                 Tests VE-83, VE-101, VE-176, VE-188
|   |
|   +-- visual/                       Screenshot comparison tests
|       +-- screenshots.spec.ts       5 pages: Potential Hub, Actions, Portfolios,
|       +-- snapshots/                  My Hub, Login — pixel-diff detection
|
+-- reports/                          Generated reports (gitignored)
    +-- dev/                          HTML report for dev environment
    +-- qa/                           HTML report for QA environment
    +-- dev-results.json              Machine-readable results
```

---

## 3. What It Tests Today

### Test Count Summary

| Test Category | File Count | Test Count | What It Validates |
|---|---|---|---|
| **Smoke Tests** | 1 | 5 | Backend APIs respond (3) + Frontend loads (2) |
| **API Contracts** | 1 | 6 | Capacity/Actions/Roadmap endpoints exist, no 404/500 |
| **Auth & Roles** | 1 | 3 | Session persists across pages, role detected, API authenticates |
| **Navigation** | 1 | 5 | 4 critical routes render + sidebar renders |
| **Potential Hub** | 1 | 6 | Roster table, KPI strip, search, resource API, RM API, KPI API |
| **Actions Hub** | 1 | 3 | Page renders, list/kanban loads, filter tabs visible |
| **Visual Regression** | 1 | 5 | Pixel-diff screenshots of 5 critical pages |
| **User Stories** | 1 | 6 | RM access (AC1-AC5), request routing (AC2/RC2), non-RM lock (AC3) |
| **TOTAL** | **8** | **~39** | |

### VE Tickets Currently Covered

| VE Ticket | Feature | Test File |
|---|---|---|
| VE-83 | Resource Requests button for Demand Owners | US-resource-manager-access.spec.ts |
| VE-101 | Request Resources from Demand Live | US-resource-manager-access.spec.ts |
| VE-170 | Add Resource panel saves to DB | potential-hub.spec.ts |
| VE-175 | Full resource overview with profiles | potential-hub.spec.ts |
| VE-176 | List of all resource requests for portfolio | US-resource-manager-access.spec.ts |
| VE-177 | Skills & Phase badges on role rows | potential-hub.spec.ts |
| VE-180 | Manual Override search works | potential-hub.spec.ts |
| VE-188 | Cross-portfolio resource requests | US-resource-manager-access.spec.ts |

---

## 4. Multi-Environment Support

The suite supports **4 Trmeric instances** out of the box:

| Environment | Frontend URL | Backend URL | Usage |
|---|---|---|---|
| **dev** | `localhost:5173` | `trmeric-strong.trmeric.com` | Local development |
| **qa** | `trmeric-live.trmeric.com` | `trmeric-strong.trmeric.com` | QA/Test validation |
| **eu** | `trmeric-eu.trmeric.com` | `trmeric-eu-strong.trmeric.com` | EU region testing |
| **prod** | `app.trmeric.com` | `api.trmeric.com` | Smoke tests only! |

### How to switch environments

```bash
# Test against QA
npm run qa

# Test against EU
npm run eu

# Smoke-check production
npm run prod:smoke

# Local development (default)
npm run dev
```

Each environment gets its own HTML report folder (`reports/dev/`, `reports/qa/`, etc.).

---

## 5. Multi-Role Authentication

The suite supports **5 Trmeric personas** — each with separate login sessions:

| Role Key | Persona | What They Can Do | Auth File |
|---|---|---|---|
| `rm` | Resource Manager | Access Resource Requests, allocate, matchmake | `.auth/rm.json` |
| `do` | Demand Owner | Create demands, request resources, cannot allocate | `.auth/do.json` |
| `pl` | Portfolio Leader | Portfolio management, treated as RM for mapped portfolios | `.auth/pl.json` |
| `sm` | Solution Manager | Manages solutioning phase, team composition | `.auth/sm.json` |
| `dr` | Demand Requestor | Submit demand requests, limited access | `.auth/dr.json` |

### Two Auth Modes

**Mode 1: Token Injection (Instant)**
- Paste your JWT from browser DevTools into `.env` as `TRMERIC_AUTH_TOKEN`
- Skips all browser login entirely — tests start in <2 seconds
- Best for CI/CD pipelines

**Mode 2: Browser Login (Manual MFA)**
- Set email + password for each role in `.env`
- The suite fills in credentials, then **pauses for you to click login and enter MFA**
- Best for local development and first-time setup

---

## 6. How to Run

### Everyday Commands

| Command | What It Does | Time |
|---|---|---|
| `npm run test:smoke` | 5 health checks — is the app alive? | ~10s |
| `npm run test:platform` | Core platform tests (auth, routes, hubs, APIs) | ~60s |
| `npm run test:stories` | User story tests mapped to VE tickets | ~45s |
| `npm run test:visual` | Screenshot comparison across 5 pages | ~40s |
| `npm run test:all` | Everything above, combined | ~3min |

### Demo & Presentation Commands

| Command | What It Does | Best For |
|---|---|---|
| `npm run test:ui` | Opens Playwright's interactive UI with timeline | Team demos |
| `npm run test:report` | Opens HTML report in browser | Sprint reviews |
| `npm run test:headed` | Runs with visible browser window | Stakeholder walkthroughs |

### Debug Commands

| Command | What It Does |
|---|---|
| `npm run test:debug` | Step-through debugger — pause on each step |
| `npm run test:headed` | Watch the browser as tests run |
| `npx playwright codegen https://trmeric-live.trmeric.com` | Record new selectors by clicking around |

---

## 7. How to Add a New Test (Sprint Workflow)

### From VE Ticket to Automated Test — 4 Steps

```
Step 1: Copy the template
   copy tests\user-stories\_TEMPLATE.spec.ts tests\user-stories\US-VE211-timeline-approval.spec.ts

Step 2: Fill in the user story header
   AS A [persona] / I WANT [feature] / SO THAT [value]
   + List acceptance criteria (AC1, AC2, AC3...)

Step 3: Write one test per acceptance criterion
   test('AC1: Pending Timeline Changes card appears', async ({ page }) => {
     // ARRANGE: Navigate to the right page
     // ACT: Perform the user action
     // ASSERT: Verify the expected outcome
   });

Step 4: Run it
   npm run test:stories
```

### Template Standards Enforced

The `_TEMPLATE.spec.ts` enforces:

1. **BDD format**: Every test starts with AS A / I WANT / SO THAT
2. **data-testid selectors**: No fragile CSS class selectors — use `page.getByTestId('...')`
3. **ARRANGE-ACT-ASSERT**: Clear test structure
4. **VE ticket mapping**: Every test file references its sprint ticket

---

## 8. Key Design Decisions

| Decision | Why |
|---|---|
| **Playwright over Cypress** | Faster (parallel, headless), built-in trace viewer, native GitHub Actions, Vite+React+TS stack fit |
| **BDD User Story format** | Tests map 1:1 to sprint tickets — every VE ticket gets a test file |
| **Multi-environment config** | One codebase tests dev, QA, EU, prod — no duplicate test projects |
| **Token + Browser auth** | Token for CI (instant), browser for local (supports MFA) |
| **Visual regression** | Catches CSS breakage that functional tests miss (layout shifts, color changes) |
| **data-testid standard** | Tests don't break when CSS classes change — selectors tied to component identity |
| **Separate auth state files** | Login once, reuse cookies — saves ~10s per test, supports multi-role |

---

## 9. Trmeric-Specific API Coverage

The `TrmericAPI` helper class provides typed access to all key backend endpoints:

```typescript
const api = new TrmericAPI(request, cookies);

// Resource Management
await api.getResources();              // POST /api/capacity/get_resources
await api.getPortfolioRMs();           // GET  /api/capacity/portfolio_resource_managers
await api.listResourceRequests();      // GET  /api/capacity/list_resource_requests
await api.getKpiSummary();             // GET  /api/capacity/get_resource_kpi_summary

// Health
await api.healthCheck();               // Quick alive check
```

### All Mapped Endpoints (in `urls.ts`)

| Category | Endpoints |
|---|---|
| **Auth** | `/api/users/login` |
| **Capacity** | `get_resources`, `get_resource_details`, `get_resource_kpi_summary`, `portfolio_resource_managers`, `create_resource_request_action`, `list_resource_requests`, `allocate_resource_request`, `lock_resource` |
| **Actions** | `/api/actions/list`, `/api/actions/create` |
| **Roadmap** | `/api/roadmap/list`, `/api/roadmap/details` |
| **Projects** | `/api/workflow/list`, `/api/workflow/details` |

---

## 10. Reports & Evidence

### HTML Report (Best for Sprint Reviews)

After running tests:
```bash
npm run test:report
```

The report shows:
- **Pass/Fail summary** with green/red indicators
- **Test timeline** showing execution duration
- **Screenshots** captured on failure (shows exactly what the user saw)
- **Trace viewer** — step-by-step replay of every click, network call, and DOM change
- **Video recording** on first retry (captures the full test flow)

### Visual Regression Diffs

When a screenshot test fails, Playwright generates:
- `expected.png` — the baseline (last known good state)
- `actual.png` — what it looks like now
- `diff.png` — red highlights showing exactly what changed

---

## 11. Frontend Routes Covered

Every route below is actively tested for "renders without crash":

| Route | Page |
|---|---|
| `/sign-in` | Login page |
| `/actionhub/my-hub` | My Hub dashboard |
| `/actionhub/demands` | Demands list |
| `/actionhub/view-projects` | Projects view |
| `/actionhub/view-portfolios` | Portfolios page |
| `/actionhub/potential` | Potential Hub (Resource Management) |
| `/actionhub/potential-approvals` | Potential Approvals |
| `/actionhub/actions` | Actions Hub |
| `/actionhub/pinboard` | Pinboard |

---

## 12. Enhancements Roadmap — Making This Best-in-Class

Here's the planned evolution to make this the **most comprehensive automation tool for Trmeric**:

### Phase 1: Complete VE Ticket Coverage (Next 2 Sprints)

| Enhancement | VE Tickets | Impact |
|---|---|---|
| **Demand Owner workflow tests** | VE-83, VE-101, VE-157 | Test "Request Resources" button, role requirement form, full DO workflow |
| **Hard-Lock / Soft-Lock tests** | VE-181, VE-184, VE-201 | Verify lock_type: 'hard' vs 'soft' sent to backend, button states change |
| **Timeline approval tests** | VE-211 | Test pending changes card, approve/reject buttons, date cascade |
| **Cross-portfolio request tests** | VE-188, VE-189 | RM picks another portfolio's RM, action detail card renders |
| **Search & matchmaking tests** | VE-180, VE-195 | Manual override search returns results, reassign button works |
| **Auto-release tests** | VE-199, VE-200 | Demand completion releases resources, date changes cascade |
| **Propose alternate date tests** | VE-183 | "Propose Alternate Availability Date" form works |
| **Export to Excel tests** | VE-122 | Download triggers, file contains expected data |

### Phase 2: Infrastructure Hardening

| Enhancement | What It Does | Why |
|---|---|---|
| **CI/CD Pipeline (GitHub Actions)** | Run tests automatically on every PR and deploy | No manual "did you run tests?" — it's automatic |
| **Slack/Teams Notifications** | Post test results to a channel after each run | Team sees green/red without opening reports |
| **Test Data Factory** | API helper to create/cleanup test demands, resources, portfolios | Tests don't depend on existing data — fully self-contained |
| **Parallel Execution** | Run tests across multiple browser instances simultaneously | 3-minute suite runs in under 1 minute |
| **Retry Intelligence** | Smart retries for flaky network conditions (already 2 retries in CI) | Fewer false failures in CI |

### Phase 3: Advanced Capabilities

| Enhancement | What It Does | Why |
|---|---|---|
| **Full Role Matrix Testing** | Every test runs as RM, DO, PL, SM, DR — 5x coverage | Catches role-specific bugs like the Amruta lock issue |
| **API Response Schema Validation** | Validate exact JSON shapes with Zod/JSON Schema | Catches when backend changes response format without frontend knowing |
| **Performance Budgets** | Fail if a page takes >3s to load, API >500ms to respond | Catches performance regressions early |
| **Accessibility (a11y) Tests** | WCAG compliance checks on every page | Required for enterprise clients, catches missing labels/roles |
| **Mobile Viewport Tests** | Run all tests at 375px, 768px, 1024px widths | Catches responsive layout breakage |
| **Database Seeding** | Pre-populate test data via Django management commands | Tests start from a known state, fully reproducible |
| **Scheduled Regression** | Cron job runs full suite every 6 hours against QA | Catches issues from backend deploys nobody told you about |

### Phase 4: AI-Powered Testing

| Enhancement | What It Does | Why |
|---|---|---|
| **AI Matchmaking Validation** | Test VE-179, VE-194, VE-204 — AI suggestions are accurate | Validate Trmeric AI team's output end-to-end |
| **Intelligent Test Generation** | Claude Code generates tests from VE ticket descriptions | Paste a ticket, get a complete test file in seconds |
| **Self-Healing Selectors** | When a selector breaks, auto-detect the new one | Reduces maintenance when frontend refactors happen |
| **Anomaly Detection** | Flag unexpected changes in KPI numbers, resource counts | Catch data issues that functional tests can't |

### Phase 5: Quality Metrics Dashboard

| Enhancement | What It Does | Why |
|---|---|---|
| **Test Coverage Heatmap** | Visual map of which Trmeric features have tests | Instantly see gaps |
| **Sprint Velocity Tracking** | Graph of tests added per sprint, pass rate over time | Prove ROI of automation to stakeholders |
| **Flaky Test Detection** | Auto-quarantine tests that fail intermittently | Keep the suite trustworthy |
| **VE Ticket Traceability Matrix** | Live table: every VE ticket -> its test -> last pass/fail | Sprint review in one screenshot |

---

## 13. What Makes This Best-in-Class

When all phases are complete, the Trmeric Testing Suite will have:

```
Best-in-class Testing Suite
|
+-- Multi-Environment (dev, QA, EU, prod)       <-- Already built
+-- Multi-Role (RM, DO, PL, SM, DR)             <-- Already built
+-- BDD User Story Mapping (VE tickets)         <-- Already built
+-- Visual Regression (screenshot diff)          <-- Already built
+-- API Contract Testing                         <-- Already built
+-- Token + Browser Auth Modes                   <-- Already built
|
+-- CI/CD Integration (auto-run on PR)           <-- Phase 2
+-- Test Data Factory (self-contained)           <-- Phase 2
+-- Full Role Matrix (5x coverage)               <-- Phase 3
+-- Performance Budgets                          <-- Phase 3
+-- Accessibility Testing                        <-- Phase 3
+-- Mobile Responsive Testing                    <-- Phase 3
+-- AI-Powered Test Generation                   <-- Phase 4
+-- Quality Metrics Dashboard                    <-- Phase 5
```

---

## 14. Quick Reference for the Team

### "I just deployed to QA, how do I verify?"
```bash
npm run qa
```

### "I need to show test results in sprint review"
```bash
npm run qa:full
npm run qa:report    # Opens HTML report in browser
```

### "I got a new VE ticket, how do I add a test?"
```bash
copy tests\user-stories\_TEMPLATE.spec.ts tests\user-stories\US-VE{number}-{name}.spec.ts
# Fill in the AS A / I WANT / SO THAT + acceptance criteria
# Write one test per AC
npm run test:stories
```

### "A test is failing, how do I debug?"
```bash
npm run test:debug     # Step-through debugger
npm run test:headed    # Watch the browser
npm run test:ui        # Interactive timeline UI
```

### "How do I update visual baselines after a UI change?"
```bash
npm run test:visual:update
```

### "How do I test a different role?"
Set the role's credentials in `.env`:
```
TRMERIC_DO_EMAIL=amruta.vespa1+DO8@gmail.com
TRMERIC_DO_PASSWORD=your_password
```

---

## 15. Comparison: Where We Are vs. Industry Standard

| Capability | Trmeric (Today) | Industry Standard | Trmeric (Target) |
|---|---|---|---|
| Smoke tests | Yes | Yes | Yes |
| API contract tests | Yes | Yes | + Schema validation |
| E2E user flow tests | Yes (1 story) | Yes (all stories) | All VE tickets |
| Visual regression | Yes (5 pages) | Yes (all pages) | All critical views |
| Multi-environment | 4 envs | 2-3 envs | 4 envs |
| Multi-role | 5 roles defined | 2-3 roles | 5 roles active |
| CI/CD integration | Ready (config exists) | Required | Auto on every PR |
| Test data factory | Not yet | Required | Phase 2 |
| Performance testing | Not yet | Common | Phase 3 |
| Accessibility testing | Not yet | Required for enterprise | Phase 3 |
| Mobile testing | Not yet | Common | Phase 3 |

---

*This document was generated from the actual codebase at `D:\Tanmay-Projects\trmeric-testing` on May 17, 2026.*
*For questions or to contribute tests, contact Tanmay Sharma.*
