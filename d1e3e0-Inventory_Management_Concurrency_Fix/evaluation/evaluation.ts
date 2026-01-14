
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as os from 'os';
import * as crypto from 'crypto';

// 1. Configuration & Constants
const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(__dirname, 'reports');

// 2. Types matching the Standard Report Structure
interface TestResult {
    passed: boolean;
    return_code: number;
    output: string;
}

interface Metrics {
    [key: string]: number | boolean;
}

interface RepoResult {
    tests: TestResult;
    metrics: Metrics;
}

interface EnvironmentInfo {
    node_version: string;
    platform: string;
    arch: string;
    cpus: number;
}

interface ImprovementComparison {
    passed_gate: boolean;
    improvement_summary: string;
}

interface EvaluationReport {
    run_id: string;
    started_at: string;
    finished_at: string;
    duration_seconds: number;
    environment: EnvironmentInfo;
    before: RepoResult;
    after: RepoResult;
    comparison: ImprovementComparison;
    success: boolean;
    error: string | null;
}

// 3. Helper Functions
function getEnvironmentInfo(): EnvironmentInfo {
    return {
        node_version: process.version,
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
    };
}

function runCommand(command: string, cwd: string, timeoutSec = 120): TestResult {
    try {

        const result = child_process.spawnSync(command, {
            cwd,
            shell: true,
            encoding: 'utf8',
            timeout: timeoutSec * 1000,
        });

        // If an error occurred (like command not found), result.error will be defined
        if (result.error) {
            return {
                passed: false,
                return_code: -1,
                output: `Execution error: ${result.error.message}`
            };
        }

        const output = (result.stdout || '') + (result.stderr || '');
        return {
            passed: result.status === 0,
            return_code: result.status ?? -1,
            output: output.substring(0, 8000), // Truncate to 8000 chars as per standard
        };

    } catch (error: any) {
        return {
            passed: false,
            return_code: -1,
            output: `Unexpected error: ${error.message}`,
        };
    }
}

// 4. Evaluation Logic
function evaluateRepo(stage: 'before' | 'after'): RepoResult {
    // Map stage to the specific npm command we defined
    const npmScript = stage === 'before' ? 'test:before' : 'test:after';
    const command = `npm run ${npmScript}`;

    console.log(`Running inspection for ${stage}: ${command}...`);
    const tests = runCommand(command, ROOT);


    const metrics: Metrics = {};

    return { tests, metrics };
}

function runEvaluation(): EvaluationReport {
    const runId = crypto.randomUUID();
    const start = new Date();

    console.log(`Starting evaluation [${runId}] at ${start.toISOString()}...`);

    // Run Before
    const before = evaluateRepo('before');

    // Run After
    const after = evaluateRepo('after');

    // End timing
    const end = new Date();
    const durationSeconds = (end.getTime() - start.getTime()) / 1000;
    let summary = "After implementation verification passed.";
    if (!before.tests.passed && after.tests.passed) {
        summary = "Confirmed fix: Legacy code failed validation as expected, and Fixed code passed all strict requirements.";
    } else if (before.tests.passed && after.tests.passed) {
        summary = "Warning: Legacy code passed validation (bugs not reproduced), but Fixed code also passed.";
    } else if (!after.tests.passed) {
        summary = "Failure: Fixed code failed validation.";
    }

    const comparison: ImprovementComparison = {
        passed_gate: after.tests.passed,
        improvement_summary: summary
    };

    return {
        run_id: runId,
        started_at: start.toISOString(),
        finished_at: end.toISOString(),
        duration_seconds: durationSeconds,
        environment: getEnvironmentInfo(),
        before,
        after,
        comparison,
        success: comparison.passed_gate,
        error: null,
    };
}

// 5. Main Entrypoint
function main() {
    try {
        // create reports dir
        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }

        const report = runEvaluation();

        const reportPath = path.join(REPORTS_DIR, 'latest.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`Report written to ${reportPath}`);

        // Exit code reflects success
        process.exit(report.success ? 0 : 1);

    } catch (error: any) {
        console.error("Evaluation crashed:", error);
        // Fallback error report
        const crashReport = {
            success: false,
            error: error.message || String(error)
        };
        try {
            if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
            fs.writeFileSync(path.join(REPORTS_DIR, 'latest.json'), JSON.stringify(crashReport, null, 2));
        } catch (e) { /* ignore */ }

        process.exit(1);
    }
}

// Executable check
if (require.main === module) {
    main();
}
