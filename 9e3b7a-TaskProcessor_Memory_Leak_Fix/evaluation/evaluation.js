/**
 * Evaluation script for TaskProcessor Memory Leak Fix
 * Runs tests on repository_before and repository_after and generates comparison reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runTests(repoPath) {
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: {},
    error: null
  };

  // Check if repository has implementation
  const taskProcessorPath = path.join(repoPath, 'TaskProcessor.js');
  if (!fs.existsSync(taskProcessorPath)) {
    results.error = 'No implementation found';
    return results;
  }

  const repoName = path.basename(repoPath);
  const outputFile = path.join(__dirname, `${repoName}-results.json`);

  try {
    // Run jest with output to file
    execSync(
      `npm test -- --json --outputFile=${outputFile} --forceExit`,
      {
        encoding: 'utf-8',
        timeout: 30000,
        env: { ...process.env, REPO: repoName },
        shell: true
      }
    );

    // Read results from file
    if (fs.existsSync(outputFile)) {
      const jsonOutput = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      
      results.total = jsonOutput.numTotalTests || 0;
      results.passed = jsonOutput.numPassedTests || 0;
      results.failed = jsonOutput.numFailedTests || 0;

      // Parse individual test results
      if (jsonOutput.testResults) {
        jsonOutput.testResults.forEach(fileResult => {
          fileResult.assertionResults?.forEach(test => {
            results.tests[test.fullName || test.title] = test.status === 'passed' ? 'PASSED' : 'FAILED';
          });
        });
      }

      // Clean up
      fs.unlinkSync(outputFile);
    }

  } catch (error) {
    // Tests may fail but we still want to capture results from file
    try {
      if (fs.existsSync(outputFile)) {
        const jsonOutput = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        results.total = jsonOutput.numTotalTests || 0;
        results.passed = jsonOutput.numPassedTests || 0;
        results.failed = jsonOutput.numFailedTests || 0;

        if (jsonOutput.testResults) {
          jsonOutput.testResults.forEach(fileResult => {
            fileResult.assertionResults?.forEach(test => {
              results.tests[test.fullName || test.title] = test.status === 'passed' ? 'PASSED' : 'FAILED';
            });
          });
        }

        // Clean up
        fs.unlinkSync(outputFile);
      } else {
        results.error = 'Test output file not created';
      }
    } catch (parseError) {
      results.error = error.message;
    }
  }

  return results;
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
    afterResults.error === null
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
  console.log('='.repeat(60));
  console.log('TaskProcessor Memory Leak Fix Evaluation');
  console.log('='.repeat(60));

  const projectRoot = path.join(__dirname, '..');
  const repoBefore = path.join(projectRoot, 'repository_before');
  const repoAfter = path.join(projectRoot, 'repository_after');

  // Create output directory with timestamp
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(projectRoot, 'evaluation', dateStr, timeStr);
  const outputFile = path.join(outputDir, 'report.json');

  console.log(`\n📁 Project Root: ${projectRoot}`);
  console.log(`📄 Output: ${outputFile}\n`);

  // Run tests on repository_before
  console.log('🔍 Evaluating repository_before (with memory leaks)...');
  const beforeResults = runTests(repoBefore);
  console.log(`   ✓ Passed: ${beforeResults.passed}`);
  console.log(`   ✗ Failed: ${beforeResults.failed}`);
  if (beforeResults.error) {
    console.log(`   ⚠ Error: ${beforeResults.error}`);
  }

  // Run tests on repository_after
  console.log('\n🔍 Evaluating repository_after (leaks fixed)...');
  const afterResults = runTests(repoAfter);
  console.log(`   ✓ Passed: ${afterResults.passed}`);
  console.log(`   ✗ Failed: ${afterResults.failed}`);
  if (afterResults.error) {
    console.log(`   ⚠ Error: ${afterResults.error}`);
  }

  // Generate report
  console.log('\n📊 Generating report...');
  const report = generateReport(beforeResults, afterResults, outputFile);

  console.log(`   Report saved to: ${outputFile}`);
  console.log(`\n${'='.repeat(60)}`);
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Memory Leaks Fixed: ${report.comparison.tests_fixed.length}`);
  if (report.comparison.tests_fixed.length > 0) {
    report.comparison.tests_fixed.forEach(test => {
      console.log(`  ✓ ${test}`);
    });
  }

  console.log(`\nTests Broken: ${report.comparison.tests_broken.length}`);
  if (report.comparison.tests_broken.length > 0) {
    report.comparison.tests_broken.forEach(test => {
      console.log(`  ✗ ${test}`);
    });
  }

  console.log(`\nImprovement: ${report.comparison.improvement}%`);
  console.log(`Overall Success: ${report.success ? '✓ PASS' : '✗ FAIL'}`);
  console.log('='.repeat(60));

  process.exit(report.success ? 0 : 1);
}

main();
