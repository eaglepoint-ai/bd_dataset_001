const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const os = require("os");
const crypto = require("crypto");

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

function generateRunId() {
  return crypto.randomBytes(4).toString("hex");
}

function getGitInfo() {
  const info = { commit: "unknown", branch: "unknown" };
  try {
    info.commit = require("child_process")
      .execSync("git rev-parse HEAD", { timeout: 1000 })
      .toString()
      .trim()
      .substring(0, 8);
    info.branch = require("child_process")
      .execSync("git rev-parse --abbrev-ref HEAD", { timeout: 1000 })
      .toString()
      .trim();
  } catch (e) {}
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
    console.log(`\n${"=".repeat(60)}`);
    console.log(`RUNNING TESTS: ${targetLabel.toUpperCase()}`);
    console.log(`${"=".repeat(60)}`);

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
      process.stdout.write(str);
    });

    child.stderr.on("data", (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(str);
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

/**
 * Parses the console output from test-suite.js to extract metrics
 */
function parseTestOutput(output) {
  const tests = [];
  const lines = output.split("\n");

  const testLineRegex = /^(.*?)\s\.\.\.\s(✅ PASS|❌ FAIL)/;

  // Regex for summary: "TEST SUMMARY: 5/6 Passed"
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
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

  const reportDir = path.join(
    ROOT_DIR,
    "evaluation",
    "reports",
    dateStr,
    timeStr
  );
  fs.mkdirSync(reportDir, { recursive: true });

  return path.join(reportDir, "report.json");
}

// --- MAIN EXECUTION ---

async function main() {
  const runId = generateRunId();
  const startedAt = new Date();

  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startedAt.toISOString()}`);

  try {
    // 1. Run "Before"
    const beforeResult = await runTestSuite(
      TARGETS.before.label,
      TARGETS.before.path
    );

    // 2. Run "After"
    const afterResult = await runTestSuite(
      TARGETS.after.label,
      TARGETS.after.path
    );

    const finishedAt = new Date();

    // 3. Build Comparison Data
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

    // 4. Construct Final Report
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

    // 5. Save JSON
    const reportPath = generateReportPath();
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 6. Print Final Summary to Console
    console.log(`\n${"=".repeat(60)}`);
    console.log(`EVALUATION COMPLETE`);
    console.log(`${"=".repeat(60)}`);

    console.log(`\nBefore Implementation:`);
    console.log(
      `  Status:   ${beforeResult.success ? "✅ PASSED" : "❌ FAILED"}`
    );
    console.log(`  Score:    ${comparison.before_score}`);
    console.log(`  Duration: ${beforeResult.duration_seconds.toFixed(3)}s`);

    console.log(`\nAfter Implementation:`);
    console.log(
      `  Status:   ${afterResult.success ? "✅ PASSED" : "❌ FAILED"}`
    );
    console.log(`  Score:    ${comparison.after_score}`);
    console.log(`  Duration: ${afterResult.duration_seconds.toFixed(3)}s`);

    console.log(`\nReport saved to: ${reportPath}`);

    // Exit code depends on "After" succeeding
    process.exit(afterResult.success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ CRITICAL ERROR:", error);
    process.exit(1);
  }
}

main();
