import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const ROOT = path.resolve(__dirname, "..");

interface TestCase {
    nodeid: string;
    name: string;
    outcome: "passed" | "failed" | "skipped" | "error";
}

interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    skipped: number;
}

interface RepositoryResult {
    success: boolean;
    exit_code: number;
    tests: TestCase[];
    summary: TestSummary;
    stdout: string;
    stderr: string;
}

interface ComparisonResult {
    before_tests_passed: boolean;
    after_tests_passed: boolean;
    before_total: number;
    before_passed: number;
    before_failed: number;
    after_total: number;
    after_passed: number;
    after_failed: number;
}

interface StandardReport {
    run_id: string;
    started_at: string;
    finished_at: string;
    duration_seconds: number;
    success: boolean;
    error: string | null;
    environment: {
        node_version: string;
        platform: string;
        os: string;
        os_release: string;
        architecture: string;
        hostname: string;
        git_commit: string;
        git_branch: string;
    };
    results: {
        before: RepositoryResult;
        after: RepositoryResult;
    };
    comparison: ComparisonResult;
}

function runCommand(cmd: string, env: Record<string, string> = {}): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
        exec(cmd, { cwd: ROOT, env: { ...process.env, ...env }, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            resolve({
                stdout,
                stderr,
                code: error ? error.code || 1 : 0
            });
        });
    });
}

async function getGitInfo(): Promise<{ commit: string; branch: string }> {
    try {
        const commitResult = await runCommand("git rev-parse HEAD");
        const branchResult = await runCommand("git rev-parse --abbrev-ref HEAD");
        return {
            commit: commitResult.stdout.trim() || "unknown",
            branch: branchResult.stdout.trim() || "unknown"
        };
    } catch {
        return { commit: "unknown", branch: "unknown" };
    }
}

function parseTestOutput(stdout: string, stderr: string, exitCode: number): RepositoryResult {
    const tests: TestCase[] = [];
    const summary: TestSummary = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: 0,
        skipped: 0
    };

    const combinedOutput = stdout + "\n" + stderr;
    const lines = combinedOutput.split("\n");
    let currentFile = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect file being run
        const fileRunMatch = line.match(/^Running (.+)\.\.\.$/);
        if (fileRunMatch) {
            currentFile = fileRunMatch[1];
        }

        // Match pass: details are usually "✅ [PASS] Test Name"
        const passMatch = line.match(/✅ \[PASS\] (.+)$/);
        if (passMatch) {
            const testName = passMatch[1].trim();
            const nodeid = `tests/${path.basename(currentFile)}::${testName.replace(/\s+/g, "_")}`;
            tests.push({
                nodeid,
                name: testName,
                outcome: "passed"
            });
            summary.passed++;
            summary.total++;
        }

        // Match fail: "❌ [FAIL] Test Name" or "❌ FAILED: filename"
        const failMatch = line.match(/❌ \[FAIL\] (.+)$/);
        if (failMatch) {
            const testName = failMatch[1].trim();
            const nodeid = `tests/${path.basename(currentFile)}::${testName.replace(/\s+/g, "_")}`;
            tests.push({
                nodeid,
                name: testName,
                outcome: "failed"
            });
            summary.failed++;
            summary.total++;
        }

        // Handle compilation errors or crash failures where individual test name might not be printed
        // The runner prints "❌ FAILED: tests/test_..." on exception
        const crashMatch = line.match(/❌ FAILED: (.+)$/);
        if (crashMatch) {
            const failedFile = crashMatch[1].trim();
            // If we haven't already recorded a specific test failure for this file (which we wouldn't if it crashed), add a generic one
            // Or simpler: treat the file itself as the failed test case
            const nodeid = `${failedFile}::compilation_or_runtime_error`;
            tests.push({
                nodeid,
                name: `Global error in ${path.basename(failedFile)}`,
                outcome: "failed"
            });
            summary.failed++;
            summary.total++;
        }
    }

    return {
        success: exitCode === 0,
        exit_code: exitCode,
        tests,
        summary,
        stdout,
        stderr
    };
}

function getTimestampStr() {
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toISOString().split("T")[1].split(".")[0].replace(/:/g, "-"); // HH-MM-SS
    return { date, time, now };
}

async function runTestsForRepo(targetRepo: "repository_before" | "repository_after"): Promise<RepositoryResult> {
    console.log(`Running tests for ${targetRepo}...`);

    let env: Record<string, string> = {};
    if (targetRepo === "repository_before") {
        env = { TS_NODE_PROJECT: "tsconfig.before.json" };
    }

    // Run the custom test runner
    const { code, stdout, stderr } = await runCommand(`npx ts-node tests/run_all.ts`, env);
    console.log(`${targetRepo} finished with code`, code);

    return parseTestOutput(stdout, stderr, code);
}

async function main() {
    const { date, time, now: startedAt } = getTimestampStr();

    // Get git info
    const gitInfo = await getGitInfo();

    // Get OS release info
    let osRelease = os.release();
    try {
        if (os.platform() === "linux") {
            const releaseResult = await runCommand("uname -r");
            osRelease = releaseResult.stdout.trim() || os.release();
        }
    } catch {
        // Fallback to default
    }

    // Run Before
    const beforeResult = await runTestsForRepo("repository_before");

    // Run After
    const afterResult = await runTestsForRepo("repository_after");

    const finishedAt = new Date();
    const durationSeconds = (finishedAt.getTime() - startedAt.getTime()) / 1000;

    // Generate run_id 
    const runId = crypto.randomBytes(4).toString("hex");

    // Build comparison
    const comparison: ComparisonResult = {
        before_tests_passed: beforeResult.success,
        after_tests_passed: afterResult.success,
        before_total: beforeResult.summary.total,
        before_passed: beforeResult.summary.passed,
        before_failed: beforeResult.summary.failed,
        after_total: afterResult.summary.total,
        after_passed: afterResult.summary.passed,
        after_failed: afterResult.summary.failed
    };

    const report: StandardReport = {
        run_id: runId,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_seconds: parseFloat(durationSeconds.toFixed(6)),
        success: afterResult.success,
        error: null,
        environment: {
            node_version: process.version,
            platform: `${os.platform()}-${os.release()}-${os.arch()}`,
            os: os.type(),
            os_release: osRelease,
            architecture: os.arch(),
            hostname: os.hostname(),
            git_commit: gitInfo.commit,
            git_branch: gitInfo.branch
        },
        results: {
            before: beforeResult,
            after: afterResult
        },
        comparison
    };

    const outputDir = path.join(__dirname, date, time);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportPath = path.join(outputDir, "report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report generated at ${reportPath}`);

    process.exit(0);
}

main().catch((err) => {
    console.error("Evaluation script crashed:", err);
    process.exit(1);
});
