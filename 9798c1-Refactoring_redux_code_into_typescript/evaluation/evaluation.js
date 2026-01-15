#!/usr/bin/env node

/**
 * Evaluation script for Redux TypeScript refactoring task.
 *
 * Runs the existing Node test scripts against repository_before and repository_after,
 * parses their summary output, and writes a standardized JSON report to:
 *   evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'evaluation', 'reports');

const REPO_BEFORE = path.join(ROOT, 'repository_before');
const REPO_AFTER = path.join(ROOT, 'repository_after');
const HOST_MOUNT_DIR = process.env.HOST_MOUNT_DIR || '/app_host';
const HOST_REPORT_PATH = process.env.REPORT_PATH || path.join(HOST_MOUNT_DIR, 'report.json');
const WORKSPACE_MOUNT_DIR = process.env.WORKSPACE_MOUNT_DIR || '/workspace';
const WORKSPACE_REPORT_PATH = path.join(WORKSPACE_MOUNT_DIR, 'report.json');

function safeMkdirp(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nowUtcIso() {
  return new Date().toISOString();
}

function runCommand(cmd, options) {
  try {
    return {
      ok: true,
      code: 0,
      output: execSync(cmd, {
        ...options,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: '/bin/sh',
      }),
    };
  } catch (err) {
    const stdout = err && err.stdout ? String(err.stdout) : '';
    const stderr = err && err.stderr ? String(err.stderr) : '';
    const output = (stdout + stderr) || (err && err.message ? String(err.message) : '');
    const code = typeof err.status === 'number' ? err.status : 1;
    return { ok: false, code, output };
  }
}

function parseSummary(output) {
  // Our tests print:
  //   Tests Passed: X
  //   Tests Failed: Y
  //   Total Tests:  Z
  const res = { passed: null, failed: null, total: null };

  const passedMatch = output.match(/Tests Passed:\s*(\d+)/i);
  if (passedMatch) res.passed = Number(passedMatch[1]);

  const failedMatch = output.match(/Tests Failed:\s*(\d+)/i);
  if (failedMatch) res.failed = Number(failedMatch[1]);

  const totalMatch = output.match(/Total Tests:\s*(\d+)/i);
  if (totalMatch) res.total = Number(totalMatch[1]);

  return res;
}

function analyzeRepo(repoPath) {
  const metrics = {
    has_tsconfig: fs.existsSync(path.join(repoPath, 'tsconfig.json')),
    ts_files: 0,
    tsx_files: 0,
    js_files: 0,
    redux_ts_files: 0,
    redux_js_files: 0,
  };

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'build') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else {
        if (e.name.endsWith('.ts')) metrics.ts_files += 1;
        else if (e.name.endsWith('.tsx')) metrics.tsx_files += 1;
        else if (e.name.endsWith('.js')) metrics.js_files += 1;

        const rel = p.replace(repoPath + path.sep, '');
        if (rel.includes(path.join('src', 'redux') + path.sep)) {
          if (e.name.endsWith('.ts')) metrics.redux_ts_files += 1;
          if (e.name.endsWith('.js')) metrics.redux_js_files += 1;
        }
      }
    }
  }

  walk(repoPath);
  return metrics;
}

function runSuite({ targetName, repoPath }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running tests on ${targetName}`);
  console.log('='.repeat(60));

  const env = {
    ...process.env,
    TARGET: targetName === 'repository_before' ? 'before' : 'after',
    TEST_REPO_PATH: repoPath,
  };

  const compliance = runCommand('node tests/test_compliance.js', { cwd: ROOT, env });
  const smoke = runCommand('node tests/test_simple.js', { cwd: ROOT, env });

  const combinedOutput =
    `=== Compliance Tests ===\n${(compliance.output || '').slice(0, 8000)}\n\n` +
    `=== Smoke Tests ===\n${(smoke.output || '').slice(0, 8000)}`;

  const complianceStats = parseSummary(compliance.output || '');
  const smokeStats = parseSummary(smoke.output || '');

  // Our compliance test is intentionally "inverted" for BEFORE:
  // - BEFORE should be non-compliant: compliance script exits 0 when it has failures (expected)
  // - AFTER should be compliant: compliance script exits 0 only when all pass
  const isBefore = targetName === 'repository_before';
  const complianceLooksGood = isBefore
    ? (typeof complianceStats.failed === 'number' ? complianceStats.failed > 0 : !compliance.ok)
    : (typeof complianceStats.failed === 'number' ? complianceStats.failed === 0 : compliance.ok);

  const smokePassed = smoke.ok;
  const suitePassed = complianceLooksGood && smokePassed;

  return {
    metrics: analyzeRepo(repoPath),
    tests: {
      passed: suitePassed,
      return_code: suitePassed ? 0 : 1,
      output: combinedOutput.slice(0, 8000),
      breakdown: {
        compliance: {
          ok: compliance.ok,
          return_code: compliance.code,
          parsed: complianceStats,
        },
        smoke: {
          ok: smoke.ok,
          return_code: smoke.code,
          parsed: smokeStats,
        },
      },
    },
  };
}

function generateReport(before, after, startedAt, finishedAt) {
  const beforeTs = (before.metrics.ts_files || 0) + (before.metrics.tsx_files || 0);
  const afterTs = (after.metrics.ts_files || 0) + (after.metrics.tsx_files || 0);

  return {
    run_id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    started_at: startedAt,
    finished_at: finishedAt,
    environment: {
      node_version: process.version,
      platform: `${process.platform}-${process.arch}`,
    },
    before,
    after,
    comparison: {
      ts_files_added: afterTs - beforeTs,
      has_tsconfig_after: Boolean(after.metrics.has_tsconfig),
      redux_ts_files_after: after.metrics.redux_ts_files || 0,
      passed_gate: Boolean(after.tests.passed),
    },
    success: Boolean(after.tests.passed),
  };
}

function main() {
  console.log('='.repeat(60));
  console.log('Redux TypeScript Refactoring Evaluation');
  console.log('='.repeat(60));

  const startedAt = nowUtcIso();

  const before = runSuite({ targetName: 'repository_before', repoPath: REPO_BEFORE });
  const after = runSuite({ targetName: 'repository_after', repoPath: REPO_AFTER });

  const finishedAt = nowUtcIso();
  const report = generateReport(before, after, startedAt, finishedAt);

  const now = new Date();
  const dateDir = now.toISOString().slice(0, 10);
  const timeDir = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const reportDir = path.join(REPORTS_DIR, dateDir, timeDir);
  safeMkdirp(reportDir);

  const reportPath = path.join(reportDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Also write a flat artifact `report.json` for evaluation platforms that
  // expect it at the workspace root (mounted via docker-compose to /app_host).
  const artifactTargets = [
    { dir: HOST_MOUNT_DIR, path: HOST_REPORT_PATH },
    { dir: WORKSPACE_MOUNT_DIR, path: WORKSPACE_REPORT_PATH },
  ];

  for (const target of artifactTargets) {
    try {
      if (fs.existsSync(target.dir) && fs.statSync(target.dir).isDirectory()) {
        fs.writeFileSync(target.path, JSON.stringify(report, null, 2));
        console.log(`Artifact report written to: ${target.path}`);
      }
    } catch (e) {
      // Best-effort: evaluation should still succeed even if mounts aren't present.
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Evaluation Complete');
  console.log('='.repeat(60));
  console.log(`Overall Success: ${report.success}`);
  console.log(`Report saved to: ${reportPath}`);

  process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { parseSummary, analyzeRepo, runSuite, generateReport };

