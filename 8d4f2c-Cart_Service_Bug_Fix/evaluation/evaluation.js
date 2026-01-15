#!/usr/bin/env node
/**
 * Evaluation script for CartService Bug Fix
 * 
 * Runs tests on both repository_before and repository_after
 * and generates a report comparing the results.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

  // Use /app as the base directory since that's where we run from in Docker
  const basePath = '/app';
  
  try {
    const result = execSync(
      `REPOSITORY_PATH=${repoPath} node node_modules/jest/bin/jest.js tests/ --json --testTimeout=60000 --forceExit --config={}`,
      { 
        encoding: 'utf-8',
        cwd: basePath,
        maxBuffer: 10 * 1024 * 1024
      }
    );
    return JSON.parse(result);
  } catch (error) {
    // Jest exits with non-zero when tests fail, but still outputs JSON
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (e) {
        console.error('Failed to parse test output');
      }
    }
    return null;
  }
}

function parseTestResults(jestOutput) {
  if (!jestOutput || !jestOutput.testResults) {
    return { passed: 0, failed: 0, total: 0, tests: [] };
  }

  const tests = [];
  let passed = 0;
  let failed = 0;

  for (const suite of jestOutput.testResults) {
    for (const test of suite.assertionResults) {
      tests.push({
        name: test.fullName || test.title,
        status: test.status,
        requirement: extractRequirementNumber(test.fullName || test.title)
      });
      
      if (test.status === 'passed') {
        passed++;
      } else {
        failed++;
      }
    }
  }

  return {
    passed,
    failed,
    total: passed + failed,
    tests,
    success: jestOutput.success
  };
}

function extractRequirementNumber(testName) {
  const match = testName.match(/Requirement (\d+)/i);
  return match ? parseInt(match[1]) : null;
}

function generateReport(beforeResults, afterResults) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const report = {
    run_id: `${dateStr}_${timeStr}`,
    started_at: now.toISOString(),
    finished_at: new Date().toISOString(),
    success: afterResults.success === true,
    requirements: REQUIREMENTS.map(req => {
      const afterTest = afterResults.tests.find(t => t.requirement === req.id);
      const beforeTest = beforeResults.tests.find(t => t.requirement === req.id);
      
      return {
        id: req.id,
        description: req.description,
        before_status: beforeTest?.status || 'not_run',
        after_status: afterTest?.status || 'not_run',
        fixed: beforeTest?.status !== 'passed' && afterTest?.status === 'passed'
      };
    }),
    summary: {
      before: {
        passed: beforeResults.passed,
        failed: beforeResults.failed,
        total: beforeResults.total
      },
      after: {
        passed: afterResults.passed,
        failed: afterResults.failed,
        total: afterResults.total
      }
    }
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
  console.log('\n' + '='.repeat(60));
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\nBefore Implementation (repository_before):');
  console.log(`  Passed: ${report.summary.before.passed}/${report.summary.before.total}`);
  
  console.log('\nAfter Implementation (repository_after):');
  console.log(`  Passed: ${report.summary.after.passed}/${report.summary.after.total}`);
  
  console.log('\nRequirements Status:');
  for (const req of report.requirements) {
    const status = req.fixed ? '✅ FIXED' : (req.after_status === 'passed' ? '✓ PASS' : '✗ FAIL');
    console.log(`  ${req.id}. ${status} - ${req.description}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${report.success ? 'PASSED ✅' : 'FAILED ✗'}`);
  console.log('='.repeat(60));
}

async function main() {
  console.log('CartService Bug Fix Evaluation');
  console.log('==============================\n');

  // Run tests on before implementation
  // Path is relative to tests/ directory since that's where require() resolves from
  const beforeOutput = runTests('../repository_before');
  const beforeResults = parseTestResults(beforeOutput);
  
  // Run tests on after implementation
  const afterOutput = runTests('../repository_after');
  const afterResults = parseTestResults(afterOutput);
  
  // Generate and print report
  const report = generateReport(beforeResults, afterResults);
  printSummary(report);
  
  // Exit with appropriate code
  process.exit(report.success ? 0 : 1);
}

main().catch(error => {
  console.error('Evaluation failed:', error);
  process.exit(1);
});
