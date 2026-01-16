const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TASK_ID = "9e3b7a";
const TASK_NAME = "TaskProcessor Memory Leak Fix";

function generateRunId() {
  return Math.random().toString(36).substring(2, 10);
}

function getGitInfo() {
  const info = { git_commit: 'unknown', git_branch: 'unknown' };
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' }).trim();
    info.git_commit = commit.substring(0, 8);
  } catch (e) {}
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' }).trim();
    info.git_branch = branch;
  } catch (e) {}
  return info;
}

function getEnvironmentInfo() {
  const gitInfo = getGitInfo();
  return {
    node_version: process.version,
    platform: os.platform(),
    os_release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
    git_commit: gitInfo.git_commit,
    git_branch: gitInfo.git_branch,
  };
}

/**
 * Parses Jest JSON output to match the required TestResult and EvaluationResult schema.
 */
function parseJestJson(stdout, stderr, exitCode) {
  const tests = [];
  let passed = 0;
  let failed = 0;
  const testDetails = [];

  // Extract test names from the output
  const testLines = stdout.split('\n').filter(line => line.includes('running \''));
  testLines.forEach(line => {
    const nameMatch = line.match(/running '([^']+)'/);
    const statusMatch = line.match(/\[(PASS|FAIL)\]/);
    if (nameMatch && statusMatch) {
      const name = nameMatch[1];
      const status = statusMatch[1];
      testDetails.push({ name, status });
      if (status === 'PASS') passed++;
      else failed++;
    }
  });

  // Fallback to summary line if we couldn't parse test names
  if (testDetails.length === 0) {
    const match = stdout.match(/Total: (\d+) \| Passed: (\d+) \| Failed: (\d+)/);
    if (match) {
      passed = parseInt(match[2], 10);
      failed = parseInt(match[3], 10);
      
      // Create dummy entries for fallback
      for (let i = 0; i < passed; i++) {
        testDetails.push({ name: `Memory Leak Test ${i + 1}`, status: 'PASS' });
      }
      for (let i = 0; i < failed; i++) {
        testDetails.push({ name: `Memory Leak Test ${passed + i + 1}`, status: 'FAIL' });
      }
    }
  }

  // Create test results for schema with proper nodeid format
  testDetails.forEach((test, idx) => {
    tests.push({ 
      nodeid: `memory-leaks.test.js::${test.name}`,
      name: test.name, 
      outcome: test.status === 'PASS' ? 'passed' : 'failed' 
    });
  });

  return {
    success: false, // Will be set in runTests
    exit_code: exitCode,
    tests,
    summary: {
      total: passed + failed,
      passed,
      failed,
      errors: (exitCode !== 0 && failed === 0) ? 1 : 0,
      skipped: 0
    },
    testDetails,
    stdout,
    stderr
  };
}

function runTests(repoPath, label, expectLeaks = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Repository: ${path.basename(repoPath)}`);

  const repoName = path.basename(repoPath);
  const env = { 
    ...process.env, 
    REPO: repoName, 
    EXPECT_LEAKS: expectLeaks ? 'true' : 'false', 
    CI: 'true' 
  };

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  
  try {
    stdout = execSync('npm test', { 
      env, 
      encoding: 'utf-8', 
      stdio: 'pipe'
    });
  } catch (e) {
    stdout = e.stdout?.toString() || '';
    stderr = e.stderr?.toString() || '';
    exitCode = e.status || 1;
  }

  const result = parseJestJson(stdout, stderr, exitCode);
  
  // Print results
  console.log(`\nResults: ${result.summary.passed} passed, ${result.summary.failed} failed (total: ${result.summary.total})`);
  if (result.testDetails && result.testDetails.length > 0) {
    result.testDetails.forEach(test => {
      console.log(`   ${test.name}`);
    });
  }
  
  // A repository check is successful if:
  // 1. For 'before': we EXPECT it to fail (as it has memory leaks), so success is if it HAS failures.
  // 2. For 'after': we expect it to PASS completely.
  
  if (expectLeaks) {
    // repository_before should fail tests
    result.success = (result.summary.failed > 0);
  } else {
    // repository_after should pass all tests
    result.success = (exitCode === 0 && result.summary.failed === 0 && result.summary.passed > 0);
  }

  return result;
}

function main() {
  const runId = generateRunId();
  const startedAt = new Date();

  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startedAt.toISOString()}`);
  console.log(`\n${'='.repeat(60)}`);
  console.log(TASK_NAME.toUpperCase());
  console.log('='.repeat(60));

  const projectRoot = path.join(__dirname, '..');
  const repoBefore = path.join(projectRoot, 'repository_before');
  const repoAfter = path.join(projectRoot, 'repository_after');

  const beforeResults = runTests(repoBefore, 'before (repository_before)', true);
  const afterResults = runTests(repoAfter, 'after (repository_after)', false);

  const comparison = {
    before_tests_passed: beforeResults.success,
    after_tests_passed: afterResults.success,
    before_passed: beforeResults.summary.passed,
    before_failed: beforeResults.summary.failed,
    after_passed: afterResults.summary.passed,
    after_failed: afterResults.summary.failed,
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nBefore Implementation (repository_before):`);
  console.log(`  Overall: ${beforeResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Tests: ${beforeResults.summary.passed}/${beforeResults.summary.total} passed`);

  console.log(`\nAfter Implementation (repository_after):`);
  console.log(`  Overall: ${afterResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Tests: ${afterResults.summary.passed}/${afterResults.summary.total} passed`);

  // Job is successful if BOTH stages met their expectations
  const success = beforeResults.success && afterResults.success;

  const report = {
    run_id: runId,
    task_id: TASK_ID,
    task_name: TASK_NAME,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    success,
    error: success ? null : "One or more repositories failed their structural/functional checks",
    environment: getEnvironmentInfo(),
    results: {
      before: beforeResults,
      after: afterResults,
      comparison
    }
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
  const reportDir = path.join(projectRoot, 'evaluation', timestamp);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const defaultOutputPath = path.join(reportDir, 'report.json');

  const outputPath = process.argv[2] && process.argv[2].startsWith('--output=') 
    ? process.argv[2].split('=')[1]
    : defaultOutputPath;

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${outputPath}`);

  process.exit(success ? 0 : 1);
}

main();