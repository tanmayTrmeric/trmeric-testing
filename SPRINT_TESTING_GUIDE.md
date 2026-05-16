# Sprint Testing Guide — From Excel to Automated Tests

---

## MANDATORY: data-testid Standard

**Every new frontend component MUST have `data-testid` attributes.**

### For Frontend Developers:
```jsx
// ✅ DO THIS — every testable element gets a data-testid
<Box data-testid="resource-requests-tab">Resource Requests</Box>
<Button data-testid="soft-lock-btn">Soft-Lock</Button>
<Table data-testid="roster-table">...</Table>
<Box data-testid="kpi-utilization">35%</Box>
<Box data-testid="matchmaking-panel">...</Box>

// ❌ NEVER rely on CSS classes for testing
<Box className="MuiBox-root css-1a2b3c">  ← untestable
```

### For Test Writers:
```typescript
// ✅ CORRECT selectors (stable, survive CSS changes)
page.getByTestId('resource-requests-tab')
page.getByTestId('matchmaking-panel')
page.getByRole('button', { name: 'Soft-Lock' })
page.getByText('Resource Requests')

// ❌ WRONG selectors (break on any CSS refactor)
page.locator('.MuiButton-root')
page.locator('[class*="matchPanel"]')
page.locator('div > span:nth-child(2)')
```

### Naming Convention:
`{component}-{element}` in kebab-case:
- `potential-hub-sidebar`
- `resource-requests-tab`
- `matchmaking-panel`
- `kpi-utilization`
- `roster-table`
- `soft-lock-btn`
- `cross-portfolio-selector`

### Priority data-testid List (add to existing components):
| Component | data-testid |
|-----------|------------|
| Potential sidebar nav items | `nav-resource-centric`, `nav-resource-requests`, `nav-retrospective` |
| KPI Bento Strip | `kpi-strip`, `kpi-utilization`, `kpi-conflicts`, `kpi-unfilled` |
| Roster Table | `roster-table`, `roster-row-{id}` |
| Matchmaking Panel | `matchmaking-panel`, `candidate-card-{id}`, `soft-lock-btn`, `hard-lock-btn` |
| Actions Hub | `actions-list`, `action-card-{id}`, `action-filter-tabs` |
| Add Resource Panel | `add-resource-panel`, `add-resource-form` |

---

## The Workflow

```
Sprint Excel / Design Doc (from Roshan/Amruta)
        ↓
   Give it to Claude
        ↓
   Claude generates test cases (.spec.ts files)
        ↓
   You review + run them
        ↓
   Fix any selectors that don't match your UI
        ↓
   Tests become permanent regression suite
```

## Step-by-Step

### Step 1: Give Claude Your Sprint Data

Paste the sprint excel data or design doc into Claude and say:

```
Here is our Sprint 5 VE ticket list:

VE-220: As a DO, I want to see demand status transitions
VE-221: As an RM, I want to approve timeline changes
VE-222: As a PL, I want to export resources to Excel

Generate Playwright test files for each VE ticket using the
_TEMPLATE.spec.ts format in D:\Tanmay-Projects\trmeric-testing.
Each test should have BDD-style user story header and one test()
per acceptance criterion.
```

### Step 2: Claude Generates Test Files

Claude will create files like:
- `US-VE220-demand-status-transitions.spec.ts`
- `US-VE221-timeline-approval.spec.ts`
- `US-VE222-export-resources.spec.ts`

Each file follows this structure:
```typescript
/**
 * AS A Demand Owner,
 * I WANT to see demand status transitions,
 * SO THAT I know where my demand is in the lifecycle.
 *
 * ACCEPTANCE CRITERIA:
 * AC1: Status bar shows all stages (Draft → Submitted → ... → Execution)
 * AC2: Current stage is highlighted
 * AC3: Clicking a completed stage shows its completion date
 */

test('AC1: Status bar shows all lifecycle stages', async ({ page }) => {
  // ARRANGE → ACT → ASSERT
});
```

### Step 3: Run and Validate

```powershell
# Run only the new sprint tests
npx playwright test --project=user-stories

# Run a specific VE ticket test
npx playwright test US-VE220

# Run with visible browser to validate visually
npx playwright test US-VE220 --headed
```

### Step 4: Fix Selectors

If a test fails because it can't find a UI element, use Playwright's codegen:

```powershell
npx playwright codegen http://localhost:5173
```

This opens a browser recorder — click around your app and it generates the correct selectors.

### Step 5: Commit Tests

Once all sprint tests pass, they're part of the regression suite forever.
Every future deploy runs them automatically.

---

## Example: Converting a VE Ticket to a Test

### VE Ticket (from Excel):
```
VE-211: Approve/Reject Resource Timeline Changes
Priority: High
Persona: Resource Manager
Description: When demand dates change, RM sees pending timeline
changes and can approve or reject them.
AC1: Red "Pending Timeline Changes" card appears at top
AC2: Shows old dates → new dates with approve/reject buttons
AC3: Approve applies new dates to allocation
AC4: Reject keeps original dates
```

### What You Tell Claude:
```
Generate a Playwright test for VE-211. Here are the details:
[paste the VE ticket above]

The relevant page is /actionhub/potential with the Resource Requests view.
The PendingChangesCard component renders at the top when changes exist.
```

### What Claude Creates:
```typescript
test.describe('VE-211: Approve/Reject Timeline Changes', () => {
  test('AC1: Pending changes card appears', async ({ page }) => {
    await page.goto('/actionhub/potential?view=demand');
    const card = page.getByText('Pending Timeline Changes');
    // If there are pending changes, the card should be visible
  });

  test('AC2: Shows old → new dates with buttons', async ({ page }) => {
    // Look for approve (green check) and reject (red X) buttons
  });
});
```

---

## Validating Test Quality

After Claude generates tests, check:

1. **Does each test map to an AC?** — One test() per acceptance criterion
2. **Are selectors stable?** — Uses text content, roles, or data-testid (not CSS classes)
3. **Does it test behavior, not implementation?** — Tests what the user sees, not internal state
4. **Does it handle "no data" gracefully?** — Skips if no test data exists

## Command Cheat Sheet

```powershell
# Generate tests (tell Claude)
"Generate Playwright tests for these VE tickets: [paste excel]"

# Run all sprint tests
npx playwright test --project=user-stories

# Run specific ticket
npx playwright test US-VE211

# Visual debugging
npx playwright test US-VE211 --headed --debug

# Open report
npx playwright show-report reports/dev

# Record new selectors
npx playwright codegen http://localhost:5173
```
