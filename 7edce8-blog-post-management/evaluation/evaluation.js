// evaluation/evaluation.js

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import { randomUUID } from 'crypto';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'evaluation', 'reports');

function environmentInfo() {
  return {
    node_version: process.version,
    platform: os.platform() + '-' + os.arch(),
  };
}

function parseTestOutput(output) {
  // Try to parse Vitest output summary
  const lines = output.split('\n');
  let total = 0, passed = 0, failed = 0, errors = 0, skipped = 0;
  const tests = [];

  // Parse summary line: "Tests  11 passed (11)"
  for (const line of lines) {
    const vitestSummary = line.match(/Tests\s+(\d+)\s+passed.*\((\d+)\)/);
    if (vitestSummary) {
      total = parseInt(vitestSummary[2], 10);
      passed = parseInt(vitestSummary[1], 10);
      break;
    }
  }

  // Parse per-file test results: "✓ tests/tests_after.test.jsx  (11 tests) 3011ms"
  for (const line of lines) {
    const fileMatch = line.match(/[✓✗] ([^ ]+)\s+\((\d+) tests?\)/);
    if (fileMatch) {
      const [, file, count] = fileMatch;
      // Add a pseudo-test entry for the file (since Vitest output doesn't list individual test names by default)
      tests.push({
        nodeid: file,
        name: file,
        outcome: line.trim().startsWith('✓') ? 'passed' : 'failed',
        test_count: parseInt(count, 10),
      });
    }
  }

  // If no per-file lines, but we have a total, add a single summary test
  if (tests.length === 0 && total > 0) {
    tests.push({
      nodeid: 'all',
      name: 'all tests',
      outcome: passed === total ? 'passed' : 'failed',
      test_count: total,
    });
  }

  // Try to parse failed/skipped if present
  for (const line of lines) {
    const failMatch = line.match(/Tests\s+\d+ passed.*(\d+) failed/);
    if (failMatch) {
      failed = parseInt(failMatch[1], 10);
    }
    const skipMatch = line.match(/Tests\s+\d+ passed.*(\d+) skipped/);
    if (skipMatch) {
      skipped = parseInt(skipMatch[1], 10);
    }
  }

  return {
    tests,
    summary: {
      total,
      passed,
      failed,
      errors,
      skipped,
    },
  };
}

function runTests(target) {
  if (target === 'before') {
    // Simulate no tests for before, as in your current logic
    return {
      success: false,
      exit_code: 0,
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, errors: 0, skipped: 0 },
      stdout: 'No tests to run for repository_before',
      stderr: '',
    };
  }
  try {
    const output = execSync('npm run test:after', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000,
    });
    const parsed = parseTestOutput(output);
    return {
      success: parsed.summary.failed === 0,
      exit_code: 0,
      tests: parsed.tests,
      summary: parsed.summary,
      stdout: output.slice(0, 8000),
      stderr: '',
    };
  } catch (err) {
    const output = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    const parsed = parseTestOutput(output);
    return {
      success: false,
      exit_code: err.status || 1,
      tests: parsed.tests,
      summary: parsed.summary,
      stdout: output.slice(0, 8000),
      stderr: err.stderr ? err.stderr.toString() : '',
    };
  }
}

function runMetrics(repoPath) {
  // Optional: implement if needed
  return {};
}

function evaluate(repoName) {
  const tests = runTests(repoName === 'repository_before' ? 'before' : 'after');
  const metrics = runMetrics(path.join(ROOT, repoName));
  return { ...tests, metrics };
}

function run_evaluation() {
  const run_id = randomUUID();
  const start = new Date();
  const before = evaluate('repository_before');
  const after = evaluate('repository_after');
  const comparison = {
    before_tests_passed: before.success,
    after_tests_passed: after.success,
    before_total: before.summary.total,
    before_passed: before.summary.passed,
    before_failed: before.summary.failed,
    after_total: after.summary.total,
    after_passed: after.summary.passed,
    after_failed: after.summary.failed,
  };
  const end = new Date();
  return {
    run_id,
    started_at: start.toISOString(),
    finished_at: end.toISOString(),
    duration_seconds: (end - start) / 1000,
    success: after.success,
    error: null,
    environment: environmentInfo(),
    results: {
      before: before,
      after: after,
      comparison: comparison,
    },
  };
}

export { run_evaluation };

function main() {
  const now = new Date();
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
  const baseReports = path.join(ROOT, 'evaluation', 'reports');
  const folder = path.join(baseReports, day, time);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  if (!fs.existsSync(baseReports)) {
    fs.mkdirSync(baseReports, { recursive: true });
  }
  const report = run_evaluation();
  const reportPath = path.join(folder, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to ${reportPath}`);

  // Print evaluation summary
  console.log('============================================================');
  console.log('EVALUATION COMPLETE');
  console.log('============================================================');
  console.log(`Run ID: ${report.run_id}`);
  console.log(`Duration: ${report.duration_seconds.toFixed(2)}s`);
  console.log(`Success: ${report.success ? '✅ YES' : '❌ NO'}`);

  return report.success ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}