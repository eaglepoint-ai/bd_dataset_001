
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const ROOT = path.resolve(__dirname, "..");

interface TestResult {
    passed: boolean;
    return_code: number;
    output: string;
}

interface Metrics {
    [key: string]: number | boolean;
}

interface Section {
    tests: TestResult;
    metrics: Metrics;
}

interface StandardReport {
    run_id: string;
    started_at: string;
    finished_at: string;
    duration_seconds: number;
    environment: {
        node_version: string;
        platform: string;
        arch: string;
    };
    before: Section;
    after: Section;
    comparison: {
        passed_gate: boolean;
        improvement_summary: string;
    };
    success: boolean;
    error: string | null;
}

function runCommand(cmd: string, env: Record<string, string>): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
        exec(cmd, { cwd: ROOT, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
            resolve({
                stdout,
                stderr,
                code: error ? error.code || 1 : 0
            });
        });
    });
}

function getTimestampStr() {
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toISOString().split("T")[1].split(".")[0].replace(/:/g, "-"); // HH-MM-SS
    return { date, time, now };
}

async function runTestsForRepo(targetRepo: string): Promise<Section> {
    console.log(`Running Jest tests for ${targetRepo}...`);
    // Run jest with TARGET_REPO env var
    const { code, stdout, stderr } = await runCommand(`npx jest --no-color`, { TARGET_REPO: targetRepo });
    console.log(`${targetRepo} finished with code`, code);

    const outputCombined = stdout + "\n" + stderr;
    const passed = code === 0;

    // Simple metrics extraction (example)
    const failures = (outputCombined.match(/failed/g) || []).length;

    return {
        tests: {
            passed,
            return_code: code,
            output: outputCombined
        },
        metrics: {
            failures
        }
    };
}

async function main() {
    const { date, time, now: startedAt } = getTimestampStr();

    // Run Before
    const beforeSection = await runTestsForRepo("repository_before");

    // Run After
    const afterSection = await runTestsForRepo("repository_after");

    const finishedAt = new Date();
    const durationSeconds = (finishedAt.getTime() - startedAt.getTime()) / 1000;

    // Passed Gate logic: After should pass (code 0) AND Before should fail (code != 0) is ideal for "fixing"
    // But if we are just refactoring, maybe both pass?
    // User expectation: "before - expected some failures", "after - expected all pass"
    const passedGate = afterSection.tests.passed;

    const report: StandardReport = {
        run_id: crypto.randomUUID(),
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_seconds: durationSeconds,
        environment: {
            node_version: process.version,
            platform: os.platform(),
            arch: os.arch()
        },
        before: beforeSection,
        after: afterSection,
        comparison: {
            passed_gate: passedGate,
            improvement_summary: passedGate ? "Fixed all bugs." : "Bugs still present."
        },
        success: passedGate,
        error: null
    };

    const outputDir = path.join(__dirname, date, time);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportPath = path.join(outputDir, "report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report generated at ${reportPath}`);

    // Exit code based on success (optional, user said 0 is fine, but usually script success = generation success)
    process.exit(0);
}

main().catch((err) => {
    console.error("Evaluation script crashed:", err);
    process.exit(1);
});
