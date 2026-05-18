import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Trmeric Summary Reporter
 *
 * Generates a clean markdown summary after each test run.
 * Optionally posts to a webhook (Slack, Teams, etc.)
 *
 * Output: reports/{env}-summary.md
 *
 * Configuration in playwright.config.ts:
 *   reporter: [
 *     ['./tests/reporters/summary-reporter.ts', { webhookUrl: process.env.SLACK_WEBHOOK }],
 *   ]
 */

interface SummaryReporterOptions {
  webhookUrl?: string;
  outputDir?: string;
}

class SummaryReporter implements Reporter {
  private options: SummaryReporterOptions;
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private flaky = 0;
  private failures: { test: string; error: string; file: string }[] = [];
  private startTime = 0;
  private env = '';

  constructor(options: SummaryReporterOptions = {}) {
    this.options = options;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.env = process.env.TRMERIC_ENV || 'dev';
    const totalTests = suite.allTests().length;
    console.log(`\n  Trmeric E2E — ${this.env.toUpperCase()} — ${totalTests} tests\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    switch (result.status) {
      case 'passed':
        this.passed++;
        break;
      case 'failed':
      case 'timedOut':
        this.failed++;
        this.failures.push({
          test: test.title,
          error: result.errors?.[0]?.message?.slice(0, 200) || 'Unknown error',
          file: test.location.file.replace(/.*tests\//, 'tests/'),
        });
        break;
      case 'skipped':
        this.skipped++;
        break;
    }
    if (result.status === 'passed' && result.retry > 0) {
      this.flaky++;
    }
  }

  async onEnd(result: FullResult) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const total = this.passed + this.failed + this.skipped;
    const passRate = total > 0 ? ((this.passed / (total - this.skipped)) * 100).toFixed(1) : '0';

    const status = this.failed === 0 ? 'PASSED' : 'FAILED';
    const emoji = this.failed === 0 ? 'GREEN' : 'RED';

    // ── Build Markdown Summary ─────────────────────────
    const lines: string[] = [
      `# Trmeric E2E Report — ${this.env.toUpperCase()}`,
      '',
      `**Status:** ${status} | **Date:** ${new Date().toISOString().slice(0, 16)} | **Duration:** ${duration}s`,
      '',
      '## Results',
      '',
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Passed | ${this.passed} |`,
      `| Failed | ${this.failed} |`,
      `| Skipped | ${this.skipped} |`,
      `| Flaky | ${this.flaky} |`,
      `| **Total** | **${total}** |`,
      `| **Pass Rate** | **${passRate}%** |`,
      '',
    ];

    if (this.failures.length > 0) {
      lines.push('## Failures', '');
      for (const f of this.failures) {
        lines.push(`### ${f.test}`);
        lines.push(`- **File:** \`${f.file}\``);
        lines.push(`- **Error:** ${f.error}`);
        lines.push('');
      }
    }

    lines.push('## How to Investigate', '');
    lines.push('```bash');
    lines.push('# Open the full HTML report:');
    lines.push(`npx playwright show-report reports/${this.env}`);
    lines.push('');
    lines.push('# Re-run just the failed tests:');
    lines.push(`npx playwright test --last-failed`);
    lines.push('```');
    lines.push('');

    const markdown = lines.join('\n');

    // ── Write to file ──────────────────────────────────
    const outputDir = this.options.outputDir || 'reports';
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${this.env}-summary.md`);
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`\n  Summary written to: ${outputPath}`);

    // ── Post to webhook (Slack/Teams) ──────────────────
    if (this.options.webhookUrl) {
      await this.postToWebhook(markdown);
    }

    // ── Console summary ────────────────────────────────
    console.log(`\n  ${emoji}: ${this.passed}/${total} passed (${passRate}%) in ${duration}s\n`);
  }

  private async postToWebhook(markdown: string) {
    if (!this.options.webhookUrl) return;

    try {
      // Slack-compatible payload
      const payload = {
        text: `Trmeric E2E — ${this.env.toUpperCase()}: ${this.failed === 0 ? 'ALL PASSED' : `${this.failed} FAILED`}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `*Trmeric E2E Report — ${this.env.toUpperCase()}*`,
                `Passed: ${this.passed} | Failed: ${this.failed} | Skipped: ${this.skipped}`,
                this.failures.length > 0
                  ? `\nFailed: ${this.failures.map((f) => f.test).join(', ')}`
                  : '',
              ].join('\n'),
            },
          },
        ],
      };

      await fetch(this.options.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('  Webhook notification sent');
    } catch (err) {
      console.warn('  Webhook failed:', err);
    }
  }
}

export default SummaryReporter;
