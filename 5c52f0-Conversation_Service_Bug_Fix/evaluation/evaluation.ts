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

function parseJestOutput(stdout: string, stderr: string, exitCode: number, jestJson?: any): RepositoryResult {
    const tests: TestCase[] = [];
    const summary: TestSummary = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: 0,
        skipped: 0
    };

    // If we have Jest JSON output we parse it here
    if (jestJson && jestJson.testResults) {
        for (const testFile of jestJson.testResults) {
            const filePath = testFile.name || "";
            const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || filePath;

            for (const testResult of testFile.assertionResults || []) {
                const testName = testResult.fullName || testResult.title || "";
                let outcome: "passed" | "failed" | "skipped" | "error" = "passed";

                if (testResult.status === "passed") outcome = "passed";
                else if (testResult.status === "failed") outcome = "failed";
                else if (testResult.status === "skipped" || testResult.status === "pending") outcome = "skipped";
                else outcome = "error";

                tests.push({
                    nodeid: `${fileName}::${testName.replace(/\s+/g, "_")}`,
                    name: testName,
                    outcome
                });

                if (outcome === "passed") summary.passed++;
                else if (outcome === "failed") summary.failed++;
                else if (outcome === "skipped") summary.skipped++;
                else summary.errors++;
                summary.total++;
            }
        }

        // Use Jest summary if available
        if (jestJson.numTotalTests !== undefined) {
            summary.total = jestJson.numTotalTests;
            summary.passed = jestJson.numPassedTests || 0;
            summary.failed = jestJson.numFailedTests || 0;
            summary.skipped = jestJson.numPendingTests || 0;
            summary.errors = (jestJson.numTotalTests - summary.passed - summary.failed - summary.skipped) || 0;
        }
    } else {
        // Check both stdout and stderr since Jest writes to stderr
        const combinedOutput = stdout + "\n" + stderr;
        const lines = combinedOutput.split("\n");
        let currentFile = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];


            const fileMatch = line.match(/^(PASS|FAIL)\s+(.+\.test\.ts)/);
            if (fileMatch) {
                currentFile = fileMatch[2];
            }


            const testMatch = line.match(/^\s+[✓✕]\s+(.+?)(?:\s+\(\d+\s*(?:ms|s)\))?$/);
            if (testMatch && currentFile) {
                const testName = testMatch[1].trim();
                const outcome = line.includes("✓") ? "passed" : "failed";
                const nodeid = `${currentFile}::${testName.replace(/\s+/g, "_")}`;

                tests.push({
                    nodeid,
                    name: testName,
                    outcome
                });

                if (outcome === "passed") summary.passed++;
                else if (outcome === "failed") summary.failed++;
                summary.total++;
            }
        }

        // Parse summary lines from combined output
        const testMatch = combinedOutput.match(/Tests:\s+(?:(\d+)\s+failed,\s*)?(?:(\d+)\s+passed,\s*)?(?:(\d+)\s+skipped,\s*)?(\d+)\s+total/);

        if (testMatch) {
            const failed = parseInt(testMatch[1] || "0");
            const passed = parseInt(testMatch[2] || "0");
            const skipped = parseInt(testMatch[3] || "0");
            const total = parseInt(testMatch[4] || "0");
            summary.total = total;
            summary.passed = passed;
            summary.failed = failed;
            summary.skipped = skipped;
        }

        // Check for test suite failures 
        const suiteFailures = (combinedOutput.match(/● Test suite failed to run/g) || []).length;
        if (suiteFailures > 0 && summary.errors === 0) {
            summary.errors = suiteFailures;
            // If we have suite failures but no test counts, the errors are the total
            if (summary.total === 0) {
                summary.total = summary.errors;
            }
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

async function runTestsForRepo(targetRepo: string): Promise<RepositoryResult> {
    console.log(`Running Jest tests for ${targetRepo}...`);


    // Run with --json to get structured test results
    const jsonResult = await runCommand(`npx jest --json --no-color --runInBand`, { TARGET_REPO: targetRepo });


    const { code, stdout, stderr } = await runCommand(`npx jest --verbose --no-color --runInBand`, { TARGET_REPO: targetRepo });
    console.log(`${targetRepo} finished with code`, code);

    // Parse JSON output for test details check both stdout and stderr
    let jestJson: any = null;
    try {
        // Jest writes JSON to stdout on success, stderr on failure
        const jsonOutput = jsonResult.stdout || jsonResult.stderr;
        jestJson = JSON.parse(jsonOutput);
    } catch {
        // If JSON parsing fails, we'll rely on text parsing
    }

    return parseJestOutput(stdout, stderr, code, jestJson);
}

async function main() {
    const { date, time, now: startedAt } = getTimestampStr();

    // Ensure Prisma Client is generated before running any tests
    console.log("Generating Prisma Client...");
    await runCommand("npx prisma generate --schema=repository_after/prisma/schema.prisma");

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
