#!/usr/bin/env node
/**
 * Evaluation script for CartService Bug Fix.
 * 
 * This script evaluates the bug fixes for both repository_before and repository_after,
 * comparing them against the 9 required bug fix criteria.
 * 
 * Requirements tested:
 * 1. Throw error when adding item from different merchant
 * 2. Validate quantity is a positive integer greater than zero
 * 3. Use atomic operation to prevent duplicate items
 * 4. Apply discounted price when discount is active and within date range
 * 5. Return updated cart from removeFromCart instead of null
 * 6. Recalculate cart pricing.subtotal after any item modification
 * 7. Recalculate cart pricing.totalItems after any item modification
 * 8. Handle edge case when cart has items but merchantId is not set
 * 9. Ensure all Decimal128 price values are converted correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'evaluation', 'reports');

function environmentInfo() {
  return {
    node_version: process.version,
    platform: `${os.type()} ${os.release()}`
  };
}

function runTests(repoName) {
  /**
   * Run Jest tests on the repository and return results.
   */
  const repoPath = `../${repoName}`;
  const basePath = '/app';
  
  try {
    const result = execSync(
      `REPOSITORY_PATH=${repoPath} node node_modules/jest/bin/jest.js tests/ --json --testTimeout=60000 --forceExit --config={}`,
      { 
        encoding: 'utf-8',
        cwd: basePath,
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    
    const jestOutput = JSON.parse(result);
    return {
      passed: jestOutput.success === true,
      return_code: 0,
      output: `Tests: ${jestOutput.numPassedTests} passed, ${jestOutput.numFailedTests} failed, ${jestOutput.numTotalTests} total`
    };
  } catch (error) {
    if (error.stdout) {
      try {
        const jestOutput = JSON.parse(error.stdout);
        return {
          passed: jestOutput.success === true,
          return_code: 1,
          output: `Tests: ${jestOutput.numPassedTests} passed, ${jestOutput.numFailedTests} failed, ${jestOutput.numTotalTests} total`
        };
      } catch (e) {
        // Parse error
      }
    }
    return {
      passed: false,
      return_code: 1,
      output: `Error running tests: ${error.message}`
    };
  }
}

function runMetrics(repoName) {
  /**
   * Collect metrics for the repository.
   */
  const repoPath = `../${repoName}`;
  const basePath = '/app';
  
  try {
    const result = execSync(
      `REPOSITORY_PATH=${repoPath} node node_modules/jest/bin/jest.js tests/ --json --testTimeout=60000 --forceExit --config={}`,
      { 
        encoding: 'utf-8',
        cwd: basePath,
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    
    const jestOutput = JSON.parse(result);
    return {
      tests_passed: jestOutput.numPassedTests,
      tests_failed: jestOutput.numFailedTests,
      tests_total: jestOutput.numTotalTests,
      pass_percentage: jestOutput.numTotalTests > 0 
        ? (jestOutput.numPassedTests / jestOutput.numTotalTests) * 100 
        : 0
    };
  } catch (error) {
    if (error.stdout) {
      try {
        const jestOutput = JSON.parse(error.stdout);
        return {
          tests_passed: jestOutput.numPassedTests,
          tests_failed: jestOutput.numFailedTests,
          tests_total: jestOutput.numTotalTests,
          pass_percentage: jestOutput.numTotalTests > 0 
            ? (jestOutput.numPassedTests / jestOutput.numTotalTests) * 100 
            : 0
        };
      } catch (e) {
        // Parse error
      }
    }
    return {};
  }
}

function evaluate(repoName) {
  /**
   * Evaluate a single repository.
   */
  const tests = runTests(repoName);
  const metrics = runMetrics(repoName);
  return {
    tests: tests,
    metrics: metrics
  };
}

function runEvaluation() {
  /**
   * Run the full evaluation comparing repository_before and repository_after.
   * Returns the complete evaluation report.
   */
  const runId = crypto.randomUUID();
  const start = new Date();
  
  try {
    console.log('Evaluating repository_before...');
    const before = evaluate('repository_before');
    
    console.log('Evaluating repository_after...');
    const after = evaluate('repository_after');
    
    // Success rule: after.tests.passed == true
    const passedGate = after.tests.passed;
    
    // Generate improvement summary
    const beforePassed = before.metrics.tests_passed || 0;
    const afterPassed = after.metrics.tests_passed || 0;
    const total = after.metrics.tests_total || 0;
    
    let improvementSummary;
    if (passedGate) {
      improvementSummary = `After implementation passed all tests (${afterPassed}/${total} vs ${beforePassed}/${total} before)`;
    } else {
      improvementSummary = `After implementation incomplete (${afterPassed}/${total} tests passed vs ${beforePassed}/${total} before)`;
    }
    
    const comparison = {
      passed_gate: passedGate,
      improvement_summary: improvementSummary
    };
    
    const end = new Date();
    
    return {
      run_id: runId,
      started_at: start.toISOString().replace('+00:00', 'Z'),
      finished_at: end.toISOString().replace('+00:00', 'Z'),
      duration_seconds: (end.getTime() - start.getTime()) / 1000,
      environment: environmentInfo(),
      before: before,
      after: after,
      comparison: comparison,
      success: passedGate,
      error: null
    };
    
  } catch (e) {
    const end = new Date();
    return {
      run_id: runId,
      started_at: start.toISOString().replace('+00:00', 'Z'),
      finished_at: end.toISOString().replace('+00:00', 'Z'),
      duration_seconds: (end.getTime() - start.getTime()) / 1000,
      environment: environmentInfo(),
      before: null,
      after: null,
      comparison: null,
      success: false,
      error: e.message || String(e)
    };
  }
}

function main() {
  /**
   * Main entry point.
   */
  console.log('Running evaluation...');
  console.log('='.repeat(60));
  
  const report = runEvaluation();
  
  // Print summary
  console.log(`\nRun ID: ${report.run_id}`);
  console.log(`Duration: ${report.duration_seconds.toFixed(2)} seconds`);
  console.log('');
  
  if (report.error) {
    console.log(`ERROR: ${report.error}`);
  } else {
    console.log('BEFORE (repository_before):');
    console.log(`  Tests passed: ${report.before.tests.passed}`);
    console.log(`  Results: ${report.before.metrics.tests_passed || 'N/A'}/${report.before.metrics.tests_total || 'N/A'}`);
    console.log('');
    console.log('AFTER (repository_after):');
    console.log(`  Tests passed: ${report.after.tests.passed}`);
    console.log(`  Results: ${report.after.metrics.tests_passed || 'N/A'}/${report.after.metrics.tests_total || 'N/A'}`);
    console.log('');
    console.log('COMPARISON:');
    console.log(`  Passed gate: ${report.comparison.passed_gate}`);
    console.log(`  Summary: ${report.comparison.improvement_summary}`);
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log(`SUCCESS: ${report.success}`);
  console.log('='.repeat(60));
  
  // Create report directory with format: reports/YYYY-MM-DD/HH-MM-SS/
  const now = new Date();
  const dateDir = now.toISOString().split('T')[0];
  const timeDir = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const reportDir = path.join(REPORTS, dateDir, timeDir);
  
  try {
    // Ensure the base reports directory exists first
    fs.mkdirSync(REPORTS, { recursive: true });
    fs.mkdirSync(reportDir, { recursive: true });
    
    // Write report
    const reportPath = path.join(reportDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport written to ${reportPath}`);
  } catch (e) {
    if (e.code === 'EACCES' || e.code === 'EPERM') {
      // If we can't write to the mounted volume, print the report to stdout instead
      console.log('\nWARNING: Could not write report to file (permission denied)');
      console.log('Report JSON output:');
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`\nWARNING: Could not write report to file: ${e.message}`);
      console.log('Report JSON output:');
      console.log(JSON.stringify(report, null, 2));
    }
  }
  
  process.exit(report.success ? 0 : 1);
}

main();
