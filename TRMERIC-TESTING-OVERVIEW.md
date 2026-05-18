# Trmeric Platform — Automated Testing Suite

> A complete end-to-end testing framework that validates the entire Trmeric platform
> across multiple environments, user roles, and device sizes — automatically.

---

## What Is This?

Think of it as a **robot QA tester** that:
- Opens a real Chrome browser
- Logs in as different users (Resource Manager, Demand Owner, Portfolio Leader...)
- Clicks through every critical page and workflow
- Calls every backend API and checks the responses
- Takes screenshots to catch visual regressions
- Reports exactly what passed and what broke

**One command runs everything. Zero manual effort.**

---

## Why Do We Need This?

| Problem Before | Solution Now |
|---|---|
| Manual QA takes 2-3 hours per sprint | Automated suite runs in ~10 minutes |
| Bugs found after deployment to QA | Bugs caught before code merges |
| "Works on my machine" — no standard verification | Same tests run on every developer's machine and in CI |
| No way to know if a change broke something else | Regression suite catches side-effects automatically |
| Role-specific bugs (RM vs DO) missed | Multi-role tests verify each persona's experience |
| API changes break the frontend silently | API contract tests catch endpoint changes immediately |

---

## What Does It Test?

### Test Categories

```
                    TRMERIC TESTING SUITE
                           |
        _____________________|_____________________
       |          |          |          |          |
     SMOKE    PLATFORM    VISUAL    USER       A11Y
    (5 min)   (10 min)   (3 min)  STORIES    (2 min)
       |          |          |          |          |
   Backend     Auth       Screenshots  Sprint    Keyboard
   health    Navigation   comparison   tickets   navigation
   Frontend  API shapes   Pixel-diff   BDD-style Form labels
   alive     RBAC matrix  5 pages     Acceptance Image alts
```

### By the Numbers

| Category | Tests | What It Catches |
|---|---|---|
| **Smoke** | 5 | Backend down, frontend won't load |
| **Platform — Auth** | 8 | Login broken, wrong role access, session expired |
| **Platform — Navigation** | 5 | Broken routes, blank pages, missing components |
| **Platform — Actions Hub** | 3 | Actions page crash, filters broken |
| **Platform — Potential Hub** | 6 | Roster empty, KPIs missing, search broken |
| **Platform — API Contracts** | 70+ | Endpoints removed, response shapes changed, 500 errors |
| **Visual Regression** | 5 | CSS broken, layout shifted, elements missing |
| **User Stories** | 9 | RM can't access requests, matchmaking broken, mocked edge cases |
| **Accessibility** | 6 | Missing labels, keyboard traps, no alt text |
| **TOTAL** | **110+** | |

---

## How It Works

### Architecture

```
  Developer's Machine (or CI Server)
         |
    [Playwright Test Runner]
         |
    +-----------+    +------------------+
    |  Chrome   | -> | Trmeric Frontend |  (localhost or QA/EU/Prod)
    |  Browser  |    |  React SPA       |
    +-----------+    +------------------+
                            |
                     +------------------+
                     | Trmeric Backend  |  (Django REST API)
                     | API Endpoints    |
                     +------------------+
```

### Test Flow (What Happens When You Run Tests)

```
1. AUTH SETUP
   - Logs in as RM, DO, PL (or injects auth token)
   - Saves session cookies for each role
   - All subsequent tests reuse these sessions (no re-login)

2. SMOKE TESTS
   - Pings backend health endpoints
   - Verifies frontend loads (not a blank screen)
   - Takes < 30 seconds

3. PLATFORM TESTS
   - Navigates every critical route
   - Checks role-based access (RM sees X, DO doesn't)
   - Validates API response shapes
   - Tests form submissions, filters, search

4. VISUAL TESTS
   - Takes screenshots of 5 key pages
   - Compares against saved baselines
   - Flags any pixel differences (CSS regression)

5. REPORT GENERATED
   - HTML report with pass/fail per test
   - Markdown summary with failure details
   - Optional Slack/Teams notification
```

---

## Environments

We can test against any Trmeric instance:

| Environment | Frontend URL | When to Use |
|---|---|---|
| **Dev** (default) | `localhost:5173` | During development |
| **QA** | `trmeric-live.trmeric.com` | After deployment to QA |
| **EU** | `trmeric-eu.trmeric.com` | EU region validation |
| **Prod** | `app.trmeric.com` | Smoke tests only (read-only!) |

Switch with one flag: `TRMERIC_ENV=qa npm run test:smoke`

---

## User Roles Tested

Each test runs as a specific persona to verify role-based behavior:

| Role | What They Should See | What They Should NOT See |
|---|---|---|
| **Resource Manager (RM)** | Resource Requests tab unlocked, Matchmaking panel, Soft/Hard-Lock buttons | — |
| **Demand Owner (DO)** | Demand list, Request Resources button | Resource Requests tab (locked), Allocation controls |
| **Portfolio Leader (PL)** | Same as RM for their portfolios | Other portfolio's private data |
| **Solution Manager (SM)** | Solutioning phase data | Execution-phase allocation |
| **Demand Requestor (DR)** | Demand submission form | Approval controls, RM tools |

---

## How to Run

### Quick Start (for anyone)

```bash
# 1. Navigate to the test project
cd D:\Tanmay-Projects\trmeric-testing

# 2. Install (one time)
npm install

# 3. Run smoke tests (fastest — 2 minutes)
npm run dev:smoke

# 4. Run full regression (10 minutes)
npm run dev:full

# 5. Open the report
npm run dev:report
```

### Commands Cheat Sheet

| Command | What It Does | When to Use |
|---|---|---|
| `npm run dev:smoke` | Quick health check on localhost | After starting dev server |
| `npm run dev` | Smoke + Platform tests | Before pushing code |
| `npm run dev:full` | Everything on localhost | Before creating a PR |
| `npm run qa` | Smoke + Platform on QA | After QA deployment |
| `npm run qa:full` | Full regression on QA | Sprint review / sign-off |
| `npm run test:visual` | Screenshot comparison | After CSS/UI changes |
| `npm run test:visual:update` | Update screenshot baselines | After intentional UI changes |
| `npm run test:a11y` | Accessibility audit | Quarterly or after major UI work |
| `npm run test:tablet` | Platform tests on iPad viewport | Responsive design check |
| `npm run test:mobile` | Smoke tests on mobile viewport | Responsive design check |
| `npm run test:ui` | Interactive Playwright dashboard | Demos and presentations |
| `npm run dev:report` | Open HTML test report | Reviewing results |

---

## CI/CD Integration

Tests run automatically via GitHub Actions:

```
Push to develop/main     -->  Smoke tests (5 min)
Pull Request to develop  -->  Platform + API tests (10 min)
Nightly (6 AM IST)       -->  Full regression on QA (15 min)
Manual trigger            -->  Any suite on any environment
```

### Pipeline Diagram

```
  Developer pushes code
         |
    [GitHub Actions]
         |
  +------+-------+
  |              |
  Smoke        PR Gate
  (2 min)      (10 min)
  |              |
  Pass?        Pass?
  |              |
  Yes → Merge   Yes → PR approved
  No → Block    No → PR blocked
```

Results are uploaded as GitHub artifacts (downloadable HTML reports).

---

## Project Structure

```
trmeric-testing/
|
+-- playwright.config.ts          # Central config: environments, projects, viewports
+-- package.json                  # 25+ npm scripts for every scenario
+-- .env / .env.example           # Auth credentials (git-ignored)
|
+-- tests/
|   +-- auth.setup.ts             # Multi-role login (token + browser modes)
|   +-- fixtures/                 # Shared test utilities (auto-API, navigation)
|   |   +-- base.fixture.ts       # Reusable fixtures: api, waitForApp, assertNoCrash
|   +-- pages/                    # Page Object Models (encapsulate selectors)
|   |   +-- BasePage.ts           # Common: goto, assertNoCrash, waitForApi
|   |   +-- PotentialHubPage.ts   # Sidebar, KPI, roster, matchmaking, lock buttons
|   |   +-- ActionsHubPage.ts     # Actions list, filters, search
|   |   +-- DemandLivePage.ts     # Demand detail, activity, lifecycle
|   |   +-- LoginPage.ts          # Email, password, token injection
|   |   +-- MyHubPage.ts          # Dashboard
|   +-- helpers/
|   |   +-- urls.ts               # 80+ API endpoints, 18 routes, 4 environments
|   |   +-- api.ts                # TrmericAPI class: 30+ typed backend methods
|   |   +-- roles.ts              # 5 role configs with auth paths
|   |   +-- test-data.ts          # Data factory: fetch demands, resources, requests
|   |   +-- network.ts            # Mock helpers: mockApi, mockEmpty, mockError, mockSlow
|   +-- mocks/                    # Static mock data for network interception
|   +-- smoke/                    # Health checks (no auth needed)
|   +-- platform/                 # Core feature tests
|   |   +-- auth/                 # Role detection, RBAC matrix
|   |   +-- navigation/           # Route verification
|   |   +-- actions/              # Actions Hub UI
|   |   +-- resource-management/  # Potential Hub, golden paths
|   |   +-- api-contracts/        # Backend API shape validation
|   |   +-- demands/              # Demand creation golden path
|   +-- visual/                   # Screenshot comparison tests
|   +-- user-stories/             # Sprint-specific BDD tests
|   +-- a11y/                     # Accessibility audits
|   +-- reporters/                # Custom Markdown + Slack reporter
|
+-- .github/workflows/
|   +-- playwright.yml            # CI/CD: smoke on push, regression nightly
|
+-- reports/                      # Generated: HTML, JSON, Markdown per environment
```

---

## Sprint Workflow — How the Team Uses This

### For Developers

```
1. Pick up a VE ticket (e.g., VE-250)
2. Copy the test template:
     cp tests/user-stories/_TEMPLATE.spec.ts tests/user-stories/US-bulk-allocation.spec.ts
3. Fill in acceptance criteria from the ticket
4. Write tests using Page Objects (no raw CSS selectors)
5. Add data-testid attributes to new frontend components
6. Run: npx playwright test tests/user-stories/US-bulk-allocation.spec.ts
7. Tests become part of the permanent regression suite
```

### For QA

```
1. After deployment to QA:
     npm run qa:full
2. Review the HTML report:
     npm run qa:report
3. Any failure = bug found before manual testing begins
4. Visual regression catches CSS issues automatically
```

### For Sprint Review

```
1. Run the interactive dashboard:
     npm run test:ui
2. Show real Chrome browser executing tests live
3. Open the HTML report for pass/fail summary
4. Reports are saved per environment for audit trail
```

---

## Key Design Decisions

| Decision | Why |
|---|---|
| **Standalone project** (not inside frontend repo) | Tests don't add to frontend build size; independent CI pipeline |
| **Real Chrome, not headless** | Bypasses Cloudflare bot protection; visible browser for demos |
| **`domcontentloaded` not `networkidle`** | React SPA with WebSocket never reaches "networkidle" — would timeout |
| **Token injection for CI** | Skip browser login in automated runs; instant auth |
| **Page Object Models** | Selectors live in one place; changing a button label updates one file, not 20 tests |
| **Network mocking** | Test edge cases (empty data, errors, slow API) without needing specific backend state |
| **Multi-role auth files** | Each role gets its own saved session; tests switch personas without re-logging in |
| **Custom reporter** | Auto-generates markdown summary + Slack notification after each run |

---

## Reporting

After every test run, three reports are generated:

### 1. HTML Report (Interactive)
```bash
npm run dev:report   # Opens in browser
```
- Click any test to see steps, screenshots, traces
- Filter by passed/failed/skipped
- Download failure screenshots

### 2. Markdown Summary (For Slack/Teams)
Auto-generated at `reports/{env}-summary.md`:
```
# Trmeric E2E Report — QA

Status: PASSED | Date: 2026-05-18 | Duration: 142.3s

| Metric    | Count |
|-----------|-------|
| Passed    | 107   |
| Failed    | 0     |
| Skipped   | 4     |
| Pass Rate | 100%  |
```

### 3. JSON Results (For Dashboards)
Machine-readable at `reports/{env}-results.json` — plug into any dashboard tool.

---

## What's Next (Roadmap)

| Priority | Enhancement | Impact |
|---|---|---|
| P1 | Add `data-testid` attributes to all FE components | Makes tests 10x more stable |
| P1 | Wire up Slack webhook for nightly results | Team sees failures instantly |
| P2 | Add performance benchmarks (page load times) | Track speed regressions |
| P2 | Add database seed/reset for consistent test data | Tests don't depend on QA state |
| P3 | Cross-browser testing (Firefox, Safari) | Catch browser-specific bugs |
| P3 | Load testing integration (k6 or Artillery) | Validate under concurrent users |

---

## FAQ

**Q: Do I need to install anything special?**
A: Just Node.js 18+ and `npm install`. Playwright downloads Chrome automatically.

**Q: Will tests modify production data?**
A: Smoke tests are read-only. Platform tests only read existing data. The only tests that create data are explicitly marked "golden path" tests, and they use test-specific titles.

**Q: How do I add a test for my VE ticket?**
A: Copy `tests/user-stories/_TEMPLATE.spec.ts`, rename it, fill in your acceptance criteria, and write the test using Page Objects. Run with `npx playwright test tests/user-stories/YOUR-FILE.spec.ts`.

**Q: What if a test fails?**
A: Open the HTML report (`npm run dev:report`). Click the failed test. You'll see the exact step that failed, a screenshot of the browser at that moment, and a trace you can replay step-by-step.

**Q: How do I update visual baselines after a UI change?**
A: Run `npm run test:visual:update`. This captures new screenshots as the new "expected" baselines.

**Q: Can I run tests against my local branch?**
A: Yes! Start your dev server (`npm run dev` in the frontend), then run `npm run dev:smoke` or `npm run dev:full` in the testing project.

---

*Built and maintained by Trmeric Engineering. Last updated: May 2026.*
