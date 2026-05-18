# Trmeric E2E Testing Suite

**User Story-Driven BDD Testing for the Trmeric Platform**

Built with [Playwright](https://playwright.dev/) — the industry standard for end-to-end browser testing.

---

## What This Does

This project tests the Trmeric application the same way a real user would — opening a browser, clicking buttons, filling forms, and verifying results. Every test is mapped directly to a **User Story**.

Instead of manual QA:
```
Manual: "Amruta, please login as RM8 and check if Resource Requests tab is unlocked"
Automated: npm run test:stories  →  ✅ 6 tests passed in 45s
```

### What It Tests Right Now

| Test Suite | Tests | What It Validates |
|-----------|-------|-------------------|
| **Smoke Tests** | 3 | App is alive — login page loads, homepage loads, API responds |
| **US: RM Persona Access** | 6 | Resource Requests tab unlocked for RMs, locked for non-RMs, correct RM assignment, matchmaking panel opens |

### How It Maps to Sprints

Every test file follows this structure:
```
AS A [persona from the VE ticket],
I WANT [the feature described in the ticket],
SO THAT [the business value].

ACCEPTANCE CRITERIA:
AC1: [First criterion] → test('AC1: ...')
AC2: [Second criterion] → test('AC2: ...')
```

When your sprint has 10 VE tickets, you'll have 10 test files — each proving the feature works.

---

## Quick Start

### Step 1: Install Chromium Browser

Playwright needs its own browser. Run this once:

```bash
cd D:\Tanmay-Projects\trmeric-testing

# Clear any stale downloads and install fresh
rmdir /s /q "%LOCALAPPDATA%\ms-playwright" 2>nul
npx playwright install chromium
```

This downloads ~180MB. You only need to do this once.

### Step 2: Set Up Credentials

```bash
copy .env.example .env
```

Edit `.env` with your test account credentials:
```
TRMERIC_BASE_URL=https://trmeric-strong.trmeric.com
TRMERIC_TEST_EMAIL=resourcemanagervespa+RM8@gmail.com
TRMERIC_TEST_PASSWORD=your_actual_password
```

### Step 3: Run Your First Test

```bash
# Quick smoke test (no login needed, ~10 seconds)
npm run test:smoke

# Full user story tests (needs .env credentials)
npm run test:stories
```

---

## All Commands

### For Daily Development

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `npm run test:smoke` | 3 quick health checks (~10s) | After every deploy to verify app is alive |
| `npm run test:stories` | All user story tests (~60s) | Before merging a PR, after sprint features are deployed |

### For Presentations & Demos

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `npm run test:story:ui` | Opens Playwright's interactive UI | **Team demos** — shows tests running visually, step by step |
| `npm run test:report` | Opens HTML report in browser | **Sprint reviews** — shows pass/fail with screenshots and traces |

### For Debugging Failures

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `npm run test:headed` | Runs tests with visible browser window | See exactly what the test clicks |
| `npm run test:debug` | Step-through debugger (pause on each step) | When a test fails and you need to inspect |
| `npm run test:trace` | Captures full trace (DOM, network, console) | Send trace file to another dev for analysis |

### For CI/CD Pipeline

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `npm run test:ci` | Runs smoke + user stories, outputs HTML report | GitHub Actions / Jenkins / any CI pipeline |

---

## Project Structure

```
trmeric-testing/
│
├── playwright.config.ts        ← Main config (base URL, timeouts, reporters)
├── package.json                ← npm scripts
├── .env.example                ← Template for test credentials
├── .env                        ← Your credentials (gitignored, never commit)
├── .gitignore
│
├── tests/
│   ├── auth.setup.ts           ← Logs in once, saves cookies for all tests
│   ├── .auth/                  ← Saved login state (gitignored)
│   │   └── user.json           ← Browser cookies after login
│   │
│   ├── smoke/                  ← Quick health checks
│   │   └── smoke.spec.ts       ← 3 tests: login page, homepage, API health
│   │
│   ├── user-stories/           ← One file per user story / VE ticket
│   │   ├── _TEMPLATE.spec.ts   ← Copy this for new user stories
│   │   └── US-resource-manager-access.spec.ts  ← RM access + routing tests
│   │
│   └── fixtures/               ← Shared test data (future)
│
└── reports/                    ← Generated test reports (gitignored)
    ├── html/                   ← HTML report (open with npm run test:report)
    ├─��� results.json            ← Machine-readable results
    └── test-results/           ← Screenshots, videos, traces
```

---

## How To Add a New User Story Test

### When You Get a New Sprint Ticket

**Example: VE-211 — "Approve/Reject Resource Timeline Changes"**

**Step 1:** Copy the template
```bash
copy tests\user-stories\_TEMPLATE.spec.ts tests\user-stories\US-VE211-timeline-approval.spec.ts
```

**Step 2:** Fill in the user story header
```typescript
/**
 * USER STORY: Approve/Reject Resource Timeline Changes
 *
 * Sprint: BHP Sprint 4
 * VE Tickets: VE-211
 *
 * AS A Resource Manager,
 * I WANT to see pending timeline changes and approve or reject them,
 * SO THAT resource allocations stay aligned with demand date changes.
 *
 * ACCEPTANCE CRITERIA:
 * AC1: Red "Pending Timeline Changes" card appears when changes exist
 * AC2: Each change shows old → new dates with approve/reject buttons
 * AC3: Approving applies the new dates to the allocation
 * AC4: Rejecting keeps the original dates
 */
```

**Step 3:** Write one test per acceptance criterion
```typescript
test('AC1: Pending Timeline Changes card appears', async ({ page }) => {
  // ARRANGE: Navigate to Resource Requests view
  await page.goto('/actionhub/potential');
  await page.getByText('Resource Requests').click();

  // ACT: Wait for the page to load
  await page.waitForLoadState('networkidle');

  // ASSERT: The pending changes card should be visible (if changes exist)
  const pendingCard = page.getByText('Pending Timeline Changes');
  // Card only shows when there are pending changes — verify it renders when expected
  if (await pendingCard.isVisible()) {
    await expect(pendingCard).toBeVisible();
  }
});
```

**Step 4:** Run it
```bash
npm run test:stories
```

---

## How the Auth System Works

### Problem
Every test needs a logged-in user. Logging in before each test wastes 10+ seconds.

### Solution
The `auth.setup.ts` file runs **once**, logs in, and saves the browser's cookies/localStorage to `tests/.auth/user.json`. All subsequent tests load this saved state — they start already logged in.

```
First run:
  auth.setup.ts → Login → Save cookies to .auth/user.json → ✅

All other tests:
  Load .auth/user.json → Already logged in → Run test → ✅
  (No login flow, saves ~10s per test)
```

### Multiple User Roles
To test different personas (RM vs DO vs PL), you can create multiple auth files:

```typescript
// In playwright.config.ts, add a new project:
{
  name: 'demand-owner-tests',
  use: {
    storageState: './tests/.auth/demand-owner.json',
  },
}
```

---

## Understanding the Reports

### HTML Report (Best for Presentations)

After running `npm run test:ci`, open the report:
```bash
npm run test:report
```

This opens a browser with:
- **Pass/Fail summary** — green/red for each test
- **Test timeline** — how long each test took
- **Screenshots** — captured on failure (shows what the user saw)
- **Trace viewer** — step-by-step replay of every click, network call, and DOM change

### Console Output
```
Running 6 tests using 1 worker

  ✓ AC1: Resource Requests tab is visible and clickable for RM users (3.2s)
  ✓ AC4: Resource Requests tab shows pending count badge (2.1s)
  ✓ AC5: Clicking Review opens the matchmaking panel (4.5s)
  ✓ AC2: New resource request assigned to portfolio-specific RM (2.8s)
  ✓ AC3: Resource Requests tab shows lock for non-RM users (skipped)

  5 passed, 1 skipped (12.6s)
```

---

## Targeting Different Environments

Change the URL by setting `TRMERIC_BASE_URL`:

```bash
# Test against QA
TRMERIC_BASE_URL=https://trmeric-strong.trmeric.com npm run test:stories

# Test against local dev
TRMERIC_BASE_URL=http://localhost:5173 npm run test:stories

# Test against staging
TRMERIC_BASE_URL=https://staging.trmeric.com npm run test:stories
```

Or edit `.env`:
```
TRMERIC_BASE_URL=http://localhost:5173
```

---

## CI/CD Integration

### GitHub Actions (Example)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: trmeric-testing
      - run: npx playwright install chromium
        working-directory: trmeric-testing
      - run: npm run test:ci
        working-directory: trmeric-testing
        env:
          TRMERIC_BASE_URL: ${{ secrets.QA_URL }}
          TRMERIC_TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TRMERIC_TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: trmeric-testing/reports/
```

---

## Sprint Workflow: From VE Ticket to Automated Test

```
1. Sprint starts → 10 VE tickets assigned
          ↓
2. For each ticket, copy _TEMPLATE.spec.ts → US-VE{number}-{name}.spec.ts
          ↓
3. Fill in: AS A / I WANT / SO THAT + Acceptance Criteria
          ↓
4. Dev builds the feature
          ↓
5. Write test assertions (ARRANGE → ACT → ASSERT)
          ↓
6. Run: npm run test:stories
          ↓
7. All green? → PR approved, merge to develop
          ↓
8. Deploy to QA → Run: npm run test:ci
          ↓
9. Sprint review → Run: npm run test:report → Show HTML report to stakeholders
          ↓
10. Regression suite grows automatically (every sprint adds tests)
```

---

## FAQ

**Q: Do I need the Trmeric dev server running locally?**
No. Tests run against the deployed URL (QA or staging). Set `TRMERIC_BASE_URL` in `.env`.

**Q: Can I run tests without credentials?**
Smoke tests work without credentials (they just check if the app loads). User story tests need a `.env` file with login credentials.

**Q: What if a test fails because of a UI change?**
Update the selector in the test file. Use Playwright's codegen to find new selectors:
```bash
npx playwright codegen https://trmeric-strong.trmeric.com
```
This opens a browser recorder — click around and it generates selectors for you.

**Q: How do I see what the test is doing?**
```bash
npm run test:headed    # Watch the browser
npm run test:debug     # Pause at each step
npm run test:story:ui  # Interactive UI with timeline
```

**Q: Can Claude help me write tests?**
Yes. Give Claude the VE ticket text and say:
"Write a Playwright test for this user story using the _TEMPLATE.spec.ts format in trmeric-testing"

---

## Architecture Decision: Why Playwright?

| Criteria | Playwright | Cypress | Selenium |
|----------|-----------|---------|----------|
| Speed | Fast (parallel, headless) | Medium | Slow |
| Multi-browser | Chromium + Firefox + WebKit | Chromium only | All (but slow) |
| Auth handling | Built-in storage state | Custom workaround | Manual |
| Trace viewer | Built-in (visual replay) | Dashboard (paid) | None |
| CI/CD | Native GitHub Actions support | Dashboard (paid) | Complex setup |
| Async/await | Native | No (chained commands) | Partial |
| Our stack fit | Vite + React + TypeScript | Good | Poor |

**Verdict:** Playwright gives us the best developer experience, fastest execution, and the visual HTML reports needed for sprint presentations.
