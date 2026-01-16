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

function parseJestOutput(stdout) {
  const tests = [];
  const lines = stdout.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Support both reference format [PASS] and Jest format ✓/✕/PASS/FAIL
    if (/[✓✕√×]/.test(trimmed) || /\[PASS\]|\[FAIL\]/.test(trimmed) || trimmed.startsWith('PASS ') || trimmed.startsWith('FAIL ')) {
      const outcome = (trimmed.includes('✓') || trimmed.includes('[PASS]') || trimmed.includes('√') || trimmed.startsWith('PASS ')) ? 'passed' : 'failed';
      
      // Extract name - handle both [PASS] Name and ✓ Name
      let name = trimmed
        .replace(/^[✓✕√×\[\]PASSFAIL\s]+/, '')
        .replace(/\s*\(\d+\s*ms\)$/, '') // Remove (123 ms)
        .trim();

      if (name) {
        tests.push({
          nodeid: `memory-leaks.test.js::${name}`,
          name: name,
          outcome: outcome
        });
      }
    }
  }

  const passed = tests.filter(t => t.outcome === 'passed').length;
  const failed = tests.filter(t => t.outcome === 'failed').length;

  return {
    tests,
    summary: {
      total: tests.length,
      passed,
      failed,
      errors: 0, 
      skipped: 0
    }
  };
}

function runTests(repoPath, label, expectLeaks = false) {
  // For memory leak tasks: Don't pass EXPECT_LEAKS, let tests naturally fail/pass
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Repository: ${path.basename(repoPath)}`);

  const repoName = path.basename(repoPath);
  // Don't set EXPECT_LEAKS - let tests fail naturally in before, pass in after
  const env = { ...process.env, REPO: repoName, CI: 'true' };
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  
  try {
    // Redirect stderr to stdout to ensure Jest output is captured
    stdout = execSync('npm test 2>&1', { 
      env, 
      encoding: 'utf-8', 
      stdio: 'pipe' 
    });
  } catch (e) {
    stdout = e.stdout?.toString() || '';
    stderr = e.stderr?.toString() || '';
    exitCode = e.status || 1;
  }

  const { tests, summary } = parseJestOutput(stdout);
  summary.errors = (exitCode !== 0 && summary.failed === 0) ? 1 : 0;

  console.log(`\nResults: ${summary.passed} passed, ${summary.failed} failed (total: ${summary.total})`);
  tests.forEach(test => {
    const icon = test.outcome === 'passed' ? '✅' : '❌';
    console.log(`  ${icon} ${test.name}`);
  });

  return {
    success: exitCode === 0,
    exit_code: exitCode,
    tests,
    summary,
    stdout,
    stderr
  };
}

function generateOutputPath() {
  const projectRoot = path.resolve(__dirname, '..');
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(projectRoot, 'evaluation', dateStr, timeStr);
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, 'report.json');
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

  // For memory leak fix: before should fail (leaks detected), after should pass (leaks fixed)
  const success = !beforeResults.success && afterResults.success && afterResults.summary.failed === 0;

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



