import { test, expect } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════
 * USER STORY: [Title from Jira/VE ticket]
 * ═══════════════════════════════════════════════════════════════
 *
 * Sprint: [Sprint Name]
 * VE Tickets: [VE-XXX, VE-YYY]
 *
 * AS A [persona],
 * I WANT [action/feature],
 * SO THAT [business value].
 *
 * ACCEPTANCE CRITERIA:
 * AC1: [First acceptance criterion]
 * AC2: [Second acceptance criterion]
 * AC3: [Third acceptance criterion]
 *
 * REGRESSION CHECKS:
 * RC1: [What should NOT break]
 *
 * ═══════════════════════════════════════════════════════════════
 * SELECTOR STANDARD (MANDATORY):
 * ═══════════════════════════════════════════════════════════════
 *
 * ALWAYS use data-testid selectors. NEVER use fragile CSS classes.
 *
 * ✅ CORRECT:
 *   page.getByTestId('resource-requests-tab')
 *   page.getByTestId('matchmaking-panel')
 *   page.getByTestId('kpi-strip')
 *   page.getByRole('button', { name: 'Soft-Lock' })
 *   page.getByText('Resource Requests')  ← OK for visible text
 *
 * ❌ WRONG (will break on CSS changes):
 *   page.locator('.MuiButton-root')
 *   page.locator('[class*="matchPanel"]')
 *   page.locator('div > span:nth-child(2)')
 *   page.locator('.css-1a2b3c')
 *
 * When writing frontend components, ADD data-testid:
 *   <Box data-testid="resource-requests-tab">...</Box>
 *   <Button data-testid="soft-lock-btn">Soft-Lock</Button>
 *   <Table data-testid="roster-table">...</Table>
 *
 * Naming convention: kebab-case, descriptive
 *   {component}-{element}  e.g., matchmaking-panel, kpi-utilization
 * ═══════════════════════════════════════════════════════════════
 */

test.describe('User Story: [Title]', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/actionhub/...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  });

  test('AC1: [First acceptance criterion description]', async ({ page }) => {
    // ARRANGE: Set up the test state

    // ACT: Perform the user action
    // Use data-testid selectors:
    //   await page.getByTestId('resource-requests-tab').click();
    //   await page.getByRole('button', { name: 'Submit' }).click();

    // ASSERT: Verify the expected outcome
    //   await expect(page.getByTestId('success-message')).toBeVisible();
  });

  test('AC2: [Second acceptance criterion description]', async ({ page }) => {
    // ARRANGE

    // ACT

    // ASSERT
  });
});
