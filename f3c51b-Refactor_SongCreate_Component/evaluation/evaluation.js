#!/usr/bin/env node
/**
 * Evaluation runner for Song Create Component Refactor.
 *
 * This evaluation script:
 * - Runs vitest tests
 * - Collects passed/failed status
 * - Generates structured reports with environment metadata
 *
 * Run with:
 *    bun run evaluation/evaluation.js
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const os = require("os");

// Simple UUID generator fallback
function generateRunId() {
  try {
    const { v4: uuidv4 } = require("uuid");
    return uuidv4().substring(0, 8);
  } catch (e) {
    return Math.random().toString(36).substring(2, 10);
  }
}

function getGitInfo() {
  const gitInfo = { git_commit: "unknown", git_branch: "unknown" };
  try {
    gitInfo.git_commit = execSync("git rev-parse HEAD", { timeout: 5000 })
      .toString()
      .trim()
      .substring(0, 8);
  } catch (e) {}

  try {
    gitInfo.git_branch = execSync("git rev-parse --abbrev-ref HEAD", {
      timeout: 5000,
    })
      .toString()
      .trim();
  } catch (e) {}

  return gitInfo;
}

function getEnvironmentInfo() {
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

async function runCommand(cmd, args, cwd = undefined) {
  return new Promise((resolve, reject) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`RUNNING COMMAND: ${cmd} ${args.join(" ")}`);
    console.log(`${"=".repeat(60)}`);

    const spawnOptions = { shell: true };
    if (cwd) {
      spawnOptions.cwd = cwd;
    }
    const child = spawn(cmd, args, spawnOptions);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      process.stdout.write(data);
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(data);
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

function parseVitestJsonOutput(stdout) {
  try {
    const lines = stdout.split("\n");
    const cleanLines = lines.map((line) => {
      const content = line.replace(/^[^|]+\|\s/, "");
      return content.replace(/\u001b\[\d+m/g, "");
    });

    const fullText = cleanLines.join("\n");
    const jsonStartIndex = fullText.indexOf("{");
    const jsonEndIndex = fullText.lastIndexOf("}");

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("No JSON output found");
    }

    const jsonStr = fullText.substring(jsonStartIndex, jsonEndIndex + 1);
    const result = JSON.parse(jsonStr);

    const tests = [];
    let passedCount = 0;

    if (result.testResults) {
      result.testResults.forEach((fileResult) => {
        fileResult.assertionResults.forEach((assertion) => {
          tests.push({
            nodeid: `${fileResult.name}::${assertion.fullName}`,
            name: assertion.title,
            outcome: assertion.status, // "passed" or "failed"
          });
          if (assertion.status === "passed") passedCount++;
        });
      });
    }

    return {
      unit_tests_passed: passedCount === tests.length && tests.length > 0,
      tests: tests,
      total: tests.length,
      passed: passedCount,
      failed: tests.length - passedCount,
      full_json: result,
    };
  } catch (e) {
    console.log("Could not parse JSON output:", e.message);
    return null;
  }
}

function generateOutputPath() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now
    .toISOString()
    .split("T")[1]
    .split(".")[0]
    .replace(/:/g, "-");

  let outputDir;
  if (process.env.RUNNING_IN_DOCKER) {
    outputDir = path.join("/app/evaluation", dateStr, timeStr);
  } else {
    const projectRoot = path.resolve(__dirname, "..");
    outputDir = path.join(projectRoot, "evaluation", dateStr, timeStr);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return path.join(outputDir, "report.json");
}

async function main() {
  const runId = generateRunId();
  const startedAt = new Date();

  console.log(`Run ID: ${runId}`);
  console.log(`Started at: ${startedAt.toISOString()}`);

  const projectRoot = path.resolve(__dirname, "..");

  let cmd, args, cwd;

  if (process.env.RUNNING_IN_DOCKER) {
    // When running inside Docker, use simple commands without paths.
    // The working directory is set by WORKDIR in Dockerfile.
    cmd = "bun";
    args = ["x", "vitest", "run", "--reporter=json"];
    cwd = undefined; // Rely on Dockerfile's WORKDIR
  } else {
    // When running locally, use docker-compose
    cmd = "docker-compose";
    args = [
      "run",
      "--rm",
      "tests",
      "bun",
      "x",
      "vitest",
      "run",
      "--reporter=json",
    ];
    cwd = projectRoot;
  }

  let success = false;
  let error_message = null;
  let unitTestResults = null;

  try {
    const result = await runCommand(cmd, args, cwd);
    const parsed = parseVitestJsonOutput(result.stdout);

    unitTestResults = parsed;
    success = result.code === 0 && parsed && parsed.unit_tests_passed;

    if (!success) {
      error_message = "Tests failed or output could not be parsed";
    }
  } catch (e) {
    console.error(`\nERROR: ${e.message}`);
    success = false;
    error_message = e.message;
  }

  const finishedAt = new Date();
  const duration = (finishedAt - startedAt) / 1000;

  const report = {
    run_id: runId,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_seconds: duration,
    success: success,
    error: error_message,
    environment: getEnvironmentInfo(),
    results: {
      unit_tests: {
        success: success,
        exit_code: success ? 0 : 1,
        tests: unitTestResults ? unitTestResults.tests : [],
        summary: {
          total: unitTestResults ? unitTestResults.total : 0,
          passed: unitTestResults ? unitTestResults.passed : 0,
          failed: unitTestResults ? unitTestResults.failed : 0,
          errors: 0,
          skipped: 0,
        },
        stdout: unitTestResults
          ? JSON.stringify(unitTestResults.full_json, null, 2)
          : "",
        stderr: "",
      },
    },
  };

  const outputPath = generateOutputPath();
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Report saved to: ${outputPath}`);
  console.log(`\n${"=".repeat(60)}`);
  console.log("EVALUATION COMPLETE");
  console.log(`${"=".repeat(60)}`);
  console.log(`Run ID: ${runId}`);
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Success: ${success ? "✅ YES" : "❌ NO"}`);

  process.exit(success ? 0 : 1);
}

main();
