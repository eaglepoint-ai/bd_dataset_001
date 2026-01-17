#!/usr/bin/env node

/**
 * Evaluation runner for Order Service Refactor.
 * Clean version: No git errors, no real-time log clutter.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const os = require("os");
const crypto = require("crypto");

// --- CONFIGURATION ---
const ROOT_DIR = path.resolve(__dirname, "..");
const TEST_SUITE_PATH = path.join(ROOT_DIR, "tests", "test-suite.js");

const TARGETS = {
  before: {
    path: path.join("..", "repository_before", "order.service.js"),
    label: "Before (Unoptimized)",
  },
  after: {
    path: path.join("..", "repository_after", "order.service.js"),
    label: "After (Optimized)",
  },
};

// --- HELPER FUNCTIONS ---

function generateRunId() {
  return crypto.randomBytes(4).toString("hex");
}

function getGitInfo() {
  const info = { commit: "unknown", branch: "unknown" };
  try {
    // FIX: added { stdio: 'pipe' } to prevent "/bin/sh: git: not found" from printing
    info.commit = require("child_process")
      .execSync("git rev-parse HEAD", { timeout: 1000, stdio: "pipe" })
      .toString()
      .trim()
      .substring(0, 8);
    info.branch = require("child_process")
      .execSync("git rev-parse --abbrev-ref HEAD", {
        timeout: 1000,
        stdio: "pipe",
      })
      .toString()
      .trim();
  } catch (e) {
    // Git not available, ignore silently
  }
  return info;
}

function getEnvironmentInfo() {
  const git = getGitInfo();
  return {
    node_version: process.version,
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    git_commit: git.commit,
    git_branch: git.branch,
  };
}

/**
 * Runs the test suite against a specific target file
 */
function runTestSuite(targetLabel, targetPathRelative) {
  return new Promise((resolve) => {
    // We remove the console logs here to keep the output clean
    // console.log(`Running: ${targetLabel}...`);

    const startTime = Date.now();

    const env = { ...process.env, TEST_TARGET: targetPathRelative };

    const child = spawn("node", [TEST_SUITE_PATH], {
      cwd: ROOT_DIR,
      env: env,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const str = data.toString();
      stdout += str;
      // FIX: Removed process.stdout.write(str) so logs don't clutter the screen
    });

    child.stderr.on("data", (data) => {
      const str = data.toString();
      stderr += str;
      // FIX: Removed process.stderr.write(str)
    });

    child.on("close", (code) => {
      const duration = (Date.now() - startTime) / 1000;
      const results = parseTestOutput(stdout);

      resolve({
        success: code === 0,
        exit_code: code,
        duration_seconds: duration,
        results: results,
        raw_output: stdout,
        raw_error: stderr,
      });
    });
  });
}

function parseTestOutput(output) {
  const tests = [];
  const lines = output.split("\n");
  const testLineRegex = /^(.*?)\s\.\.\.\s(✅ PASS|❌ FAIL)/;
  const summaryRegex = /TEST SUMMARY: (\d+)\/(\d+) Passed/;

  let totalParsed = 0;
  let passedParsed = 0;

  for (const line of lines) {
    const match = line.match(testLineRegex);
    if (match) {
      tests.push({
        name: match[1].trim(),
        outcome: match[2].includes("PASS") ? "passed" : "failed",
      });
    }

    const sumMatch = line.match(summaryRegex);
    if (sumMatch) {
      passedParsed = parseInt(sumMatch[1], 10);
      totalParsed = parseInt(sumMatch[2], 10);
    }
  }

  return {
    tests,
    summary: {
      total: totalParsed,
      passed: passedParsed,
      failed: totalParsed - passedParsed,
    },
  };
}

function generateReportPath() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");

  const reportDir = path.join(ROOT_DIR, "evaluation");
  fs.mkdirSync(reportDir, { recursive: true });

  return path.join(reportDir, "report.json");
}

// --- MAIN EXECUTION ---

async function main() {
  const runId = generateRunId();
  const startedAt = new Date();

  try {
    const beforeResult = await runTestSuite(
      TARGETS.before.label,
      TARGETS.before.path
    );
    const afterResult = await runTestSuite(
      TARGETS.after.label,
      TARGETS.after.path
    );

    const finishedAt = new Date();

    const comparison = {
      before_success: beforeResult.success,
      after_success: afterResult.success,
      before_score: `${beforeResult.results.summary.passed}/${beforeResult.results.summary.total}`,
      after_score: `${afterResult.results.summary.passed}/${afterResult.results.summary.total}`,
      performance_impact: {
        before_duration: beforeResult.duration_seconds,
        after_duration: afterResult.duration_seconds,
        diff: (
          afterResult.duration_seconds - beforeResult.duration_seconds
        ).toFixed(3),
      },
    };

    const report = {
      run_id: runId,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      environment: getEnvironmentInfo(),
      comparison: comparison,
      details: {
        before: beforeResult,
        after: afterResult,
      },
    };

    const reportPath = generateReportPath();
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\n✅ Evaluation Completed successfully!");
    console.log(`\n📄 Report saved to: ${reportPath}`);

    process.exit(afterResult.success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ CRITICAL ERROR:", error);
    process.exit(1);
  }
}

main();
