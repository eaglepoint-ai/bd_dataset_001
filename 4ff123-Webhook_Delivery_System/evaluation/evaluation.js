const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TASK_NAME = 'Webhook Delivery System';

/**
 * Generates a unique run ID
 */
function generateRunId() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Parses test output to match the required TestResult schema
 */
function parseTestOutput(stdout, stderr, exitCode) {
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
    }
  }

  // Create test results for schema
  testDetails.forEach((test, idx) => {
    tests.push({ 
      nodeid: `webhook.test.js::${test.name}`,
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

/**
 * Runs tests for a specific repository
 */
function runTests(repoPath, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Repository: ${path.basename(repoPath)}`);

  const repoName = path.basename(repoPath);
  const env = { 
    ...process.env, 
    REPO: repoName, 
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

  const result = parseTestOutput(stdout, stderr, exitCode);
  
  // Print results
  console.log(`\nResults: ${result.summary.passed} passed, ${result.summary.failed} failed (total: ${result.summary.total})`);
  if (result.testDetails && result.testDetails.length > 0) {
    result.testDetails.forEach(test => {
      console.log(`   ${test.name}`);
    });
  }
  
  // For repository_after, success means all tests pass
  result.success = (exitCode === 0 && result.summary.failed === 0 && result.summary.passed > 0);

  return result;
}

/**
 * Main evaluation function
 */
function main() {
  const runId = generateRunId();
  const startedAt = new Date();

  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startedAt.toISOString()}`);
  console.log(`\n${'='.repeat(60)}`);
  console.log(TASK_NAME.toUpperCase());
  console.log('='.repeat(60));

  const projectRoot = path.join(__dirname, '..');
  const repoAfter = path.join(projectRoot, 'repository_after');

  // Run tests for repository_after (this is code generation, no before)
  const afterResults = runTests(repoAfter, 'after (repository_after)');

  const comparison = {
    after_tests_passed: afterResults.success,
    after_passed: afterResults.summary.passed,
    after_failed: afterResults.summary.failed,
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nImplementation (repository_after):`);
  console.log(`  Overall: ${afterResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Tests: ${afterResults.summary.passed}/${afterResults.summary.total} passed`);

  // Prepare report
  const finishedAt = new Date();
  const report = {
    run_id: runId,
    task_id: '4ff123',
    task_name: TASK_NAME,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_seconds: (finishedAt - startedAt) / 1000,
    success: afterResults.success,
    results: {
      after: {
        success: afterResults.success,
        exit_code: afterResults.exit_code,
        tests: afterResults.tests,
        summary: afterResults.summary,
        stdout: afterResults.stdout,
        stderr: afterResults.stderr
      }
    },
    comparison,
    metadata: {
      node_version: process.version,
      platform: process.platform
    }
  };

  // Save report
  const timestamp = startedAt.toISOString().replace(/:/g, '-').split('.')[0];
  const outputDir = path.join(__dirname, timestamp);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const defaultOutputPath = path.join(outputDir, 'report.json');
  const outputPath = process.argv[2] && process.argv[2].startsWith('--output=') 
    ? process.argv[2].split('=')[1]
    : defaultOutputPath;

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${outputPath}`);

  process.exit(afterResults.success ? 0 : 1);
}

// Run main
main();
