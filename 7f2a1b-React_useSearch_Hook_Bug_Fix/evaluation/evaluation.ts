import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

function generateRunId(): string {
    return Math.random().toString(16).slice(2, 10);
}

function getGitInfo(projectRoot: string) {
    const info = { git_commit: 'unknown', git_branch: 'unknown' };
    try {
        const rev = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8', timeout: 5000 });
        if (rev.status === 0 && rev.stdout) info.git_commit = rev.stdout.trim().slice(0, 8);
    } catch { }
    try {
        const br = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: projectRoot, encoding: 'utf8', timeout: 5000 });
        if (br.status === 0 && br.stdout) info.git_branch = br.stdout.trim();
    } catch { }
    return info;
}

function getEnvironmentInfo(projectRoot: string) {
    const git = getGitInfo(projectRoot);
    return {
        node_version: process.version,
        platform: os.platform(),
        os: os.type(),
        os_release: os.release(),
        architecture: os.arch(),
        hostname: os.hostname(),
        git_commit: git.git_commit,
        git_branch: git.git_branch,
    };
}

function runJestTests(testFile: string, label: string, projectRoot: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`Test File: ${testFile}`);

    const testsPath = path.join(projectRoot, 'tests');
    const configPath = path.join(testsPath, 'jest.config.js');
    const testFilePath = path.join(testsPath, testFile);

    // Verify test file exists
    if (!fs.existsSync(testFilePath)) {
        console.error(`❌ Test file not found: ${testFilePath}`);
        return {
            success: false,
            exit_code: -1,
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, errors: 1, skipped: 0 },
            stdout: '',
            stderr: `Test file not found: ${testFilePath}`,
        };
    }

    try {
        const args = [
            'jest',
            testFile,
            '--config', configPath,
            '--colors',
            '--verbose',
            '--runInBand',
            '--no-coverage'
        ];

        // Run from tests directory
        const res = spawnSync('npx', args, {
            cwd: testsPath,
            env: process.env,
            encoding: 'utf8',
            timeout: 120000
        });

        const stdout = res.stdout || '';
        const stderr = res.stderr || '';
        const out = (stdout + '\n' + stderr).trim();

        let passed = 0, failed = 0, skipped = 0, total = 0;
        const testsLine = out.split('\n').find((l) => l.includes('Tests:')) ?? '';
        if (testsLine) {
            const mPassed = /([0-9]+) passed/.exec(testsLine);
            const mFailed = /([0-9]+) failed/.exec(testsLine);
            const mSkipped = /([0-9]+) skipped/.exec(testsLine);
            const mTotal = /([0-9]+) total/.exec(testsLine);
            passed = mPassed ? parseInt(mPassed[1], 10) : 0;
            failed = mFailed ? parseInt(mFailed[1], 10) : 0;
            skipped = mSkipped ? parseInt(mSkipped[1], 10) : 0;
            total = mTotal ? parseInt(mTotal[1], 10) : passed + failed + skipped;
        }

        console.log(`\nResults: ${passed} passed, ${failed} failed, 0 errors, ${skipped} skipped (total: ${total})`);

        return {
            success: res.status === 0,
            exit_code: res.status ?? -1,
            tests: [],
            summary: { total, passed, failed, errors: 0, skipped },
            stdout: stdout.length > 3000 ? stdout.slice(-3000) : stdout,
            stderr: stderr.length > 1000 ? stderr.slice(-1000) : stderr,
        };
    } catch (e) {
        console.error('Error running jest tests:', e);
        return {
            success: false,
            exit_code: -1,
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, errors: 1, skipped: 0, error: String(e) },
            stdout: '',
            stderr: String(e)
        };
    }
}

function generateOutputPath(projectRoot: string) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const outDir = path.join(projectRoot, 'evaluation', dateStr, timeStr);
    fs.mkdirSync(outDir, { recursive: true });
    return path.join(outDir, 'report.json');
}

function evaluation() {
    console.log('\n' + '='.repeat(60));
    console.log('MECHANICAL REFACTOR EVALUATION');
    console.log('='.repeat(60));

    const projectRoot = path.resolve(process.cwd());

    // Run tests for both versions using separate test files
    const beforeResults = runJestTests('useSearch.before.test.ts', 'before (repository_before)', projectRoot);
    const afterResults = runJestTests('useSearch.after.test.ts', 'after (repository_after)', projectRoot);

    const comparison = {
        before_tests_passed: Boolean(beforeResults.success),
        after_tests_passed: Boolean(afterResults.success),
        before_total: beforeResults.summary?.total ?? 0,
        before_passed: beforeResults.summary?.passed ?? 0,
        before_failed: beforeResults.summary?.failed ?? 0,
        before_skipped: beforeResults.summary?.skipped ?? 0,
        after_total: afterResults.summary?.total ?? 0,
        after_passed: afterResults.summary?.passed ?? 0,
        after_failed: afterResults.summary?.failed ?? 0,
        after_skipped: afterResults.summary?.skipped ?? 0,
    };

    console.log('\n' + '='.repeat(60));
    console.log('EVALUATION SUMMARY');
    console.log('='.repeat(60));

    console.log('\nBefore Implementation (repository_before):');
    console.log(`  Overall: ${beforeResults.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Tests: ${comparison.before_passed}/${comparison.before_total} passed`);
    if (comparison.before_failed > 0) {
        console.log(`  Failed: ${comparison.before_failed}`);
    }
    if (comparison.before_skipped > 0) {
        console.log(`  Skipped: ${comparison.before_skipped}`);
    }

    console.log('\nAfter Implementation (repository_after):');
    console.log(`  Overall: ${afterResults.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Tests: ${comparison.after_passed}/${comparison.after_total} passed`);
    if (comparison.after_failed > 0) {
        console.log(`  Failed: ${comparison.after_failed}`);
    }
    if (comparison.after_skipped > 0) {
        console.log(`  Skipped: ${comparison.after_skipped}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('EXPECTED BEHAVIOR CHECK');
    console.log('='.repeat(60));

    // Check if "after" passed and "before" failed (expected for bug fix)
    if (afterResults.success && !beforeResults.success) {
        console.log('✅ Expected behavior: After implementation passes, before implementation fails');
        console.log('   This confirms the bug fix resolved the issues.');
    } else if (afterResults.success && beforeResults.success) {
        console.log('⚠️  Both implementations pass - bug may not be reproduced by tests');
    } else if (afterResults.success) {
        console.log('✅ After implementation: All tests passed (expected)');
    } else {
        console.log('❌ After implementation: Some tests failed (unexpected - should pass all)');
    }

    // Calculate improvement
    if (comparison.before_total > 0) {
        const beforePassRate = (comparison.before_passed / comparison.before_total) * 100;
        const afterPassRate = (comparison.after_passed / comparison.after_total) * 100;
        const improvement = afterPassRate - beforePassRate;

        console.log('\n' + '='.repeat(60));
        console.log('IMPROVEMENT METRICS');
        console.log('='.repeat(60));
        console.log(`Before: ${beforePassRate.toFixed(1)}% pass rate`);
        console.log(`After:  ${afterPassRate.toFixed(1)}% pass rate`);
        console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
    }

    const startedAt = new Date().toISOString();
    const finishedAt = new Date().toISOString();

    const report = {
        run_id: generateRunId(),
        started_at: startedAt,
        finished_at: finishedAt,
        duration_seconds: 0,
        success: Boolean(afterResults.success),
        error: Boolean(afterResults.success) ? null : 'After implementation tests failed',
        environment: getEnvironmentInfo(projectRoot),
        results: { before: beforeResults, after: afterResults, comparison },
    };

    const outPath = generateOutputPath(projectRoot);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), { encoding: 'utf8' });
    console.log(`\n✅ Report saved to: ${outPath}`);

    return report.success ? 0 : 1;
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
const scriptPath = path.resolve(process.cwd(), 'evaluation', 'evaluation.ts');
if (entryFile && entryFile === scriptPath) {
    const code = evaluation();
    process.exit(code);
}

export { evaluation };
