const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TASK_ID = "9e3b7a";
const TASK_NAME = "TaskProcessor Memory Leak Fix";

function parseJestOutput(output) {
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: []
  };

  const lines = output.split('\n');
  
  // Extract individual tests - look for common Jest output patterns
  for (const line of lines) {
    const trimmed = line.trim();
    // Debug: log lines that might be tests
    if (trimmed.length > 0 && !trimmed.startsWith('PASS') && !trimmed.startsWith('FAIL') && !trimmed.includes('Tests:')) {
      // console.log('DEBUG LINE:', JSON.stringify(line));
    }
    // Match lines starting with checkmark or X, or containing PASSED/FAILED labels
    // Jest output usually has ✓ (0x2713) or ✕ (0x2715) or [PASS]/[FAIL]
    if (/[✓✕]/.test(trimmed) || /\[PASS\]|\[FAIL\]/.test(trimmed) || /√|×/.test(trimmed)) {
      const outcome = (trimmed.includes('✓') || trimmed.includes('[PASS]') || trimmed.includes('√')) ? 'passed' : 'failed';
      // Remove the icon and timing like (100 ms)
      let name = trimmed.replace(/^[✓✕√×\[\]PASSFAIL\s]+/, '').replace(/\s*\(\d+\s*ms\)$/, '').trim();
      results.tests.push({
        name,
        outcome
      });
    }
  }

  // Parse summary counts
  let summaryLine = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('Tests:')) {
      summaryLine = lines[i];
      break;
    }
  }

  if (summaryLine) {
    const passMatch = summaryLine.match(/(\d+)\s+passed/);
    const failMatch = summaryLine.match(/(\d+)\s+failed/);
    const totalMatch = summaryLine.match(/(\d+)\s+total/);
    
    if (passMatch) results.passed = parseInt(passMatch[1]);
    if (failMatch) results.failed = parseInt(failMatch[1]);
    if (totalMatch) results.total = parseInt(totalMatch[1]);
  }

  if (!results.total && results.tests.length > 0) {
    results.total = results.tests.length;
    results.passed = results.tests.filter(t => t.outcome === 'passed').length;
    results.failed = results.tests.filter(t => t.outcome === 'failed').length;
  }

  return results;
}

function runTests(repoPath, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Repository: ${path.basename(repoPath)}`);

  const repoName = path.basename(repoPath);
  let output = '';
  let exitCode = 0;
  
  try {
    output = execSync(
      'npx jest tests/ --verbose --forceExit 2>&1',
      {
        encoding: 'utf-8',
        timeout: 60000,
        env: { ...process.env, REPO: repoName, CI: 'true' }
      }
    );
  } catch (error) {
    output = error.stdout ? error.stdout.toString() : '';
    if (!output && error.stderr) {
      output = error.stderr.toString();
    }
    if (!output && error.output) {
      output = error.output.join('');
    }
    exitCode = error.status || 1;
  }

  const results = parseJestOutput(output);
  results.success = exitCode === 0;

  console.log(`\nResults: ${results.passed} passed, ${results.failed} failed (total: ${results.total})`);
  
  results.tests.forEach(test => {
    const icon = test.outcome === 'passed' ? '✅' : '❌';
    console.log(`  ${icon} ${test.name}`);
  });

  return results;
}

function getEnvironmentInfo() {
  return {
    node_version: process.version,
    platform: os.platform(),
    os_release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
  };
}

function main() {
  const runId = Math.random().toString(36).substring(2, 10);
  const startedAt = new Date();

  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startedAt.toISOString()}`);
  console.log(`\n${'='.repeat(60)}`);
  console.log(TASK_NAME.toUpperCase());
  console.log('='.repeat(60));

  const projectRoot = path.join(__dirname, '..');
  const repoBefore = path.join(projectRoot, 'repository_before');
  const repoAfter = path.join(projectRoot, 'repository_after');

  const beforeResults = runTests(repoBefore, 'before (repository_before)');
  const afterResults = runTests(repoAfter, 'after (repository_after)');

  const comparison = {
    before_tests_passed: beforeResults.success,
    after_tests_passed: afterResults.success,
    before_passed: beforeResults.passed,
    before_failed: beforeResults.failed,
    after_passed: afterResults.passed,
    after_failed: afterResults.failed,
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nBefore Implementation (repository_before):`);
  console.log(`  Overall: ${beforeResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Tests: ${beforeResults.passed}/${beforeResults.total} passed`);

  console.log(`\nAfter Implementation (repository_after):`);
  console.log(`  Overall: ${afterResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Tests: ${afterResults.passed}/${afterResults.total} passed`);

  // Overall success depends on after passing and before showing expected failures
  const overallSuccess = afterResults.success && !beforeResults.success;

  const report = {
    run_id: runId,
    task_id: TASK_ID,
    task_name: TASK_NAME,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    success: overallSuccess,
    error: overallSuccess ? null : "Verification failed: repository_after must pass and repository_before should fail",
    environment: getEnvironmentInfo(),
    results: {
      before: beforeResults,
      after: afterResults,
      comparison
    }
  };

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const timestampDir = path.join(projectRoot, 'evaluation', dateStr, timeStr);
  
  // Create timestamp directory
  if (!fs.existsSync(timestampDir)) {
    fs.mkdirSync(timestampDir, { recursive: true });
  }

  // Handle command line output argument like the template
  const outputFile = process.argv[2] && process.argv[2].startsWith('--output=') 
    ? path.resolve(process.argv[2].split('=')[1])
    : path.join(projectRoot, 'report.json');

  // Save to the specified output file (usually root report.json)
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  
  // Also save to timestamped directory for history
  const historyFile = path.join(timestampDir, 'report.json');
  fs.writeFileSync(historyFile, JSON.stringify(report, null, 2));

  console.log(`\n✅ Report saved to: ${outputFile}`);
  console.log(`✅ History report saved to: ${historyFile}`);

  process.exit(overallSuccess ? 0 : 1);
}

main();

