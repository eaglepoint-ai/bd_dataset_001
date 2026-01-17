#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const REPORTS = path.join(__dirname, 'reports');

function getUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function environmentInfo() {
  return {
    node_version: process.version,
    platform: `${process.platform}-${process.arch}`
  };
}

function runTests(repoName) {
  const testArg = repoName === 'repository_before' ? 'before' : 'after';
  
  try {
    const result = execSync(
      `node tests/test_all.js ${testArg}`,
      {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 120000,
        stdio: 'pipe'
      }
    );
    
    return {
      passed: true,
      return_code: 0,
      output: result.slice(0, 8000)
    };
  } catch (error) {
    const output = (error.stdout || '') + (error.stderr || '');
    return {
      passed: false,
      return_code: error.status || 1,
      output: output.slice(0, 8000) || `Test execution error: ${error.message}`
    };
  }
}

function runMetrics(repoName) {
  return {};
}

function evaluate(repoName) {
  const tests = runTests(repoName);
  const metrics = runMetrics(repoName);
  return {
    tests: tests,
    metrics: metrics
  };
}

function runEvaluation() {
  const runId = getUUID();
  const start = new Date();
  
  try {
    const before = evaluate('repository_before');
    const after = evaluate('repository_after');
    
    const passedGate = after.tests.passed === true;
    let improvementSummary;
    
    if (before.tests.passed && after.tests.passed) {
      improvementSummary = 'Both versions pass. After implementation maintains correctness.';
    } else if (!before.tests.passed && after.tests.passed) {
      improvementSummary = 'After implementation passed correctness tests.';
    } else if (before.tests.passed && !after.tests.passed) {
      improvementSummary = 'Regression: After implementation fails tests that before passed.';
    } else {
      improvementSummary = 'Both versions fail tests.';
    }
    
    const comparison = {
      passed_gate: passedGate,
      improvement_summary: improvementSummary
    };
    
    const end = new Date();
    
    return {
      run_id: runId,
      started_at: start.toISOString(),
      finished_at: end.toISOString(),
      duration_seconds: (end - start) / 1000,
      environment: environmentInfo(),
      before: before,
      after: after,
      comparison: comparison,
      success: comparison.passed_gate,
      error: null
    };
  } catch (error) {
    const end = new Date();
    return {
      run_id: runId,
      started_at: start.toISOString(),
      finished_at: end.toISOString(),
      duration_seconds: (end - start) / 1000,
      environment: environmentInfo(),
      before: null,
      after: null,
      comparison: null,
      success: false,
      error: error.message
    };
  }
}

function main() {
  if (!fs.existsSync(REPORTS)) {
    fs.mkdirSync(REPORTS, { recursive: true });
  }
  
  console.log('Running evaluation...');
  const report = runEvaluation();
  
  const timestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  const timestampFile = `${timestamp}.json`;
  
  const reportPath = path.join(REPORTS, timestampFile);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  const latestPath = path.join(REPORTS, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  
  console.log('');
  console.log('Evaluation Summary:');
  console.log(`  Run ID: ${report.run_id}`);
  console.log(`  Duration: ${report.duration_seconds.toFixed(2)}s`);
  console.log(`  Before: ${report.before?.tests?.passed ? 'Passed' : 'Failed'}`);
  console.log(`  After:  ${report.after?.tests?.passed ? 'Passed' : 'Failed'}`);
  console.log(`  Gate:   ${report.comparison?.passed_gate ? 'Passed' : 'Failed'}`);
  console.log(`  Success: ${report.success ? 'Yes' : 'No'}`);
  console.log('');
  console.log(`Report: ${timestampFile}`);
  console.log(`Latest: latest.json`);
  
  if (report.error) {
    console.log(`Error: ${report.error}`);
  }
  
  return report.success ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { runEvaluation, main };
