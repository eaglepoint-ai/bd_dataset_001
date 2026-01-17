// evaluation/evaluation.js

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');
const { randomUUID } = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'evaluation', 'reports');

function environmentInfo() {
  return {
    node_version: process.version,
    platform: os.platform() + '-' + os.arch(),
  };
}

function parseTestOutput(output) {
  // Parse Jest output summary
  const lines = output.split('\n');
  let total = 0, passed = 0, failed = 0, errors = 0, skipped = 0;
  const tests = [];

  // Parse summary line: "Tests:       17 passed, 17 total"
  for (const line of lines) {
    const jestSummary = line.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (jestSummary) {
      total = parseInt(jestSummary[2], 10);
      passed = parseInt(jestSummary[1], 10);
      break;
    }
  }

  // Parse test suite results: "PASS  tests/debounce_search.test.js"
  for (const line of lines) {
    const fileMatch = line.match(/(PASS|FAIL)\s+([^ ]+)/);
    if (fileMatch) {
      const [, outcome, file] = fileMatch;
      tests.push({
        nodeid: file,
        name: file,
        outcome: outcome === 'PASS' ? 'passed' : 'failed',
        test_count: 1, // Placeholder, since Jest doesn't list count here
      });
    }
  }

  // If no per-file lines, but we have a total, add a single summary test
  if (tests.length === 0 && total > 0) {
    tests.push({
      nodeid: 'all',
      name: 'all tests',
      outcome: passed === total ? 'passed' : 'failed',
      test_count: total,
    });
  }

  // Try to parse failed/skipped if present
  for (const line of lines) {
    const failMatch = line.match(/Tests\s+\d+ passed.*(\d+) failed/);
    if (failMatch) {
      failed = parseInt(failMatch[1], 10);
    }
    const skipMatch = line.match(/Tests\s+\d+ passed.*(\d+) skipped/);
    if (skipMatch) {
      skipped = parseInt(skipMatch[1], 10);
    }
  }

  return {
    tests,
    summary: {
      total,
      passed,
      failed,
      errors,
      skipped,
    },
  };
}

function runTests() {
  console.log('Running tests...');

  try {
    // Run tests and capture output to a temporary file
    const tempFile = path.join(ROOT, 'temp_test_output.txt');
    execSync('npm test > temp_test_output.txt 2>&1', {
      cwd: ROOT
    });

    // Read and display the captured output
    const output = fs.readFileSync(tempFile, 'utf8');
    console.log('Test Results:');
    console.log(output);

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log('Tests completed successfully.');
    const parsed = parseTestOutput(output);
    return {
      success: parsed.summary.failed === 0,
      exit_code: 0,
      tests: parsed.tests,
      summary: parsed.summary,
      stdout: output.slice(0, 8000),
      stderr: '',
    };
  } catch (error) {
    console.log('Tests failed or errored.');
    console.log('Error:', error.message);

    // Try to read and display temp file even if command failed
    const tempFile = path.join(ROOT, 'temp_test_output.txt');
    let output = '';
    try {
      output = fs.readFileSync(tempFile, 'utf8');
      console.log('Test Results:');
      console.log(output);
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore
    }

    const parsed = parseTestOutput(output);
    return {
      success: false,
      exit_code: error.status || 1,
      tests: parsed.tests,
      summary: parsed.summary,
      stdout: output.slice(0, 8000),
      stderr: error.stderr || '',
    };
  }
}

function runMetrics() {
  // Optional: implement if needed
  return {};
}

function evaluate() {
  const tests = runTests();
  const metrics = runMetrics();
  return { ...tests, metrics };
}

function run_evaluation() {
  const run_id = randomUUID();
  const start = new Date();
  const after = evaluate();
  const before = { ...after }; // Since before and after are the same
  const comparison = {
    before_tests_passed: before.success,
    after_tests_passed: after.success,
    before_total: before.summary.total,
    before_passed: before.summary.passed,
    before_failed: before.summary.failed,
    after_total: after.summary.total,
    after_passed: after.summary.passed,
    after_failed: after.summary.failed,
  };
  const end = new Date();
  return {
    run_id,
    started_at: start.toISOString(),
    finished_at: end.toISOString(),
    duration_seconds: (end - start) / 1000,
    success: after.success,
    error: null,
    environment: environmentInfo(),
    results: {
      before: before,
      after: after,
      comparison: comparison,
    },
  };
}

module.exports = { run_evaluation };

function main() {
  const now = new Date();
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
  const baseReports = path.join(ROOT, 'evaluation', 'reports');
  const folder = path.join(baseReports, day, time);

  const report = run_evaluation();

  try {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    if (!fs.existsSync(baseReports)) {
      fs.mkdirSync(baseReports, { recursive: true });
    }
    const reportPath = path.join(folder, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report written to ${reportPath}`);
  } catch (error) {
    console.log(`Could not write report file (this is normal in some Docker environments): ${error.message}`);
    console.log('Test results are still valid - only the report file could not be saved.');
  }

  // Print evaluation summary
  console.log('============================================================');
  console.log('EVALUATION COMPLETE');
  console.log('============================================================');
  console.log(`Run ID: ${report.run_id}`);
  console.log(`Duration: ${report.duration_seconds.toFixed(2)}s`);
  console.log(`Success: ${report.success ? '✅ YES' : '❌ NO'}`);

  return report.success ? 0 : 1;
}

// Check if the current module is the main module
if (require.main === module) {
  main();
}