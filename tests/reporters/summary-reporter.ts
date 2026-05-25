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
 * Trmeric Deploy Gate Reporter
 *
 * Production-grade reporter that generates:
 *   1. DEPLOY SAFE / DEPLOY BLOCKED verdict
 *   2. Categorized failure breakdown (API, Auth, UI, Contract)
 *   3. Timing breakdown per test suite
 *   4. Markdown summary for Slack/Teams
 *   5. JSON output for CI pipeline gates
 */

interface SummaryReporterOptions {
  webhookUrl?: string;
  outputDir?: string;
}

interface TestTiming {
  name: string;
  file: string;
  duration: number;
  status: string;
}

interface FailureEntry {
  test: string;
  error: string;
  file: string;
  category: 'api-contract' | 'auth' | 'ui' | 'smoke' | 'visual' | 'other';
  severity: 'blocker' | 'warning';
}

class SummaryReporter implements Reporter {
  private options: SummaryReporterOptions;
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private flaky = 0;
  private failures: FailureEntry[] = [];
  private timings: TestTiming[] = [];
  private startTime = 0;
  private env = '';

  constructor(options: SummaryReporterOptions = {}) {
    this.options = options;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.env = process.env.TRMERIC_ENV || 'dev';
    const totalTests = suite.allTests().length;
    console.log(`\n  Trmeric E2E -- ${this.env.toUpperCase()} -- ${totalTests} tests\n`);
  }

  private categorizeTest(filePath: string): FailureEntry['category'] {
    const f = filePath.toLowerCase();
    if (f.includes('api-contract')) return 'api-contract';
    if (f.includes('auth') || f.includes('role')) return 'auth';
    if (f.includes('smoke')) return 'smoke';
    if (f.includes('visual') || f.includes('screenshot')) return 'visual';
    return 'ui';
  }

  private severityOf(category: FailureEntry['category']): FailureEntry['severity'] {
    // Smoke and auth failures block deployment; others are warnings
    if (category === 'smoke' || category === 'auth') return 'blocker';
    return 'warning';
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const filePath = test.location.file.replace(/.*tests[\\/]/, 'tests/');
    const duration = result.duration;

    this.timings.push({
      name: test.title,
      file: filePath,
      duration,
      status: result.status,
    });

    switch (result.status) {
      case 'passed':
        this.passed++;
        break;
      case 'failed':
      case 'timedOut': {
        this.failed++;
        const category = this.categorizeTest(filePath);
        this.failures.push({
          test: test.title,
          error: result.errors?.[0]?.message?.slice(0, 300) || 'Unknown error',
          file: filePath,
          category,
          severity: this.severityOf(category),
        });
        break;
      }
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
    const executed = total - this.skipped;
    const passRate = executed > 0 ? ((this.passed / executed) * 100).toFixed(1) : '0';

    const blockers = this.failures.filter((f) => f.severity === 'blocker');
    const warnings = this.failures.filter((f) => f.severity === 'warning');

    // Deploy verdict: block on any blocker or if pass rate < 95%
    const passRateNum = parseFloat(passRate);
    const isDeployable = blockers.length === 0 && passRateNum >= 95;
    const verdict = isDeployable ? 'DEPLOY SAFE' : 'DEPLOY BLOCKED';
    const verdictEmoji = isDeployable ? 'GREEN' : 'RED';

    // ── Timing breakdown by suite ────────────────────────
    const suiteTimings: Record<string, { count: number; duration: number; passed: number; failed: number }> = {};
    for (const t of this.timings) {
      const suite = t.file.replace(/.*tests[\\/]/, '').replace(/[\\/][^\\/]+$/, '') || 'root';
      if (!suiteTimings[suite]) suiteTimings[suite] = { count: 0, duration: 0, passed: 0, failed: 0 };
      suiteTimings[suite].count++;
      suiteTimings[suite].duration += t.duration;
      if (t.status === 'passed') suiteTimings[suite].passed++;
      if (t.status === 'failed' || t.status === 'timedOut') suiteTimings[suite].failed++;
    }

    // ── Slowest tests ────────────────────────────────────
    const slowest = [...this.timings]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    // ── Build Markdown Summary ───────────────────────────
    const lines: string[] = [
      `# Trmeric E2E Report -- ${this.env.toUpperCase()}`,
      '',
      `**Verdict: ${verdict}** | **Date:** ${new Date().toISOString().slice(0, 16)} | **Duration:** ${duration}s`,
      '',
      '## Results',
      '',
      '| Metric | Count |',
      '|--------|-------|',
      `| Passed | ${this.passed} |`,
      `| Failed | ${this.failed} |`,
      `| Skipped | ${this.skipped} |`,
      `| Flaky | ${this.flaky} |`,
      `| **Total** | **${total}** |`,
      `| **Pass Rate** | **${passRate}%** |`,
      '',
    ];

    // Suite breakdown
    lines.push('## Suite Breakdown', '');
    lines.push('| Suite | Tests | Passed | Failed | Duration |');
    lines.push('|-------|-------|--------|--------|----------|');
    for (const [suite, data] of Object.entries(suiteTimings).sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`| ${suite} | ${data.count} | ${data.passed} | ${data.failed} | ${(data.duration / 1000).toFixed(1)}s |`);
    }
    lines.push('');

    // Blockers
    if (blockers.length > 0) {
      lines.push('## BLOCKERS (must fix before deploy)', '');
      for (const f of blockers) {
        lines.push(`### [${f.category.toUpperCase()}] ${f.test}`);
        lines.push(`- **File:** \`${f.file}\``);
        lines.push(`- **Error:** ${f.error.split('\n')[0]}`);
        lines.push('');
      }
    }

    // Warnings
    if (warnings.length > 0) {
      lines.push('## WARNINGS (investigate, may not block deploy)', '');
      for (const f of warnings) {
        lines.push(`### [${f.category.toUpperCase()}] ${f.test}`);
        lines.push(`- **File:** \`${f.file}\``);
        lines.push(`- **Error:** ${f.error.split('\n')[0]}`);
        lines.push('');
      }
    }

    // Slowest tests
    if (slowest.length > 0) {
      lines.push('## Slowest Tests', '');
      lines.push('| Test | Duration | File |');
      lines.push('|------|----------|------|');
      for (const t of slowest) {
        lines.push(`| ${t.name.slice(0, 60)} | ${(t.duration / 1000).toFixed(1)}s | ${t.file} |`);
      }
      lines.push('');
    }

    lines.push('## How to Investigate', '');
    lines.push('```bash');
    lines.push('# Open the full HTML report:');
    lines.push(`npx playwright show-report reports/${this.env}`);
    lines.push('');
    lines.push('# Re-run just the failed tests:');
    lines.push('npx playwright test --last-failed');
    lines.push('```');
    lines.push('');

    const markdown = lines.join('\n');

    // ── Write markdown ──────────────────────────────────
    const outputDir = this.options.outputDir || 'reports';
    fs.mkdirSync(outputDir, { recursive: true });
    const mdPath = path.join(outputDir, `${this.env}-summary.md`);
    fs.writeFileSync(mdPath, markdown, 'utf-8');

    // ── Write JSON (for CI gates) ───────────────────────
    const jsonReport = {
      verdict,
      deployable: isDeployable,
      env: this.env,
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      results: { total, passed: this.passed, failed: this.failed, skipped: this.skipped, flaky: this.flaky, passRate: passRateNum },
      blockers: blockers.map((f) => ({ test: f.test, category: f.category, file: f.file })),
      warnings: warnings.map((f) => ({ test: f.test, category: f.category, file: f.file })),
      suites: suiteTimings,
    };
    const jsonPath = path.join(outputDir, `${this.env}-deploy-verdict.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');

    // ── Post to webhook ─────────────────────────────────
    if (this.options.webhookUrl) {
      await this.postToWebhook(verdict, passRate);
    }

    // ── Console output ──────────────────────────────────
    console.log(`\n  Summary: ${mdPath}`);
    console.log(`  Verdict: ${jsonPath}`);

    if (blockers.length > 0) {
      console.log(`\n  BLOCKERS (${blockers.length}):`);
      for (const b of blockers) {
        console.log(`    [${b.category}] ${b.test}`);
      }
    }
    if (warnings.length > 0) {
      console.log(`\n  WARNINGS (${warnings.length}):`);
      for (const w of warnings) {
        console.log(`    [${w.category}] ${w.test}`);
      }
    }

    console.log(`\n  ${verdictEmoji}: ${verdict} -- ${this.passed}/${total} passed (${passRate}%) in ${duration}s\n`);
  }

  private async postToWebhook(verdict: string, passRate: string) {
    if (!this.options.webhookUrl) return;

    try {
      const payload = {
        text: `Trmeric E2E -- ${this.env.toUpperCase()}: ${verdict} (${passRate}% pass rate)`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `*Trmeric Pre-Deploy Report -- ${this.env.toUpperCase()}*`,
                `*Verdict:* ${verdict}`,
                `Passed: ${this.passed} | Failed: ${this.failed} | Skipped: ${this.skipped}`,
                this.failures.length > 0
                  ? `\n*Failures:* ${this.failures.map((f) => `[${f.severity}] ${f.test}`).join(', ')}`
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
