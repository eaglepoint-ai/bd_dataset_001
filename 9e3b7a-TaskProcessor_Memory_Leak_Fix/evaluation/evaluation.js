/**
 * Evaluation script for TaskProcessor Memory Leak Fix
 * Runs tests on repository_before and repository_after and generates comparison reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseJestOutput(output) {
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: {}
  };

  const lines = output.split('\n');
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

  // If no total found, calculate from passed + failed
  if (!results.total) {
    results.total = results.passed + results.failed;
  }

  // Mark tests
  for (let i = 0; i < results.passed; i++) {
    results.tests[`test_passed_${i}`] = 'PASSED';
  }
  for (let i = 0; i < results.failed; i++) {
    results.tests[`test_failed_${i}`] = 'FAILED';
  }

  return results;
}

function runTests(repoPath) {
  const repoName = path.basename(repoPath);
  let output = '';
  
  try {
    output = execSync(
      'npx jest tests/ --verbose --forceExit 2>&1',
      {
        encoding: 'utf-8',
        timeout: 60000,
        env: { ...process.env, REPO: repoName }
      }
    );

    return parseJestOutput(output);

  } catch (error) {
    output = error.stdout ? error.stdout.toString() : '';
    if (!output && error.stderr) {
      output = error.stderr.toString();
    }
    if (!output && error.output) {
      output = error.output.join('');
    }

    const results = parseJestOutput(output);
    
    if (!results.total) {
      results.error = 'Could not parse test results';
    }
    
    return results;
  }
}

function generateReport(beforeResults, afterResults, outputPath) {
  const started_at = new Date();
  
  const report = {
    run_id: require('crypto').randomUUID(),
    started_at: started_at.toISOString(),
    finished_at: new Date().toISOString(),
    duration_seconds: (new Date() - started_at) / 1000,
    environment: {
      node_version: process.version,
      platform: `${process.platform}-${process.arch}`
    },
    before: {
      tests: beforeResults.tests,
      metrics: {
        total: beforeResults.total,
        passed: beforeResults.passed,
        failed: beforeResults.failed
      },
      error: beforeResults.error
    },
    after: {
      tests: afterResults.tests,
      metrics: {
        total: afterResults.total,
        passed: afterResults.passed,
        failed: afterResults.failed
      },
      error: afterResults.error
    },
    comparison: {
      tests_fixed: [],
      tests_broken: [],
      improvement: 0
    },
    success: false,
    error: null
  };

  // Calculate comparison
  const beforeTests = new Set(Object.keys(beforeResults.tests));
  const afterTests = new Set(Object.keys(afterResults.tests));

  afterTests.forEach(test => {
    const beforeStatus = beforeResults.tests[test] || 'FAILED';
    const afterStatus = afterResults.tests[test] || 'FAILED';

    if (beforeStatus === 'FAILED' && afterStatus === 'PASSED') {
      report.comparison.tests_fixed.push(test);
    } else if (beforeStatus === 'PASSED' && afterStatus === 'FAILED') {
      report.comparison.tests_broken.push(test);
    }
  });

  // Calculate improvement
  if (afterResults.total > 0) {
    const beforeRate = (beforeResults.passed / Math.max(beforeResults.total, 1)) * 100;
    const afterRate = (afterResults.passed / afterResults.total) * 100;
    report.comparison.improvement = Math.round((afterRate - beforeRate) * 100) / 100;
  }

  // Determine success
  report.success = (
    afterResults.passed === afterResults.total &&
    afterResults.total > 0 &&
    !afterResults.error
  );

  // Update duration
  report.finished_at = new Date().toISOString();
  report.duration_seconds = (new Date() - started_at) / 1000;

  // Save report
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  return report;
}

function main() {
  const runId = Math.random().toString(36).substring(2, 10);
  const startedAt = new Date();

  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startedAt.toISOString()}`);
  console.log(`\n${'='.repeat(60)}`);
  console.log('TASKPROCESSOR MEMORY LEAK FIX EVALUATION');
  console.log('='.repeat(60));

  const projectRoot = path.join(__dirname, '..');
  const repoBefore = path.join(projectRoot, 'repository_before');
  const repoAfter = path.join(projectRoot, 'repository_after');

  // Run tests on repository_before
  console.log(`\n${'='.repeat(60)}`);
  console.log('RUNNING TESTS: BEFORE (REPOSITORY_BEFORE)');
  console.log('='.repeat(60));
  console.log('Repository: repository_before\n');
  const beforeResults = runTests(repoBefore);
  console.log(`\nResults: ${beforeResults.passed} passed, ${beforeResults.failed} failed (total: ${beforeResults.total})`);
  if (beforeResults.error) {
    console.log(`Error: ${beforeResults.error}`);
  }

  // Run tests on repository_after
  console.log(`\n${'='.repeat(60)}`);
  console.log('RUNNING TESTS: AFTER (REPOSITORY_AFTER)');
  console.log('='.repeat(60));
  console.log('Repository: repository_after\n');
  const afterResults = runTests(repoAfter);
  console.log(`\nResults: ${afterResults.passed} passed, ${afterResults.failed} failed (total: ${afterResults.total})`);
  if (afterResults.error) {
    console.log(`Error: ${afterResults.error}`);
  }

  // Create output directory with timestamp
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(projectRoot, 'evaluation', dateStr, timeStr);
  const outputFile = path.join(outputDir, 'report.json');

  // Generate report
  const report = generateReport(beforeResults, afterResults, outputFile);

  console.log(`\n${'='.repeat(60)}`);
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nBefore Implementation (repository_before):`);
  console.log(`  Overall: ${beforeResults.error ? '❌ ERROR' : beforeResults.failed > 0 ? '❌ FAILED' : '✅ PASSED'}`);
  console.log(`  Tests: ${beforeResults.passed}/${beforeResults.total} passed`);

  console.log(`\nAfter Implementation (repository_after):`);
  console.log(`  Overall: ${afterResults.error ? '❌ ERROR' : afterResults.failed === 0 && afterResults.total > 0 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Tests: ${afterResults.passed}/${afterResults.total} passed`);

  console.log(`\nMemory Leaks Fixed: ${report.comparison.tests_fixed.length}`);
  console.log(`Improvement: ${report.comparison.improvement}%`);
  console.log(`Overall Success: ${report.success ? '✅ PASSED' : '❌ FAILED'}`);

  console.log(`\n✅ Report saved to: ${outputFile}`);

  process.exit(report.success ? 0 : 1);
}

main();
