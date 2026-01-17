#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

interface GitInfo {
  git_commit: string;
  git_branch: string;
}

interface EnvironmentInfo extends GitInfo {
  node_version: string;
  platform: string;
  os: string;
  os_release: string;
  architecture: string;
  hostname: string;
}

interface TestResult {
  nodeid: string;
  name: string;
  outcome: 'passed' | 'failed';
  message: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
}

interface RepositoryResults {
  success: boolean;
  exit_code: number;
  tests: TestResult[];
  summary: TestSummary;
  error?: string;
}

interface ComparisonResults {
  before_tests_passed: boolean;
  after_tests_passed: boolean;
  before_total: number;
  before_passed: number;
  before_failed: number;
  after_total: number;
  after_passed: number;
  after_failed: number;
}

interface EvaluationReport {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  success: boolean;
  error: string | null;
  environment: EnvironmentInfo;
  results: {
    before: RepositoryResults;
    after: RepositoryResults;
    comparison: ComparisonResults;
  };
}

function generateRunId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getGitInfo(): GitInfo {
  const gitInfo: GitInfo = { git_commit: 'unknown', git_branch: 'unknown' };
  try {
    gitInfo.git_commit = execSync('git rev-parse HEAD', { encoding: 'utf8', timeout: 5000 }).trim().substring(0, 8);
  } catch (err) {}
  try {
    gitInfo.git_branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', timeout: 5000 }).trim();
  } catch (err) {}
  return gitInfo;
}

function getEnvironmentInfo(): EnvironmentInfo {
  const gitInfo = getGitInfo();
  return {
    node_version: process.version,
    platform: os.platform(),
    os: os.type(),
    os_release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
    git_commit: gitInfo.git_commit,
    git_branch: gitInfo.git_branch,
  };
}

function runTests(repositoryPath: string, repositoryName: string): RepositoryResults {
  console.log('\n' + '='.repeat(60));
  console.log(`RUNNING TESTS: ${repositoryName}`);
  console.log('='.repeat(60));

  try {
    const loaderPath = path.resolve(__dirname, '..', 'tests', 'utils', 'loadSource');
    const { SourceLoader } = require(loaderPath);
    const loader = new SourceLoader(repositoryPath);
    
    const testResults: TestResult[] = [];
    let passed = 0;
    let total = 0;

    // Run structural validation tests
    try {
      const vueContent = loader.getSubscriptionVueContent();
      const serviceContent = loader.getPaymentsServiceContent();
      
      // Test 1: Promo code parameter presence
      total++;
      const hasPromoParam = vueContent.includes('promo_code_api_id?: string');
      const shouldHavePromo = repositoryName === 'repository_before';
      const test1Passed = hasPromoParam === shouldHavePromo;
      if (test1Passed) passed++;
      
      testResults.push({
        nodeid: `${repositoryName}::promo_code_parameter`,
        name: 'Promo code parameter validation',
        outcome: test1Passed ? 'passed' : 'failed',
        message: test1Passed ? 'Parameter validation correct' : 'Parameter validation mismatch'
      });

      // Test 2: Stripe promotion codes configuration
      total++;
      const hasAllowPromoCodes = serviceContent.includes('allow_promotion_codes: true');
      const shouldHaveAllowPromo = repositoryName === 'repository_after';
      const test2Passed = hasAllowPromoCodes === shouldHaveAllowPromo;
      if (test2Passed) passed++;
      
      testResults.push({
        nodeid: `${repositoryName}::stripe_promotion_codes`,
        name: 'Stripe promotion codes enabled',
        outcome: test2Passed ? 'passed' : 'failed',
        message: test2Passed ? 'Stripe config correct' : 'Stripe config mismatch'
      });

      // Test 3: Manual discount logic presence
      total++;
      const hasManualDiscounts = serviceContent.includes('sessionConfig.discounts');
      const shouldHaveManual = repositoryName === 'repository_before';
      const test3Passed = hasManualDiscounts === shouldHaveManual;
      if (test3Passed) passed++;
      
      testResults.push({
        nodeid: `${repositoryName}::manual_discount_logic`,
        name: 'Manual discount logic validation',
        outcome: test3Passed ? 'passed' : 'failed',
        message: test3Passed ? 'Manual discount logic correct' : 'Manual discount logic mismatch'
      });

    } catch (err) {
      total++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      testResults.push({
        nodeid: `${repositoryName}::file_loading_error`,
        name: 'File loading test',
        outcome: 'failed',
        message: `Error loading files: ${errorMessage}`
      });
    }

    const success = passed === total;
    
    return {
      success,
      exit_code: success ? 0 : 1,
      tests: testResults,
      summary: {
        total,
        passed,
        failed: total - passed,
        errors: 0,
        skipped: 0,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('\nERROR:', errorMessage);
    return {
      success: false,
      exit_code: 1,
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, errors: 1, skipped: 0 },
      error: errorMessage,
    };
  }
}

function generateOutputPath(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(__dirname, dateStr, timeStr);
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, 'report.json');
}

const runId = generateRunId();
const startedAt = new Date();

console.log('\n' + '='.repeat(60));
console.log('PROMO CODE VALIDATION REFACTOR EVALUATION');
console.log('='.repeat(60));
console.log(`Run ID: ${runId}`);
console.log(`Started at: ${startedAt.toISOString()}`);

const beforeResults = runTests('repository_before', 'repository_before');
const afterResults = runTests('repository_after', 'repository_after');

const finishedAt = new Date();
const duration = (finishedAt.getTime() - startedAt.getTime()) / 1000;

const comparison: ComparisonResults = {
  before_tests_passed: beforeResults.success,
  after_tests_passed: afterResults.success,
  before_total: beforeResults.summary.total,
  before_passed: beforeResults.summary.passed,
  before_failed: beforeResults.summary.failed,
  after_total: afterResults.summary.total,
  after_passed: afterResults.summary.passed,
  after_failed: afterResults.summary.failed,
};

console.log('\n' + '='.repeat(60));
console.log('EVALUATION SUMMARY');
console.log('='.repeat(60));
console.log(`\nBefore Implementation (repository_before):`);
console.log(`  Overall: ${beforeResults.success ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  Tests: ${comparison.before_passed}/${comparison.before_total} passed`);
console.log(`\nAfter Implementation (repository_after):`);
console.log(`  Overall: ${afterResults.success ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  Tests: ${comparison.after_passed}/${comparison.after_total} passed`);

const success = afterResults.success;
const errorMessage = success ? null : 'After implementation tests failed';

const report: EvaluationReport = {
  run_id: runId,
  started_at: startedAt.toISOString(),
  finished_at: finishedAt.toISOString(),
  duration_seconds: parseFloat(duration.toFixed(6)),
  success,
  error: errorMessage,
  environment: getEnvironmentInfo(),
  results: {
    before: beforeResults,
    after: afterResults,
    comparison,
  },
};

const outputPath = generateOutputPath();
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log(`\n✅ Report saved to: ${outputPath}`);
console.log('\n' + '='.repeat(60));
console.log('EVALUATION COMPLETE');
console.log('='.repeat(60));
console.log(`Duration: ${duration.toFixed(2)}s`);
console.log(`Success: ${success ? '✅ YES' : '❌ NO'}`);

process.exit(success ? 0 : 1);