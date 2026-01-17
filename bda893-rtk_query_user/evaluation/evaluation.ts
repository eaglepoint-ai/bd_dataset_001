#!/usr/bin/env tsx
/**
 * Evaluation script for comparing repository_before and repository_after.
 * Runs Vitest tests on both repositories and generates a comparison report.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'evaluation', 'reports');

interface TestResults {
  passed: boolean;
  returnCode: number;
  output: string;
  testCount?: number;
  passCount?: number;
  failCount?: number;
}

interface Metrics {
  // Add task-specific metrics here if needed
  [key: string]: unknown;
}

interface EvaluationResult {
  tests: TestResults;
  metrics: Metrics;
}

interface Report {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  environment: {
    node_version: string;
    platform: string;
  };
  before: EvaluationResult;
  after: EvaluationResult;
  comparison: {
    passed_gate: boolean;
    improvement_summary: string;
  };
  success: boolean;
  error: string | null;
}

function environmentInfo(): { node_version: string; platform: string } {
  return {
    node_version: process.version,
    platform: `${process.platform}-${process.arch}`,
  };
}

function runTests(repoName: string): TestResults {
  try {
    const command = `npm run test:run -- --reporter=json -t "${repoName}"`;
    
    console.log(`Running tests for ${repoName}...`);
    
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'pipe',
    });

    // Parse Vitest JSON output (Vitest outputs JSON when --reporter=json is used)
    let testResults: TestResults;
    try {
      const lines = output.trim().split('\n');
      const jsonLine = lines[lines.length - 1];
      const vitestOutput = JSON.parse(jsonLine);
      const numTotalTests = vitestOutput.numTotalTests || 0;
      const numPassedTests = vitestOutput.numPassedTests || 0;
      const numFailedTests = vitestOutput.numFailedTests || 0;
      
      testResults = {
        passed: vitestOutput.success === true && numPassedTests > 0,
        returnCode: vitestOutput.success === true ? 0 : 1,
        output: output.substring(0, 8000),
        testCount: numTotalTests,
        passCount: numPassedTests,
        failCount: numFailedTests,
      };
    } catch {
      // Fallback if JSON parsing fails - parse text output
      const hasPassed = (output.toLowerCase().includes('passed') || output.includes('PASS')) && 
                       !output.toLowerCase().includes('0 passed') &&
                       !output.includes('FAIL');
      const returnCode = hasPassed ? 0 : 1;
      testResults = {
        passed: hasPassed,
        returnCode,
        output: output.substring(0, 8000),
      };
    }

    return testResults;
  } catch (error: unknown) {
    const err = error as { status: number | null; stdout?: string; stderr?: string; message?: string };
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    const output = `${stdout}\n${stderr}`.substring(0, 8000) || err.message || `Error running tests: ${error}`;
    
    return {
      passed: false,
      returnCode: err.status || -1,
      output,
    };
  }
}

function runMetrics(): Metrics {
  // Placeholder for future metrics
  // Example metrics could include:
  // - Performance metrics (response times, throughput)
  // - Stability metrics (failure rates)
  // - Resource usage (memory, CPU)
  return {};
}

function evaluate(repoName: string): EvaluationResult {
  // Run tests
  const tests = runTests(repoName);

  // Collect metrics (optional)
  const metrics = runMetrics();

  return { tests, metrics };
}

function runEvaluation(): Report {
  const runId = randomUUID();
  const start = new Date();

  try {
    // Evaluate repository_before
    const before = evaluate('repository_before');

    // Evaluate repository_after
    const after = evaluate('repository_after');

    // Compare results
    const beforePassed = before.tests.passed;
    const afterPassed = after.tests.passed;

    const summaries: Record<string, string> = {
      'true,true': 'Both implementations passed tests',
      'false,true': 'After implementation fixed failing tests',
      'true,false': 'After implementation introduced regressions',
      'false,false': 'Both implementations failed tests',
    };

    const comparison = {
      passed_gate: afterPassed,
      improvement_summary: summaries[`${beforePassed},${afterPassed}`] || 'Unknown comparison',
    };

    const end = new Date();
    const duration = (end.getTime() - start.getTime()) / 1000;

    const report: Report = {
      run_id: runId,
      started_at: start.toISOString(),
      finished_at: end.toISOString(),
      duration_seconds: duration,
      environment: environmentInfo(),
      before,
      after,
      comparison,
      success: comparison.passed_gate,
      error: null,
    };

    return report;
  } catch (error) {
    // Error handling: evaluation crashed
    const end = new Date();
    const duration = (end.getTime() - start.getTime()) / 1000;

    return {
      run_id: runId,
      started_at: start.toISOString(),
      finished_at: end.toISOString(),
      duration_seconds: duration,
      environment: environmentInfo(),
      before: {
        tests: { passed: false, returnCode: -1, output: '' },
        metrics: {},
      },
      after: {
        tests: { passed: false, returnCode: -1, output: '' },
        metrics: {},
      },
      comparison: {
        passed_gate: false,
        improvement_summary: 'Evaluation crashed',
      },
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function main(): number {
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Run evaluation
  const report = runEvaluation();

  // Derive dated directory structure from the report start time:
  // evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
  const startedAt = new Date(report.started_at);
  const year = startedAt.getFullYear();
  const month = String(startedAt.getMonth() + 1).padStart(2, '0');
  const day = String(startedAt.getDate()).padStart(2, '0');
  const hours = String(startedAt.getHours()).padStart(2, '0');
  const minutes = String(startedAt.getMinutes()).padStart(2, '0');
  const seconds = String(startedAt.getSeconds()).padStart(2, '0');

  const dateDir = path.join(REPORTS_DIR, `${year}-${month}-${day}`);
  const timeDir = path.join(dateDir, `${hours}-${minutes}-${seconds}`);

  if (!fs.existsSync(timeDir)) {
    fs.mkdirSync(timeDir, { recursive: true });
  }

  // Write report to the timestamped report.json path
  const reportPath = path.join(timeDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Evaluation report written to ${reportPath}`);
  console.log(`Success: ${report.success}`);
  console.log(`Before tests passed: ${report.before.tests.passed}`);
  console.log(`After tests passed: ${report.after.tests.passed}`);

  // Return exit code: 0 for success, 1 for failure
  return report.success ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}
