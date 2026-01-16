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
  let jsonOutput = null;
  const tests = [];

  try {
    // Jest output might be preceded by logging, so we find the first '{' and last '}'
    const startIdx = stdout.indexOf('{');
    const endIdx = stdout.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = stdout.substring(startIdx, endIdx + 1);
      jsonOutput = JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error('Failed to parse Jest JSON output:', e.message);
  }

  if (jsonOutput && jsonOutput.testResults) {
    jsonOutput.testResults.forEach(suite => {
      suite.assertionResults.forEach(assertion => {
        tests.push({
          nodeid: `memory-leaks.test.js::${assertion.title}`,
          name: assertion.title,
          outcome: assertion.status === 'passed' ? 'passed' : 'failed'
        });
      });
    });
  }

  const passed = tests.filter(t => t.outcome === 'passed').length;
  const failed = tests.filter(t => t.outcome === 'failed').length;

  return {
    success: exitCode === 0,
    exit_code: exitCode,
    tests,
    summary: {
      total: tests.length,
      passed,
      failed,
      errors: (exitCode !== 0 && failed === 0) ? 1 : 0,
      skipped: 0
    },
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
    // Use --json flag for reliable parsing and redirect stderr to stdout to capture everything
    stdout = execSync('npm test -- --json 2>&1', { 
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

  console.log(`\nResults: ${result.summary.passed} passed, ${result.summary.failed} failed (total: ${result.summary.total})`);
  result.tests.forEach(test => {
    const icon = test.outcome === 'passed' ? '✅' : '❌';
    console.log(`  ${icon} ${test.name}`);
  });

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

  const outputPath = process.argv[2] && process.argv[2].startsWith('--output=') 
    ? process.argv[2].split('=')[1]
    : path.join(projectRoot, 'report.json');

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${outputPath}`);

  process.exit(success ? 0 : 1);
}

main();
