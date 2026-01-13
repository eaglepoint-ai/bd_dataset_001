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

function runTests(target) {
  if (target === 'before') {
    return {
      passed: false,
      return_code: 0,
      output: 'No tests to run for repository_before',
    };
  }
  try {
    const output = execSync('npm run test:after', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000,
    });
    return {
      passed: true,
      return_code: 0,
      output: output.slice(0, 8000),
    };
  } catch (err) {
    return {
      passed: false,
      return_code: err.status || 1,
      output: (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : ''),
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
  return { tests, metrics };
}

function run_evaluation() {
  const run_id = randomUUID();
  const start = new Date();
  const before = evaluate('repository_before');
  const after = evaluate('repository_after');
  const comparison = {
    passed_gate: after.tests.passed,
    improvement_summary: after.tests.passed
      ? 'After implementation passed correctness checks.'
      : 'After implementation did not pass correctness checks.',
  };
  const end = new Date();
  return {
    run_id,
    started_at: start.toISOString(),
    finished_at: end.toISOString(),
    duration_seconds: (end - start) / 1000,
    environment: environmentInfo(),
    before,
    after,
    comparison,
    success: comparison.passed_gate,
    error: null,
  };
}

export { run_evaluation };

function main() {
  const now = new Date();
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
  const folder = path.join(ROOT, 'evaluation', day, time);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  const report = run_evaluation();
  const reportPath = path.join(folder, 'latest.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to ${reportPath}`);
  return report.success ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}