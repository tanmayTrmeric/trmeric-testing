#!/usr/bin/env npx ts-node
/**
 * Test Generator — Creates spec files from VE ticket info.
 *
 * Usage:
 *   npx ts-node scripts/generate-test.ts --ve VE-250 --title "Bulk Allocation" --persona RM --type user-story
 *   npx ts-node scripts/generate-test.ts --ve VE-251 --title "Export PDF" --type platform
 *
 * Types:
 *   user-story  → tests/user-stories/US-{slug}.spec.ts
 *   platform    → tests/platform/{category}/{slug}.spec.ts
 *   smoke       → tests/smoke/{slug}.spec.ts
 *
 * This generates a skeleton spec file pre-filled with:
 *   - VE ticket reference
 *   - User story header (if user-story type)
 *   - data-testid selector standard reminder
 *   - Page object imports
 *   - Arrange/Act/Assert structure
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Parse CLI args ─────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : '';
}

const ve = getArg('ve') || 'VE-XXX';
const title = getArg('title') || 'Untitled Test';
const persona = getArg('persona') || 'RM';
const type = getArg('type') || 'user-story';
const category = getArg('category') || 'general';

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Determine output path ──────────────────────────────────
let outputPath: string;
switch (type) {
  case 'user-story':
    outputPath = path.join('tests', 'user-stories', `US-${slug}.spec.ts`);
    break;
  case 'platform':
    const dir = path.join('tests', 'platform', category);
    fs.mkdirSync(dir, { recursive: true });
    outputPath = path.join(dir, `${slug}.spec.ts`);
    break;
  case 'smoke':
    outputPath = path.join('tests', 'smoke', `${slug}.spec.ts`);
    break;
  default:
    outputPath = path.join('tests', 'user-stories', `US-${slug}.spec.ts`);
}

// ── Check existing ─────────────────────────────────────────
if (fs.existsSync(outputPath)) {
  console.error(`File already exists: ${outputPath}`);
  process.exit(1);
}

// ── Generate content ───────────────────────────────────────
const userStoryHeader = type === 'user-story' ? `
 * AS A ${persona},
 * I WANT [describe the action or feature],
 * SO THAT [describe the business value].
 *
 * ACCEPTANCE CRITERIA:
 * AC1: [First acceptance criterion]
 * AC2: [Second acceptance criterion]
 * AC3: [Third acceptance criterion]
 *
 * REGRESSION CHECKS:
 * RC1: [What should NOT break]
 *` : '';

const content = `import { test, expect } from '@playwright/test';
import { PotentialHubPage, ActionsHubPage, DemandLivePage } from '${type === 'platform' ? '../../' : '../'}pages';
import { TrmericAPI } from '${type === 'platform' ? '../../' : '../'}helpers/api';
import { TestDataFactory } from '${type === 'platform' ? '../../' : '../'}helpers/test-data';

/**
 * ${'='.repeat(65)}
 * ${type === 'user-story' ? 'USER STORY' : 'PLATFORM TEST'}: ${title}
 * ${'='.repeat(65)}
 *
 * Sprint: BHP Sprint [X]
 * VE Tickets: ${ve}
 *${userStoryHeader}
 * SELECTOR STANDARD: Use data-testid and getByRole/getByText.
 * NEVER use CSS class selectors ([class*="..."]).
 * ${'='.repeat(65)}
 */

test.describe('${type === 'user-story' ? 'User Story' : 'Platform'}: ${title}', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/actionhub/potential');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  });

  test('AC1: [First acceptance criterion]', async ({ page, request }) => {
    // ARRANGE
    const cookies = await page.context().cookies();
    const api = new TrmericAPI(request, cookies);
    const data = new TestDataFactory(api);

    // ACT
    // const hub = new PotentialHubPage(page);
    // await hub.navigate();

    // ASSERT
    // await hub.assertHubLoaded();
  });

  test('AC2: [Second acceptance criterion]', async ({ page }) => {
    // ARRANGE

    // ACT

    // ASSERT
  });
});
`;

// ── Write file ─────────────────────────────────────────────
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, 'utf-8');

console.log(`\nCreated: ${outputPath}`);
console.log(`VE: ${ve} | Type: ${type} | Persona: ${persona}`);
console.log(`\nNext steps:`);
console.log(`  1. Fill in acceptance criteria`);
console.log(`  2. Write test logic using Page Objects`);
console.log(`  3. Run: npx playwright test ${outputPath}`);
`;

