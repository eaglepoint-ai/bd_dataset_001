const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TASK_ID = "9e3b7a";
const TASK_NAME = "TaskProcessor Memory Leak Fix";

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

function parseJestOutput(output) {
  const tests = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/[✓✕]/.test(trimmed) || /\[PASS\]|\[FAIL\]/.test(trimmed) || /√|×/.test(trimmed)) {
      const outcome = (trimmed.includes('✓') || trimmed.includes('[PASS]') || trimmed.includes('√')) ? 'passed' : 'failed';
      let name = trimmed.replace(/^[✓✕√×\[\]PASSFAIL\s]+/, '').replace(/\s*\(\d+\s*ms\)$/, '').trim();
      tests.push({
        nodeid: `memory-leaks.test.js::${name}`,
        name: name,
        outcome: outcome
      });
    }
  }

  // Summary counts
  let passed = 0, failed = 0;
  let summaryLine = lines.find(l => l.includes('Tests:'));
  if (summaryLine) {
    const passMatch = summaryLine.match(/(\d+)\s+passed/);
    const failMatch = summaryLine.match(/(\d+)\s+failed/);
    passed = passMatch ? parseInt(passMatch[1]) : 0;
    failed = failMatch ? parseInt(failMatch[1]) : 0;
  } else {
    passed = tests.filter(t => t.outcome === 'passed').length;
    failed = tests.filter(t => t.outcome === 'failed').length;
  }

  return {
    tests,
    summary: {
      total: passed + failed,
      passed,
      failed,
      errors: 0,
      skipped: 0
    }
  };
}

function runTests(repoPath, label, expectLeaks = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Repository: ${path.basename(repoPath)}`);

  const repoName = path.basename(repoPath);
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  
  try {
    stdout = execSync(
      'npx jest tests/ --verbose --forceExit 2>&1',
      {
        encoding: 'utf-8',
        timeout: 60000,
        env: { ...process.env, REPO: repoName, EXPECT_LEAKS: expectLeaks ? 'true' : 'false', CI: 'true' }
      }
    );
  } catch (error) {
    stdout = error.stdout ? error.stdout.toString() : '';
    stderr = error.stderr ? error.stderr.toString() : '';
    exitCode = error.status || 1;
    if (stdout) {
      console.log(`--- Captured Output for ${repoName} ---`);
      console.log(stdout.substring(0, 1000) + (stdout.length > 1000 ? '...' : ''));
    }
  }

  const { tests, summary } = parseJestOutput(stdout);

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

function main() {
  const runId = Math.random().toString(36).substring(2, 10);
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
    ? path.resolve(process.argv[2].split('=')[1])
    : path.join(projectRoot, 'report.json');

  const now = new Date();
  const timestampDir = path.join(projectRoot, 'evaluation', now.toISOString().split('T')[0], now.toTimeString().split(' ')[0].replace(/:/g, '-'));
  if (!fs.existsSync(timestampDir)) fs.mkdirSync(timestampDir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(timestampDir, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`\n✅ Report saved to: ${outputPath}`);
  process.exit(success ? 0 : 1);
}

main();


