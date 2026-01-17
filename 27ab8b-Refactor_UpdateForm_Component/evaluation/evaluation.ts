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

function runJestTests(testCommand: string, label: string, projectRoot: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`RUNNING TESTS: ${label.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`Test Command: npm run ${testCommand}`);

    try {
        const res = spawnSync('npm', ['run', testCommand], {
            cwd: projectRoot,
            env: process.env,
            encoding: 'utf8',
            timeout: 180000 // 3 minutes
        });

        const stdout = res.stdout || '';
        const stderr = res.stderr || '';
        const out = (stdout + '\n' + stderr).trim();

        let passed = 0, failed = 0, skipped = 0, total = 0;

        // Parse Jest output
        // Look for "Tests: X passed, X failed, X total" or similar patterns
        const testSummaryMatch = /Tests:\s+(?:(\d+)\s+failed,?\s*)?(?:(\d+)\s+passed,?\s*)?(?:(\d+)\s+skipped,?\s*)?(\d+)\s+total/.exec(out);
        
        if (testSummaryMatch) {
            failed = testSummaryMatch[1] ? parseInt(testSummaryMatch[1], 10) : 0;
            passed = testSummaryMatch[2] ? parseInt(testSummaryMatch[2], 10) : 0;
            skipped = testSummaryMatch[3] ? parseInt(testSummaryMatch[3], 10) : 0;
            total = testSummaryMatch[4] ? parseInt(testSummaryMatch[4], 10) : 0;
        } else {
            // Alternative parsing for different Jest output formats
            const passedMatch = /(\d+)\s+passed/.exec(out);
            const failedMatch = /(\d+)\s+failed/.exec(out);
            const skippedMatch = /(\d+)\s+skipped/.exec(out);
            
            passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
            failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
            skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
            total = passed + failed + skipped;
        }

        // Parse individual test results
        const tests = [];
        const testLines = out.split('\n');

        for (const line of testLines) {
            const isPassed = line.includes('✓') || line.includes('PASS');
            const isFailed = line.includes('✕') || line.includes('FAIL');

            if (isPassed || isFailed) {
                // Extract test name from lines like "✓ TEST_NAME (123ms)" or "✕ TEST_NAME"
                let name = line.trim();
                
                // Remove leading symbols
                name = name.replace(/^[✓✕]\s*/, '');
                
                // Remove timing info
                name = name.replace(/\s*\(\d+\s*m?s\)\s*$/, '');
                
                // Only add if we have a meaningful name
                if (name.length > 0 && !name.startsWith('PASS') && !name.startsWith('FAIL')) {
                    tests.push({
                        name,
                        status: isPassed ? 'passed' : 'failed',
                        duration_ms: 0
                    });
                }
            }
        }

        console.log(`\nResults: ${passed} passed, ${failed} failed, 0 errors, ${skipped} skipped (total: ${total})`);

        return {
            success: res.status === 0,
            exit_code: res.status ?? -1,
            tests,
            summary: { total, passed, failed, errors: 0, skipped },
            stdout: stdout.length > 5000 ? stdout.slice(-5000) : stdout,
            stderr: stderr.length > 2000 ? stderr.slice(-2000) : stderr,
        };
    } catch (e) {
        console.error('Error running Jest tests:', e);
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

function categorizeFailures(tests: any[]) {
    const categories = {
        validation: [] as string[],
        error_handling: [] as string[],
        state_management: [] as string[],
        user_feedback: [] as string[],
        accessibility: [] as string[],
        data_handling: [] as string[],
        lifecycle: [] as string[],
        other: [] as string[]
    };

    for (const test of tests) {
        if (test.status !== 'failed') continue;

        const name = test.name.toLowerCase();
        
        if (name.includes('validate') || name.includes('invalid') || name.includes('empty')) {
            categories.validation.push(test.name);
        } else if (name.includes('error') || name.includes('404') || name.includes('400')) {
            categories.error_handling.push(test.name);
        } else if (name.includes('success message') || name.includes('clear') || name.includes('editing')) {
            categories.state_management.push(test.name);
        } else if (name.includes('loading') || name.includes('disable') || name.includes('button')) {
            categories.user_feedback.push(test.name);
        } else if (name.includes('accessibility') || name.includes('aria') || name.includes('required')) {
            categories.accessibility.push(test.name);
        } else if (name.includes('trim') || name.includes('payload') || name.includes('fields')) {
            categories.data_handling.push(test.name);
        } else if (name.includes('unmount') || name.includes('cancel') || name.includes('abort')) {
            categories.lifecycle.push(test.name);
        } else {
            categories.other.push(test.name);
        }
    }

    return categories;
}

function evaluation() {
    console.log('\n' + '='.repeat(60));
    console.log('SONG UPDATE COMPONENT REFACTORING EVALUATION');
    console.log('='.repeat(60));

    const projectRoot = path.resolve(process.cwd());
    const startTime = Date.now();

    // Run tests for both versions
    const beforeResults = runJestTests('test:before', 'before (repository_before)', projectRoot);
    const afterResults = runJestTests('test:after', 'after (repository_after)', projectRoot);

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;

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
    console.log(`  Overall: ${beforeResults.success ? '⚠️  PASSED (tests document failures)' : '✅ FAILED (expected - shows problems)'}`);
    console.log(`  Tests: ${comparison.before_passed}/${comparison.before_total} passed`);
    if (comparison.before_failed > 0) {
        console.log(`  Failed: ${comparison.before_failed} (these demonstrate old component issues)`);
    }
    if (comparison.before_skipped > 0) {
        console.log(`  Skipped: ${comparison.before_skipped}`);
    }

    console.log('\nAfter Implementation (repository_after):');
    console.log(`  Overall: ${afterResults.success ? '✅ PASSED (all issues fixed!)' : '❌ FAILED (issues remain)'}`);
    console.log(`  Tests: ${comparison.after_passed}/${comparison.after_total} passed`);
    if (comparison.after_failed > 0) {
        console.log(`  Failed: ${comparison.after_failed}`);
    }
    if (comparison.after_skipped > 0) {
        console.log(`  Skipped: ${comparison.after_skipped}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('REFACTORING VALIDATION');
    console.log('='.repeat(60));

    // Note: For this refactoring, "before" tests are written to FAIL (showing problems)
    // and "after" tests should PASS (showing fixes)
    const issuesIdentified = comparison.before_failed;
    const issuesFixed = comparison.after_passed;
    const issuesRemaining = comparison.after_failed;

    if (afterResults.success && issuesIdentified > 0) {
        console.log('✅ SUCCESS: Refactoring fixed all identified issues!');
        console.log(`   ${issuesIdentified} issue(s) were present in old component`);
        console.log(`   ${issuesFixed} test(s) now pass in new component`);
    } else if (afterResults.success && issuesIdentified === 0) {
        console.log('✅ EXCELLENT: New implementation passes all tests!');
    } else {
        console.log('❌ CONCERN: Refactoring did not fix all issues');
        console.log(`   ${issuesRemaining} test(s) still failing`);
    }

    // Analyze what issues were fixed
    const beforeCategories = categorizeFailures(beforeResults.tests);
    const afterCategories = categorizeFailures(afterResults.tests);

    // Calculate improvement metrics
    if (comparison.before_total > 0 && comparison.after_total > 0) {
        const beforeFailRate = (comparison.before_failed / comparison.before_total) * 100;
        const afterPassRate = (comparison.after_passed / comparison.after_total) * 100;

        console.log('\n' + '='.repeat(60));
        console.log('IMPROVEMENT METRICS');
        console.log('='.repeat(60));
        console.log(`Before: ${beforeFailRate.toFixed(1)}% issues detected (${comparison.before_failed}/${comparison.before_total})`);
        console.log(`After:  ${afterPassRate.toFixed(1)}% tests passing (${comparison.after_passed}/${comparison.after_total})`);
        
        if (comparison.before_failed > 0 && comparison.after_failed === 0) {
            console.log(`\n🎉 Perfect Score: All ${comparison.before_failed} issues resolved!`);
        } else if (comparison.after_failed < comparison.before_failed) {
            const fixRate = ((issuesFixed / comparison.before_total) * 100);
            console.log(`\nFix Rate: ${fixRate.toFixed(1)}%`);
        }
    }

    // Show what was fixed by category
// Show what was fixed by category
if (comparison.before_failed > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ISSUES BY CATEGORY');
    console.log('='.repeat(60));

    type CategoryKey = keyof typeof beforeCategories;
    const categoryNames = Object.keys(beforeCategories) as CategoryKey[];
    
    for (const cat of categoryNames) {
        const beforeCount = beforeCategories[cat].length;
        const afterCount = afterCategories[cat].length;
        const fixed = beforeCount - afterCount;

        if (beforeCount > 0 || afterCount > 0) {
            const catName = cat.replace(/_/g, ' ').toUpperCase();
            const status = afterCount === 0 && beforeCount > 0 ? '✅' : 
                          afterCount < beforeCount ? '⚠️' : 
                          afterCount > 0 ? '❌' : '';
            console.log(`${status} ${catName}: ${beforeCount} issues → ${afterCount} remaining (${fixed} fixed)`);

            if (afterCount === 0 && beforeCount > 0) {
                console.log(`   ✓ All ${beforeCount} issue(s) in this category resolved!`);
            } else if (afterCount > 0) {
                const afterIssues = afterCategories[cat];
                const issueList = afterIssues.slice(0, 2).map(t => `• ${t}`).join('\n   ');
                console.log(`   ${issueList}`);
                if (afterIssues.length > 2) {
                    console.log(`   ... and ${afterIssues.length - 2} more`);
                }
            }
        }
    }
}


    // Show remaining issues if any
    if (comparison.after_failed > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('REMAINING ISSUES (NEED ATTENTION)');
        console.log('='.repeat(60));

        const failedTests = afterResults.tests.filter(t => t.status === 'failed');
        for (let i = 0; i < failedTests.length && i < 10; i++) {
            console.log(`  ${i + 1}. ${failedTests[i].name}`);
        }
        if (failedTests.length > 10) {
            console.log(`  ... and ${failedTests.length - 10} more`);
        }
    }

    const startedAt = new Date(startTime).toISOString();
    const finishedAt = new Date(endTime).toISOString();

    const report = {
        run_id: generateRunId(),
        started_at: startedAt,
        finished_at: finishedAt,
        duration_seconds: Math.round(durationSeconds * 100) / 100,
        success: Boolean(afterResults.success),
        error: Boolean(afterResults.success) ? null : 'After implementation has failing tests',
        environment: getEnvironmentInfo(projectRoot),
        results: { 
            before: beforeResults, 
            after: afterResults, 
            comparison,
            issues_identified: issuesIdentified,
            issues_fixed: issuesFixed,
            issues_remaining: issuesRemaining,
            before_categories: beforeCategories,
            after_categories: afterCategories
        },
    };

    const outPath = generateOutputPath(projectRoot);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), { encoding: 'utf8' });
    console.log(`\n📊 Detailed report saved to: ${outPath}`);
    console.log(`   Duration: ${durationSeconds.toFixed(1)}s`);

    return report.success ? 0 : 1;
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
const scriptPath = path.resolve(process.cwd(), 'evaluation', 'evaluation.ts');
if (entryFile && (entryFile === scriptPath || entryFile.endsWith('evaluation.js'))) {
    const code = evaluation();
    process.exit(code);
}

export { evaluation };
