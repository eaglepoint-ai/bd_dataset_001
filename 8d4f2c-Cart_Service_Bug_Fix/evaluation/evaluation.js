#!/usr/bin/env node
/**
 * Evaluation script for CartService Bug Fix
 * 
 * Runs tests on both repository_before and repository_after
 * and generates a report comparing the results.
 * 
 * Output format matches Aquila expected structure.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REQUIREMENTS = [
  { id: 1, description: 'Throw error when adding item from different merchant than existing cart items' },
  { id: 2, description: 'Validate quantity is a positive integer greater than zero' },
  { id: 3, description: 'Use atomic operation to prevent duplicate items on concurrent requests' },
  { id: 4, description: 'Apply discounted price when discount is active and within valid date range' },
  { id: 5, description: 'Return updated cart from removeFromCart instead of null' },
  { id: 6, description: 'Recalculate cart pricing.subtotal after any item modification' },
  { id: 7, description: 'Recalculate cart pricing.totalItems after any item modification' },
  { id: 8, description: 'Handle edge case when cart has items but merchantId is not set' },
  { id: 9, description: 'Ensure all Decimal128 price values are converted correctly' }
];

function runTests(repoPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running tests for: ${repoPath}`);
  console.log('='.repeat(60));

  const basePath = '/app';
  let stdout = '';
  let stderr = '';
  let jestOutput = null;
  
  try {
    stdout = execSync(
      `REPOSITORY_PATH=${repoPath} node node_modules/jest/bin/jest.js tests/ --json --testTimeout=60000 --forceExit --config={}`,
      { 
        encoding: 'utf-8',
        cwd: basePath,
        maxBuffer: 10 * 1024 * 1024
      }
    );
    jestOutput = JSON.parse(stdout);
  } catch (error) {
    stderr = error.stderr || '';
    if (error.stdout) {
      stdout = error.stdout;
      try {
        jestOutput = JSON.parse(error.stdout);
      } catch (e) {
        console.error('Failed to parse test output');
      }
    }
  }
  
  return { jestOutput, stdout, stderr };
}

function parseTestResults(runResult) {
  const { jestOutput, stdout, stderr } = runResult;
  
  if (!jestOutput || !jestOutput.testResults) {
    return { 
      passed: 0, 
      failed: 0, 
      errors: 0,
      skipped: 0,
      total: 0, 
      tests: [],
      stdout: stdout || '',
      stderr: stderr || ''
    };
  }

  const tests = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const suite of jestOutput.testResults) {
    for (const test of suite.assertionResults) {
      const outcome = test.status === 'passed' ? 'passed' : 
                      test.status === 'skipped' ? 'skipped' : 'failed';
      
      tests.push({
        nodeid: `tests/cartService.test.js::${test.fullName || test.title}`,
        name: test.fullName || test.title,
        outcome: outcome,
        requirement: extractRequirementNumber(test.fullName || test.title)
      });
      
      if (test.status === 'passed') passed++;
      else if (test.status === 'skipped') skipped++;
      else failed++;
    }
  }

  return {
    passed,
    failed,
    errors: 0,
    skipped,
    total: passed + failed + skipped,
    tests,
    success: jestOutput.success,
    stdout: stdout || '',
    stderr: stderr || ''
  };
}

function extractRequirementNumber(testName) {
  const match = testName.match(/Requirement (\d+)/i);
  return match ? parseInt(match[1]) : null;
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', { encoding: 'utf-8' }).trim();
    const commit = execSync('git rev-parse HEAD 2>/dev/null', { encoding: 'utf-8' }).trim();
    return { branch, commit };
  } catch {
    return { branch: 'unknown', commit: 'unknown' };
  }
}

function generateReport(beforeResults, afterResults, startTime) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const durationSeconds = (now.getTime() - startTime.getTime()) / 1000;
  
  const gitInfo = getGitInfo();
  
  // Aquila-compatible report format
  const report = {
    run_id: `${dateStr}_${timeStr}`,
    started_at: startTime.toISOString(),
    finished_at: now.toISOString(),
    duration_seconds: durationSeconds,
    success: afterResults.success === true,
    error: null,
    environment: {
      node_version: process.version,
      platform: process.platform,
      os: `${os.type()} ${os.release()}`,
      hostname: os.hostname(),
      git_branch: gitInfo.branch,
      git_commit: gitInfo.commit
    },
    results: {
      before: {
        tests: beforeResults.tests,
        summary: {
          total: beforeResults.total,
          passed: beforeResults.passed,
          failed: beforeResults.failed,
          errors: beforeResults.errors,
          skipped: beforeResults.skipped
        },
        stdout: beforeResults.stdout,
        stderr: beforeResults.stderr
      },
      after: {
        tests: afterResults.tests,
        summary: {
          total: afterResults.total,
          passed: afterResults.passed,
          failed: afterResults.failed,
          errors: afterResults.errors,
          skipped: afterResults.skipped
        },
        stdout: afterResults.stdout,
        stderr: afterResults.stderr
      },
      comparison: {
        before_tests_passed: beforeResults.success === true,
        after_tests_passed: afterResults.success === true,
        before_total: beforeResults.total,
        before_passed: beforeResults.passed,
        before_failed: beforeResults.failed,
        after_total: afterResults.total,
        after_passed: afterResults.passed,
        after_failed: afterResults.failed
      }
    },
    requirements: REQUIREMENTS.map(req => {
      const afterTest = afterResults.tests.find(t => t.requirement === req.id);
      const beforeTest = beforeResults.tests.find(t => t.requirement === req.id);
      
      return {
        id: req.id,
        description: req.description,
        before_status: beforeTest?.outcome || 'not_run',
        after_status: afterTest?.outcome || 'not_run',
        fixed: beforeTest?.outcome !== 'passed' && afterTest?.outcome === 'passed'
      };
    })
  };

  // Save report to evaluation/report.json (expected by Aquila)
  const mainReportPath = path.join(__dirname, 'report.json');
  fs.writeFileSync(mainReportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${mainReportPath}`);

  // Also save a timestamped copy for history
  const reportsDir = path.join(__dirname, 'reports', dateStr, timeStr);
  fs.mkdirSync(reportsDir, { recursive: true });
  const historyReportPath = path.join(reportsDir, 'report.json');
  fs.writeFileSync(historyReportPath, JSON.stringify(report, null, 2));
  
  return report;
}

function printSummary(report) {
  // Print log_summary artifact (structured for Aquila)
  console.log('\n' + '='.repeat(60));
  console.log('LOG_SUMMARY');
  console.log('='.repeat(60));
  console.log(JSON.stringify({
    run_id: report.run_id,
    duration_seconds: report.duration_seconds,
    before: report.results.comparison,
    success: report.success
  }, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\nBefore Implementation (repository_before):');
  console.log(`  Passed: ${report.results.before.summary.passed}/${report.results.before.summary.total}`);
  
  console.log('\nAfter Implementation (repository_after):');
  console.log(`  Passed: ${report.results.after.summary.passed}/${report.results.after.summary.total}`);
  
  console.log('\nRequirements Status:');
  for (const req of report.requirements) {
    const status = req.fixed ? '✅ FIXED' : (req.after_status === 'passed' ? '✓ PASS' : '✗ FAIL');
    console.log(`  ${req.id}. ${status} - ${req.description}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${report.success ? 'PASSED ✅' : 'FAILED ✗'}`);
  console.log('='.repeat(60));
  
  // Print report_content artifact (full report for Aquila)
  console.log('\n' + '='.repeat(60));
  console.log('REPORT_CONTENT');
  console.log('='.repeat(60));
  console.log(JSON.stringify(report, null, 2));
}

async function main() {
  const startTime = new Date();
  
  console.log('CartService Bug Fix Evaluation');
  console.log('==============================\n');

  // Run tests on before implementation
  const beforeRunResult = runTests('../repository_before');
  const beforeResults = parseTestResults(beforeRunResult);
  
  // Run tests on after implementation
  const afterRunResult = runTests('../repository_after');
  const afterResults = parseTestResults(afterRunResult);
  
  // Generate and print report
  const report = generateReport(beforeResults, afterResults, startTime);
  printSummary(report);
  
  // Exit with appropriate code
  process.exit(report.success ? 0 : 1);
}

main().catch(error => {
  console.error('Evaluation failed:', error);
  process.exit(1);
});
