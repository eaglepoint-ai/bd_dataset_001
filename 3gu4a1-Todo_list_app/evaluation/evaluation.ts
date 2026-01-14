import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
}

interface TestRunResult {
  success: boolean;
  exitCode: number;
  summary: TestSummary;
  stdout: string;
  stderr: string;
}

interface EvaluationReport {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  success: boolean;
  error: string | null;
  environment: Record<string, string>;
  results: {
    before: TestRunResult;
    after: TestRunResult;
  };
}

function generateRunId(): string {
  return Math.random().toString(16).slice(2, 10);
}

function getGitInfo() {
  const info = { git_commit: "unknown", git_branch: "unknown" };

  try {
    info.git_commit = execSync("git rev-parse HEAD")
      .toString()
      .trim()
      .slice(0, 8);
  } catch {}

  try {
    info.git_branch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();
  } catch {}

  return info;
}

function getEnvironmentInfo() {
  const git = getGitInfo();

  return {
    node_version: process.version,
    platform: os.platform(),
    os_release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
    git_commit: git.git_commit,
    git_branch: git.git_branch,
  };
}

function runTests(label: string): TestRunResult {
  try {
    const stdout = execSync("npm test", {
      stdio: "pipe",
      encoding: "utf-8",
    });

    return {
      success: true,
      exitCode: 0,
      summary: {
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        errors: 0,
      },
      stdout,
      stderr: "",
    };
  } catch (error: any) {
    return {
      success: false,
      exitCode: error.status ?? 1,
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        errors: 0,
      },
      stdout: error.stdout?.toString() ?? "",
      stderr: error.stderr?.toString() ?? "",
    };
  }
}

function generateOutputPath(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");

  return path.join(
    process.cwd(),
    "evaluation",
    "report",
    date,
    time,
    "report.json"
  );
}

function main(): number {
  const runId = generateRunId();
  const startedAt = new Date();

  let beforeResult: TestRunResult;
  let afterResult: TestRunResult;
  let success = false;
  let error: string | null = null;

  try {
    console.log("Running tests: repository_before");
    beforeResult = runTests("before");

    console.log("Running tests: repository_after");
    afterResult = runTests("after");

    success = afterResult.success;
    if (!success) error = "After implementation tests failed";
  } catch (e: any) {
    error = e.message;
    beforeResult = afterResult = {
      success: false,
      exitCode: 1,
      summary: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 1 },
      stdout: "",
      stderr: e.message,
    };
  }

  const finishedAt = new Date();
  const duration =
    (finishedAt.getTime() - startedAt.getTime()) / 1000;

  const report: EvaluationReport = {
    run_id: runId,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_seconds: duration,
    success,
    error,
    environment: getEnvironmentInfo(),
    results: {
      before: beforeResult,
      after: afterResult,
    },
  };

  const outputPath = generateOutputPath();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`✅ Report saved to: ${outputPath}`);
  return success ? 0 : 1;
}

process.exit(main());
