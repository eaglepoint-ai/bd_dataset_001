#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function generateRunId() {
  return Math.random().toString(36).substring(2, 10);
}

function getGitInfo() {
  const gitInfo = { git_commit: 'unknown', git_branch: 'unknown' };
  try {
    gitInfo.git_commit = execSync('git rev-parse HEAD', { encoding: 'utf8', timeout: 5000 }).trim().substring(0, 8);
  } catch (err) {}
  try {
    gitInfo.git_branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', timeout: 5000 }).trim();
  } catch (err) {}
  return gitInfo;
}

function getEnvironmentInfo() {
  const gitInfo = getGitInfo();
  return {
    node_version: process.version,
    platform: os.platform(),
    os: os.type(),
    os_release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
    git_commit: gitInfo.git_commit,
    git_branch: gitInfo.git_branch,
  };
}

function runTests(repositoryPath, repositoryName) {
  console.log('\n' + '='.repeat(60));
  console.log(`RUNNING TESTS: ${repositoryName}`);
  console.log('='.repeat(60));

  try {
    const output = execSync('npm test', {
      cwd: path.join(__dirname, '..', repositoryPath),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true' }
    });

    const lines = output.split('\n');
    const tests = [];
    let passed = 0;
    let total = 0;

    lines.forEach(line => {
      if (line.includes('✓') || line.includes('√')) {
        const testName = line.replace(/[✓√]/g, '').trim();
        if (testName) {
          tests.push({
            nodeid: `${repositoryName}::${testName}`,
            name: testName,
            outcome: 'passed',
            message: 'Test passed',
          });
          passed++;
          total++;
        }
      }
    });

    const passMatch = output.match(/(\d+) passed/);
    const totalMatch = output.match(/Tests:\s+(\d+) passed/);
    
    if (passMatch) passed = parseInt(passMatch[1]);
    if (totalMatch) total = parseInt(totalMatch[1]);

    const summary = {
      total: total || tests.length,
      passed: passed || tests.length,
      failed: 0,
      errors: 0,
      skipped: 0,
    };

    console.log(`\n✅ Tests: ${summary.passed}/${summary.total} passed`);

    return {
      success: true,
      exit_code: 0,
      tests,
      summary,
    };
  } catch (err) {
    console.error('\nERROR:', err.message);
    return {
      success: false,
      exit_code: 1,
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, errors: 1, skipped: 0 },
      error: err.message,
    };
  }
}

function generateOutputPath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(__dirname, dateStr, timeStr);
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, 'report.json');
}

const runId = generateRunId();
const startedAt = new Date();

console.log('\n' + '='.repeat(60));
console.log('SONGLIST COMPONENT REFACTOR EVALUATION');
console.log('='.repeat(60));
console.log(`Run ID: ${runId}`);
console.log(`Started at: ${startedAt.toISOString()}`);

const afterResults = runTests('repository_after', 'repository_after');

const finishedAt = new Date();
const duration = (finishedAt - startedAt) / 1000;

const comparison = {
  after_tests_passed: afterResults.success,
  after_total: afterResults.summary.total,
  after_passed: afterResults.summary.passed,
  after_failed: afterResults.summary.failed,
};

console.log('\n' + '='.repeat(60));
console.log('EVALUATION SUMMARY');
console.log('='.repeat(60));
console.log(`\nAfter Implementation (repository_after):`);
console.log(`  Overall: ${afterResults.success ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  Tests: ${comparison.after_passed}/${comparison.after_total} passed`);

const success = afterResults.success;
const errorMessage = success ? null : 'After implementation tests failed';

const report = {
  run_id: runId,
  started_at: startedAt.toISOString(),
  finished_at: finishedAt.toISOString(),
  duration_seconds: parseFloat(duration.toFixed(6)),
  success,
  error: errorMessage,
  environment: getEnvironmentInfo(),
  results: {
    after: afterResults,
    comparison,
  },
};

const outputPath = generateOutputPath();
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log(`\n✅ Report saved to: ${outputPath}`);
console.log('\n' + '='.repeat(60));
console.log('EVALUATION COMPLETE');
console.log('='.repeat(60));
console.log(`Duration: ${duration.toFixed(2)}s`);
console.log(`Success: ${success ? '✅ YES' : '❌ NO'}`);

process.exit(success ? 0 : 1);
