#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPO_BEFORE = path.join(__dirname, "../repository_before");
const REPO_AFTER = path.join(__dirname, "../repository_after");

function runTests(repoPath, repoName) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running tests on ${repoName}`);
  console.log("=".repeat(60));

  let output = "";
  let passed = 0;
  let failed = 0;
  let total = 0;

  try {
    const env = { ...process.env, TEST_REPO_PATH: repoPath };
    output = execSync("npm test 2>&1", {
      cwd: path.join(__dirname, "../tests"),
      env,
      encoding: "utf8",
      shell: "/bin/bash",
    });
  } catch (error) {
    output = error.stdout || error.stderr || error.message || "";
  }

  console.log(output);

  const fullMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (fullMatch) {
    failed = parseInt(fullMatch[1], 10);
    passed = parseInt(fullMatch[2], 10);
    total = parseInt(fullMatch[3], 10);
  } else {
    const passedMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (passedMatch) {
      passed = parseInt(passedMatch[1], 10);
      total = parseInt(passedMatch[2], 10);
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

function analyzeRepo(repoPath) {
  const metrics = {
    logger_bytes: 0,
    logger_lines: 0,
    has_nested_sanitize: false,
  };

  const loggerPath = path.join(repoPath, "logger.js");
  if (!fs.existsSync(loggerPath)) return metrics;

  const src = fs.readFileSync(loggerPath, "utf8");
  metrics.logger_bytes = Buffer.byteLength(src, "utf8");
  metrics.logger_lines = src.split("\n").length;
  metrics.has_nested_sanitize = src.includes("function sanitize");

  return metrics;
}

function generateReport(beforeResults, afterResults, beforeMetrics, afterMetrics) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");

  const reportDir = path.join(__dirname, "reports", dateStr, timeStr);
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
      nested_sanitize_removed: beforeMetrics.has_nested_sanitize && !afterMetrics.has_nested_sanitize,
      logger_lines_delta: beforeMetrics.logger_lines - afterMetrics.logger_lines,
    },
    success: !beforeResults.success && afterResults.success,
  };

  const reportPath = path.join(reportDir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Stable artifact locations
  const reportsRoot = path.join(__dirname, "reports");
  fs.mkdirSync(reportsRoot, { recursive: true });

  const stableReportPath = path.join(reportsRoot, "report.json");
  fs.writeFileSync(stableReportPath, JSON.stringify(report, null, 2));

  const rootReportPath = path.join(__dirname, "..", "report.json");
  fs.writeFileSync(rootReportPath, JSON.stringify(report, null, 2));

  const latestPath = path.join(reportsRoot, "latest.json");
  fs.writeFileSync(
    latestPath,
    JSON.stringify(
      {
        run_id: report.run_id,
        started_at: report.started_at,
        finished_at: report.finished_at,
        report_path: path.relative(path.join(__dirname, ".."), reportPath),
      },
      null,
      2
    )
  );

  return { report, reportPath, stableReportPath, rootReportPath };
}

function main() {
  console.log("=".repeat(60));
  console.log("Telemetry Logger Refactor Evaluation");
  console.log("=".repeat(60));

  console.log("\n[1/5] Analyzing repository_before...");
  const beforeMetrics = analyzeRepo(REPO_BEFORE);
  console.log(`  - logger.js lines: ${beforeMetrics.logger_lines}`);
  console.log(`  - has nested sanitize(): ${beforeMetrics.has_nested_sanitize}`);

  console.log("\n[2/5] Analyzing repository_after...");
  const afterMetrics = analyzeRepo(REPO_AFTER);
  console.log(`  - logger.js lines: ${afterMetrics.logger_lines}`);
  console.log(`  - has nested sanitize(): ${afterMetrics.has_nested_sanitize}`);

  console.log("\n[3/5] Running tests on repository_before (expected to FAIL)...");
  const beforeResults = runTests(REPO_BEFORE, "repository_before");

  console.log("\n[4/5] Running tests on repository_after (expected to PASS)...");
  const afterResults = runTests(REPO_AFTER, "repository_after");

  console.log("\n[5/5] Generating report...");
  const { report, reportPath, stableReportPath, rootReportPath } = generateReport(
    beforeResults,
    afterResults,
    beforeMetrics,
    afterMetrics
  );

  console.log("\n" + "=".repeat(60));
  console.log("Evaluation Complete");
  console.log("=".repeat(60));
  console.log(`\nOverall Success: ${report.success}`);
  console.log(`\nReport saved to: ${reportPath}`);
  console.log(`Stable report saved to: ${stableReportPath}`);
  console.log(`Root report saved to: ${rootReportPath}`);

  process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { runTests, analyzeRepo, generateReport };
