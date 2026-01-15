const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function runMocha(testFile, nodePath) {
  const env = { ...process.env, NODE_PATH: nodePath };
  const start = Date.now();
  const result = spawnSync('npx', ['mocha', testFile, '--reporter', 'spec'], {
    env,
    encoding: 'utf-8',
    timeout: 300000,
  });
  const end = Date.now();
  return {
    passed: result.status === 0,
    return_code: result.status,
    output: (result.stdout + '\n' + result.stderr).slice(0, 8000),
    duration_ms: end - start,
  };
}

function getEnvironmentInfo() {
  return {
    node_version: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    hostname: os.hostname(),
  };
}

function writeReport(report) {
  const reportsDir = path.join(__dirname, 'reports');
  const now = new Date();
  const dateDir = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeDir = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
  const fullDir = path.join(reportsDir, dateDir, timeDir);
  fs.mkdirSync(fullDir, { recursive: true });
  const reportPath = path.join(fullDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  // Also write to latest.json for convenience
  const latest = path.join(reportsDir, 'latest.json');
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));
  console.log(`Report written to ${reportPath}`);
}

function main() {
  const run_id = uuidv4();
  const started_at = new Date().toISOString();
  const before = runMocha(path.join('tests', 'productSearch.before.test.js'), path.join('repository_before'));
  const after = runMocha(path.join('tests', 'productSearch.after.test.js'), path.join('repository_after'));
  const finished_at = new Date().toISOString();
  const duration_seconds = (new Date(finished_at) - new Date(started_at)) / 1000;
  const environment = getEnvironmentInfo();

  const comparison = {
    passed_gate: after.passed,
    improvement_summary: after.passed && !before.passed
      ? 'Performance and correctness improved in after version.'
      : after.passed ? 'All tests pass in after version.' : 'After version did not pass all tests.'
  };

  const report = {
    run_id,
    started_at,
    finished_at,
    duration_seconds,
    environment,
    before,
    after,
    comparison,
    success: comparison.passed_gate,
    error: null
  };

  writeReport(report);
  process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

