const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');
const { randomUUID } = require('crypto');

/**
 * @param {string} s
 * @param {number} maxLen
 * @returns {{text: string, truncated: boolean, originalLength: number}}
 */
function truncate(s, maxLen) {
  const text = typeof s === 'string' ? s : '';
  if (text.length <= maxLen) return { text, truncated: false, originalLength: text.length };
  return { text: text.slice(0, maxLen) + '\n...[truncated]...\n', truncated: true, originalLength: text.length };
}

/**
 * @param {"before"|"after"} mode
 * @param {string} testsPath
 */
function runTests(mode, testsPath, cwd, timeoutMs = 20000) {
  const started = Date.now();
  process.stdout.write(`\n[eval] Starting ${mode} tests...\n`);

  let result;
  try {
    result = spawnSync(process.execPath, [testsPath, mode], {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      cwd,
    });
  } catch (err) {
    const finished = Date.now();
    const stdout = truncate('', 20000);
    const stderr = truncate(String(err), 20000);
    return {
      mode,
      command: `${process.execPath} ${testsPath} ${mode}`,
      started_at_ms: started,
      finished_at_ms: finished,
      duration_ms: finished - started,
      return_code: -1,
      passed: false,
      output: stdout.text + stderr.text,
      stdout,
      stderr,
      error: String(err),
    };
  }

  const finished = Date.now();
  const stdout = truncate(result.stdout || '', 20000);
  const stderr = truncate(result.stderr || '', 20000);

  const returnCode = typeof result.status === 'number' ? result.status : -1;
  const errorMsg = result.error ? String(result.error) : result.signal ? `terminated by signal ${result.signal}` : null;

  return {
    mode,
    command: `${process.execPath} ${testsPath} ${mode}`,
    started_at_ms: started,
    finished_at_ms: finished,
    duration_ms: finished - started,
    return_code: returnCode,
    passed: returnCode === 0,
    output: stdout.text + stderr.text,
    stdout,
    stderr,
    error: errorMsg,
  };
}

function main() {
  const root = path.join(__dirname, '..');
  const testsPath = path.join(root, 'tests', 'test.js');
  const reportsDir = path.join(__dirname, 'reports');
  const reportPath = path.join(reportsDir, 'latest.json');

  fs.mkdirSync(reportsDir, { recursive: true });

  const runId = randomUUID();
  const start = new Date();
  let before = null;
  let after = null;

  try {
    before = runTests('before', testsPath, root);
    after = runTests('after', testsPath, root);
  } catch (err) {
    // Should not reach here because runTests handles errors, but keep defensive
    after = after || {
      passed: false,
      return_code: -1,
      output: '',
      stdout: { text: '', truncated: false, originalLength: 0 },
      stderr: { text: String(err), truncated: false, originalLength: String(err).length },
    };
    before = before || {
      passed: false,
      return_code: -1,
      output: '',
      stdout: { text: '', truncated: false, originalLength: 0 },
      stderr: { text: String(err), truncated: false, originalLength: String(err).length },
    };
  }

  const end = new Date();

  // Print the real outputs (not rewritten)
  process.stdout.write(`\n=== BEFORE stdout ===\n${before.stdout.text}\n`);
  process.stderr.write(`\n=== BEFORE stderr ===\n${before.stderr.text}\n`);
  process.stdout.write(`\n=== AFTER stdout ===\n${after.stdout.text}\n`);
  process.stderr.write(`\n=== AFTER stderr ===\n${after.stderr.text}\n`);

  const report = {
    run_id: runId,
    started_at: start.toISOString(),
    finished_at: end.toISOString(),
    duration_seconds: (end.getTime() - start.getTime()) / 1000,
    environment: {
      node_version: process.version,
      platform: `${process.platform}-${os.arch()}`,
      cwd: process.cwd(),
    },
    before: {
      tests: {
        passed: before.passed,
        return_code: before.return_code,
        output: truncate(before.output, 8000).text,
      },
      metrics: {},
    },
    after: {
      tests: {
        passed: after.passed,
        return_code: after.return_code,
        output: truncate(after.output, 8000).text,
      },
      metrics: {},
    },
    comparison: {
      passed_gate: after.passed,
      improvement_summary: after.passed
        ? 'After implementation passed acceptance tests'
        : 'After implementation failed acceptance tests',
    },
    success: after.passed,
    error: after.passed ? null : (after.error || 'after tests failed'),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`\nReport written to: ${reportPath}\n`);

  process.exit(after.passed ? 0 : 1);
}

main();
