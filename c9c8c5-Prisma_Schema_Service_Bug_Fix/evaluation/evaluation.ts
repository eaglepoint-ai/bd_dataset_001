#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO_BEFORE = path.join(__dirname, '../repository_before');
const REPO_AFTER = path.join(__dirname, '../repository_after');

interface TestResults {
  success: boolean;
  passed: number;
  failed: number;
  total: number;
  output: string;
}

interface Metrics {
  has_threading_support: boolean;
  has_parent_id_field: boolean;
  has_parent_relation: boolean;
  has_replies_relation: boolean;
  has_parent_id_index: boolean;
  has_cascade_delete: boolean;
  has_reply_to_message: boolean;
  has_get_replies: boolean;
  has_get_reply_count: boolean;
  has_get_messages_with_reply_count: boolean;
  has_db_text_annotation: boolean;
  has_default_false: boolean;
  has_conversation_cascade: boolean;
  has_indexes: boolean;
}

function runTests(repoPath: string, repoName: string): TestResults {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running tests on ${repoName}`);
  console.log('='.repeat(60));

  let output = '';
  let passed = 0;
  let failed = 0;
  let total = 0;

  try {
    const env = { ...process.env, TEST_REPO_PATH: repoPath };

    output = execSync('npm test 2>&1', {
      cwd: path.join(__dirname, '../tests'),
      env: env,
      encoding: 'utf8',
      shell: '/bin/bash',
    });
  } catch (error: any) {
    output = error.stdout || error.stderr || error.message || '';
  }

  console.log(output);

  // Parse results
  const fullMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (fullMatch) {
    failed = parseInt(fullMatch[1]);
    passed = parseInt(fullMatch[2]);
    total = parseInt(fullMatch[3]);
  } else {
    const passedMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (passedMatch) {
      passed = parseInt(passedMatch[1]);
      total = parseInt(passedMatch[2]);
      failed = 0;
    }
  }

  console.log(`\nParsed results: ${passed} passed, ${failed} failed, ${total} total`);

  return {
    success: failed === 0 && passed > 0,
    passed,
    failed,
    total,
    output,
  };
}

function analyzeRepository(repoPath: string): Metrics {
  const metrics: Metrics = {
    has_threading_support: false,
    has_parent_id_field: false,
    has_parent_relation: false,
    has_replies_relation: false,
    has_parent_id_index: false,
    has_cascade_delete: false,
    has_reply_to_message: false,
    has_get_replies: false,
    has_get_reply_count: false,
    has_get_messages_with_reply_count: false,
    has_db_text_annotation: false,
    has_default_false: false,
    has_conversation_cascade: false,
    has_indexes: false,
  };

  // Check schema
  const schemaPath = path.join(repoPath, 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    metrics.has_parent_id_field = /parentId\s+String\?/.test(schemaContent);
    metrics.has_parent_relation = /parent\s+Message\?/.test(schemaContent);
    metrics.has_replies_relation = /replies\s+Message\[\]/.test(schemaContent);
    metrics.has_parent_id_index = /@@index\(\[parentId\]\)/.test(schemaContent);
    metrics.has_cascade_delete = /onDelete:\s*Cascade/.test(schemaContent);
    metrics.has_db_text_annotation = /@db\.Text/.test(schemaContent);
    metrics.has_default_false = /@default\(false\)/.test(schemaContent);
    metrics.has_conversation_cascade = /conversation.*onDelete:\s*Cascade/s.test(schemaContent);
    metrics.has_indexes = /@@index\(\[conversationId\]\)/.test(schemaContent);

    metrics.has_threading_support =
      metrics.has_parent_id_field &&
      metrics.has_parent_relation &&
      metrics.has_replies_relation;
  }

  // Check service
  const servicePath = path.join(repoPath, 'chatService.ts');
  if (fs.existsSync(servicePath)) {
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    metrics.has_reply_to_message = /async\s+replyToMessage/.test(serviceContent);
    metrics.has_get_replies = /async\s+getReplies/.test(serviceContent);
    metrics.has_get_reply_count = /async\s+getReplyCount/.test(serviceContent);
    metrics.has_get_messages_with_reply_count = /async\s+getMessagesWithReplyCount/.test(serviceContent);
  }

  return metrics;
}

function generateReport(
  beforeResults: TestResults,
  afterResults: TestResults,
  beforeMetrics: Metrics,
  afterMetrics: Metrics
) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

  const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);
  fs.mkdirSync(reportDir, { recursive: true });

  const report = {
    run_id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    started_at: now.toISOString(),
    finished_at: new Date().toISOString(),
    environment: {
      node_version: process.version,
      platform: `${process.platform}-${process.arch}`,
    },
    before: {
      metrics: beforeMetrics,
      tests: {
        passed: beforeResults.passed,
        failed: beforeResults.failed,
        total: beforeResults.total,
        success: beforeResults.success,
      },
    },
    after: {
      metrics: afterMetrics,
      tests: {
        passed: afterResults.passed,
        failed: afterResults.failed,
        total: afterResults.total,
        success: afterResults.success,
      },
    },
    comparison: {
      threading_support_added: !beforeMetrics.has_threading_support && afterMetrics.has_threading_support,
      methods_implemented: [
        afterMetrics.has_reply_to_message && 'replyToMessage',
        afterMetrics.has_get_replies && 'getReplies',
        afterMetrics.has_get_reply_count && 'getReplyCount',
        afterMetrics.has_get_messages_with_reply_count && 'getMessagesWithReplyCount',
      ].filter(Boolean).length,
      schema_fixes_applied: afterMetrics.has_db_text_annotation && afterMetrics.has_cascade_delete,
      tests_fixed: afterResults.passed - beforeResults.passed,
    },
    success: !beforeResults.success && afterResults.success,
  };

  const reportPath = path.join(reportDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return { report, reportPath };
}

function main() {
  console.log('='.repeat(60));
  console.log('Prisma Schema & Service Bug Fix Evaluation');
  console.log('='.repeat(60));

  // Analyze repositories
  console.log('\n[1/5] Analyzing repository_before...');
  const beforeMetrics = analyzeRepository(REPO_BEFORE);
  console.log(`  - Threading support: ${beforeMetrics.has_threading_support}`);
  console.log(`  - replyToMessage method: ${beforeMetrics.has_reply_to_message}`);
  console.log(`  - getReplies method: ${beforeMetrics.has_get_replies}`);
  console.log(`  - getReplyCount method: ${beforeMetrics.has_get_reply_count}`);
  console.log(`  - getMessagesWithReplyCount method: ${beforeMetrics.has_get_messages_with_reply_count}`);

  console.log('\n[2/5] Analyzing repository_after...');
  const afterMetrics = analyzeRepository(REPO_AFTER);
  console.log(`  - Threading support: ${afterMetrics.has_threading_support}`);
  console.log(`  - parentId field: ${afterMetrics.has_parent_id_field}`);
  console.log(`  - parent relation: ${afterMetrics.has_parent_relation}`);
  console.log(`  - replies relation: ${afterMetrics.has_replies_relation}`);
  console.log(`  - parentId index: ${afterMetrics.has_parent_id_index}`);
  console.log(`  - cascade delete: ${afterMetrics.has_cascade_delete}`);
  console.log(`  - replyToMessage method: ${afterMetrics.has_reply_to_message}`);
  console.log(`  - getReplies method: ${afterMetrics.has_get_replies}`);
  console.log(`  - getReplyCount method: ${afterMetrics.has_get_reply_count}`);
  console.log(`  - getMessagesWithReplyCount method: ${afterMetrics.has_get_messages_with_reply_count}`);

  // Run tests
  console.log('\n[3/5] Running tests on repository_before (expected to FAIL)...');
  const beforeResults = runTests(REPO_BEFORE, 'repository_before');
  console.log(`  ✗ Passed: ${beforeResults.passed}`);
  console.log(`  ✗ Failed: ${beforeResults.failed}`);
  console.log(`  ✗ Total: ${beforeResults.total}`);
  console.log(`  ✗ Success: ${beforeResults.success}`);

  console.log('\n[4/5] Running tests on repository_after (expected to PASS)...');
  const afterResults = runTests(REPO_AFTER, 'repository_after');
  console.log(`  ✓ Passed: ${afterResults.passed}`);
  console.log(`  ✓ Failed: ${afterResults.failed}`);
  console.log(`  ✓ Total: ${afterResults.total}`);
  console.log(`  ✓ Success: ${afterResults.success}`);

  // Generate report
  console.log('\n[5/5] Generating report...');
  const { report, reportPath } = generateReport(beforeResults, afterResults, beforeMetrics, afterMetrics);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Evaluation Complete');
  console.log('='.repeat(60));
  console.log(`\nOverall Success: ${report.success}`);
  console.log(`\nBefore (Buggy):`);
  console.log(`  - Tests Passed: ${beforeResults.passed}/${beforeResults.total}`);
  console.log(`  - Tests Failed: ${beforeResults.failed}/${beforeResults.total}`);
  console.log(`  - Threading Support: ${beforeMetrics.has_threading_support}`);
  console.log(`\nAfter (Fixed):`);
  console.log(`  - Tests Passed: ${afterResults.passed}/${afterResults.total}`);
  console.log(`  - Tests Failed: ${afterResults.failed}/${afterResults.total}`);
  console.log(`  - Threading Support: ${afterMetrics.has_threading_support}`);
  console.log(`\nImprovements:`);
  console.log(`  - Threading support added: ${report.comparison.threading_support_added}`);
  console.log(`  - Methods implemented: ${report.comparison.methods_implemented}`);
  console.log(`  - Schema fixes applied: ${report.comparison.schema_fixes_applied}`);
  console.log(`  - Tests fixed: ${report.comparison.tests_fixed}`);
  console.log(`\nReport saved to: ${reportPath}`);

  process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { runTests, analyzeRepository, generateReport };
