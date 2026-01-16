const { execSync } = require('child_process');
const path = require('path');

const repo = process.env.REPO || 'repository_after';
const projectRoot = path.join(__dirname, '..');

console.log(`\n Starting Tests for: ${repo}`);
console.log(` Path: /app/${repo}\n`);

const env = { ...process.env, REPO: repo, CI: 'true' };

// Run the manual test runner
let success = false;
let results = null;

try {
  const stdout = execSync('node tests/run-tests.js', {
    env,
    encoding: 'utf-8',
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const jsonStart = stdout.indexOf('{');
  if (jsonStart !== -1) {
    results = JSON.parse(stdout.substring(jsonStart));
    success = true;
  }
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : '';
  const jsonStart = out.indexOf('{');
  if (jsonStart !== -1) {
    try {
      results = JSON.parse(out.substring(jsonStart));
      success = true;
    } catch {}
  }
}

if (success && results && results.testResults && results.testResults[0]) {
  const testResult = results.testResults[0];
  const tests = testResult.assertionResults || [];
  
  // Print each test result
  tests.forEach(test => {
    const status = test.status === 'passed' ? '[PASS]' : '[FAIL]';
    const title = test.title;
    console.log(`running '${title}' ... ${status} ${title}`);
  });
  
  // Print summary
  const passed = results.numPassedTests || 0;
  const failed = results.numFailedTests || 0;
  const total = results.numTotalTests || 0;
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  tests.forEach((test, idx) => {
    const status = test.status === 'passed' ? '✓' : '✗';
    console.log(` ${status} [${idx + 1}/${total}] ${test.title}`);
  });
  
  console.log('-'.repeat(50));
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(50));
  console.log('');
} else {
  // Fallback output
  console.log('running \'Requirement 1: Endpoint registration stores URL and secret key for HMAC signing\' ... [FAIL]');
  console.log('running \'Requirement 2: Event submission queues delivery to the registered endpoint\' ... [FAIL]');
  console.log('running \'Requirement 3: HTTP POST delivery includes required headers\' ... [FAIL]');
  console.log('running \'Requirement 4: Retry failed deliveries with exponential backoff delays\' ... [FAIL]');
  console.log('running \'Requirement 5: Maximum 5 retry attempts per event\' ... [FAIL]');
  console.log('running \'Requirement 6: Move events to dead letter store after max attempts exceeded\' ... [FAIL]');
  console.log('running \'Requirement 7: Individual delivery timeout: 30 seconds\' ... [FAIL]');
  console.log('running \'Requirement 8: Preserve event ordering per endpoint\' ... [FAIL]');
  console.log('running \'Requirement 9: Events to different endpoints may deliver in parallel\' ... [FAIL]');
  console.log('running \'Requirement 10: Handle graceful shutdown\' ... [FAIL]');
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(' ✗ [1/10] Requirement 1: Endpoint registration stores URL and secret key for HMAC signing');
  console.log(' ✗ [2/10] Requirement 2: Event submission queues delivery to the registered endpoint');
  console.log(' ✗ [3/10] Requirement 3: HTTP POST delivery includes required headers');
  console.log(' ✗ [4/10] Requirement 4: Retry failed deliveries with exponential backoff delays');
  console.log(' ✗ [5/10] Requirement 5: Maximum 5 retry attempts per event');
  console.log(' ✗ [6/10] Requirement 6: Move events to dead letter store after max attempts exceeded');
  console.log(' ✗ [7/10] Requirement 7: Individual delivery timeout: 30 seconds');
  console.log(' ✗ [8/10] Requirement 8: Preserve event ordering per endpoint');
  console.log(' ✗ [9/10] Requirement 9: Events to different endpoints may deliver in parallel');
  console.log(' ✗ [10/10] Requirement 10: Handle graceful shutdown');
  console.log('-'.repeat(50));
  console.log('Total: 10 | Passed: 0 | Failed: 10');
  console.log('Success Rate: 0.0%');
  console.log('='.repeat(50));
  console.log('');
}
