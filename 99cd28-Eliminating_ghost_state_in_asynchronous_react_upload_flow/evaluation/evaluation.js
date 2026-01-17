#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateRunId() {
  return uuidv4().slice(0, 8);
}

function createReportDir() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const reportDir = join(__dirname, 'reports', dateStr, timeStr);
  mkdirSync(reportDir, { recursive: true });
  return reportDir;
}

function runTests(repoPath, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running tests on ${label}...`);
  console.log('='.repeat(60));

  try {
    const result = execSync(
      `cd tests && REPO_PATH=${repoPath} npm test`,
      { 
        encoding: 'utf8',
        timeout: 60000,
        cwd: join(__dirname, '..')
      }
    );

    console.log(result);

    // Parse our simple test output
    const lines = result.split('\n');
    let total = 0;
    let passed = 0;
    let failed = 0;

    // Look for our test results
    for (const line of lines) {
      if (line.includes('Total tests:')) {
        total = parseInt(line.split(':')[1].trim());
      }
      if (line.includes('Passed:')) {
        passed = parseInt(line.split(':')[1].trim());
      }
      if (line.includes('Failed:')) {
        failed = parseInt(line.split(':')[1].trim());
      }
    }

    // Create test entries based on our simple format
    const tests = [];
    for (let i = 0; i < passed; i++) {
      tests.push({
        nodeid: `test_passed_${i}`,
        name: `test_passed_${i}`,
        outcome: 'passed'
      });
    }
    for (let i = 0; i < failed; i++) {
      tests.push({
        nodeid: `test_failed_${i}`,
        name: `test_failed_${i}`,
        outcome: 'failed'
      });
    }

    return {
      success: failed === 0,
      exit_code: 0,
      tests: tests,
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        errors: 0,
        skipped: 0
      },
      stdout: result,
      stderr: ''
    };

  } catch (error) {
    console.error(`Tests failed for ${label}:`, error.message);
    
    // Try to parse output even from failed command
    const output = error.stdout || '';
    const lines = output.split('\n');
    let total = 0;
    let passed = 0;
    let failed = 0;

    for (const line of lines) {
      if (line.includes('Total tests:')) {
        total = parseInt(line.split(':')[1].trim());
      }
      if (line.includes('Passed:')) {
        passed = parseInt(line.split(':')[1].trim());
      }
      if (line.includes('Failed:')) {
        failed = parseInt(line.split(':')[1].trim());
      }
    }

    const tests = [];
    for (let i = 0; i < passed; i++) {
      tests.push({
        nodeid: `test_passed_${i}`,
        name: `test_passed_${i}`,
        outcome: 'passed'
      });
    }
    for (let i = 0; i < failed; i++) {
      tests.push({
        nodeid: `test_failed_${i}`,
        name: `test_failed_${i}`,
        outcome: 'failed'
      });
    }

    return {
      success: false,
      exit_code: error.status || 1,
      tests: tests,
      summary: {
        total: total || 0,
        passed: passed || 0,
        failed: failed || 0,
        errors: total === 0 ? 1 : 0,
        skipped: 0
      },
      stdout: output,
      stderr: error.message
    };
  }
}

function getEnvironmentInfo() {
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const platform = execSync('uname -a', { encoding: 'utf8' }).trim();
    
    return {
      node_version: nodeVersion,
      platform: platform,
      os: process.platform,
      architecture: process.arch,
      hostname: execSync('hostname', { encoding: 'utf8' }).trim(),
      git_commit: 'unknown',
      git_branch: 'unknown'
    };
  } catch (e) {
    return {
      node_version: process.version,
      platform: 'unknown',
      os: process.platform,
      architecture: process.arch,
      hostname: 'unknown',
      git_commit: 'unknown',
      git_branch: 'unknown'
    };
  }
}

function main() {
  const runId = generateRunId();
  const startTime = new Date();
  
  console.log('Starting React Upload Manager evaluation...');
  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startTime.toISOString()}`);
  
  // Run tests on repository_before
  const beforeResults = runTests('../repository_before', 'repository_before');
  
  // Run tests on repository_after
  const afterResults = runTests('../repository_after', 'repository_after');
  
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  // Determine overall success
  // Before should have some tests failing (ghost state issues)
  // After should have all tests passing (ghost state fixed)
  const overallSuccess = (
    !beforeResults.success && 
    afterResults.success && 
    afterResults.summary.passed > beforeResults.summary.passed
  );
  
  // Create report
  const report = {
    run_id: runId,
    started_at: startTime.toISOString(),
    finished_at: endTime.toISOString(),
    duration_seconds: Math.round(duration * 100) / 100,
    success: overallSuccess,
    error: null,
    environment: getEnvironmentInfo(),
    results: {
      before: beforeResults,
      after: afterResults,
      comparison: {
        before_tests_passed: beforeResults.success,
        after_tests_passed: afterResults.success,
        before_total: beforeResults.summary.total,
        before_passed: beforeResults.summary.passed,
        before_failed: beforeResults.summary.failed,
        after_total: afterResults.summary.total,
        after_passed: afterResults.summary.passed,
        after_failed: afterResults.summary.failed
      }
    }
  };
  
  // Save report
  const reportDir = createReportDir();
  const reportPath = join(reportDir, 'report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Run ID: ${runId}`);
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Report saved to: ${reportPath}`);
  console.log(`Overall success: ${overallSuccess}`);
  console.log('');
  console.log('Summary:');
  console.log(`  Before tests: ${beforeResults.summary.passed}/${beforeResults.summary.total} passed`);
  console.log(`  After tests: ${afterResults.summary.passed}/${afterResults.summary.total} passed`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}