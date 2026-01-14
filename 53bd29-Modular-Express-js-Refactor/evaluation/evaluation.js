#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_BEFORE = path.join(__dirname, '../repository_before');
const REPO_AFTER = path.join(__dirname, '../repository_after');

function runTests(repoPath, repoName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running tests on ${repoName}`);
    console.log('='.repeat(60));
    
    let output = '';
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    try {
        // Set environment variable to tell tests which repo to check
        const env = { ...process.env, TEST_REPO_PATH: repoPath };
        
        output = execSync(
            'npm test 2>&1',
            { 
                cwd: path.join(__dirname, '../tests'),
                env: env,
                encoding: 'utf8',
                shell: '/bin/bash'
            }
        );
    } catch (error) {
        // Jest exits with non-zero on test failures, but output is still in stdout
        output = error.stdout || error.stderr || error.message || '';
    }
    
    console.log(output);
    
    // Parse results - look for "Tests:       27 passed, 27 total" or "Tests:       22 failed, 5 passed, 27 total"
    // Try to match: "Tests:       22 failed, 5 passed, 27 total"
    const fullMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (fullMatch) {
        failed = parseInt(fullMatch[1]);
        passed = parseInt(fullMatch[2]);
        total = parseInt(fullMatch[3]);
    } else {
        // Try to match: "Tests:       27 passed, 27 total"
        const passedMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (passedMatch) {
            passed = parseInt(passedMatch[1]);
            total = parseInt(passedMatch[2]);
            failed = 0;
        }
    }
    
    console.log(`\nParsed results: ${passed} passed, ${failed} failed, ${total} total`);
    
    return {
        success: failed === 0 && passed > 0,
        passed: passed,
        failed: failed,
        total: total,
        output: output
    };
}

function analyzeStructure(repoPath) {
    const metrics = {
        total_files: 0,
        config_files: 0,
        model_files: 0,
        controller_files: 0,
        route_files: 0,
        middleware_files: 0,
        index_lines: 0,
        has_modular_structure: false
    };
    
    if (!fs.existsSync(repoPath)) {
        return metrics;
    }
    
    // Count files
    const countFiles = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir).filter(f => f.endsWith('.js')).length;
    };
    
    metrics.config_files = countFiles(path.join(repoPath, 'config'));
    metrics.model_files = countFiles(path.join(repoPath, 'models'));
    metrics.controller_files = countFiles(path.join(repoPath, 'controllers'));
    metrics.route_files = countFiles(path.join(repoPath, 'routes'));
    metrics.middleware_files = countFiles(path.join(repoPath, 'middleware'));
    
    metrics.total_files = metrics.config_files + metrics.model_files + 
                          metrics.controller_files + metrics.route_files + 
                          metrics.middleware_files;
    
    // Count index.js lines
    const indexPath = path.join(repoPath, 'index.js');
    if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        metrics.index_lines = content.split('\n').length;
    }
    
    // Check modular structure
    metrics.has_modular_structure = 
        fs.existsSync(path.join(repoPath, 'config')) &&
        fs.existsSync(path.join(repoPath, 'models')) &&
        fs.existsSync(path.join(repoPath, 'controllers')) &&
        fs.existsSync(path.join(repoPath, 'routes'));
    
    return metrics;
}

function generateReport(beforeResults, afterResults, beforeMetrics, afterMetrics) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);
    fs.mkdirSync(reportDir, { recursive: true });
    
    const report = {
        run_id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        started_at: now.toISOString(),
        finished_at: new Date().toISOString(),
        environment: {
            node_version: process.version,
            platform: `${process.platform}-${process.arch}`
        },
        before: {
            metrics: beforeMetrics,
            tests: {
                passed: beforeResults.passed,
                failed: beforeResults.failed,
                total: beforeResults.total,
                success: beforeResults.success
            }
        },
        after: {
            metrics: afterMetrics,
            tests: {
                passed: afterResults.passed,
                failed: afterResults.failed,
                total: afterResults.total,
                success: afterResults.success
            }
        },
        comparison: {
            index_lines_reduced: beforeMetrics.index_lines - afterMetrics.index_lines,
            index_lines_reduction_percent: beforeMetrics.index_lines > 0 
                ? Math.round(((beforeMetrics.index_lines - afterMetrics.index_lines) / beforeMetrics.index_lines) * 100)
                : 0,
            modular_files_created: afterMetrics.total_files,
            structure_improved: !beforeMetrics.has_modular_structure && afterMetrics.has_modular_structure,
            index_is_minimal: afterMetrics.index_lines < 60,
            tests_fixed: afterResults.passed - beforeResults.passed
        },
        success: !beforeResults.success && afterResults.success
    };
    
    const reportPath = path.join(reportDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return { report, reportPath };
}

function main() {
    console.log('='.repeat(60));
    console.log('Express.js Modular Refactor Evaluation');
    console.log('='.repeat(60));
    
    // Analyze structures
    console.log('\n[1/5] Analyzing repository_before structure...');
    const beforeMetrics = analyzeStructure(REPO_BEFORE);
    console.log(`  - Index.js lines: ${beforeMetrics.index_lines}`);
    console.log(`  - Modular structure: ${beforeMetrics.has_modular_structure}`);
    console.log(`  - Total modular files: ${beforeMetrics.total_files}`);
    
    console.log('\n[2/5] Analyzing repository_after structure...');
    const afterMetrics = analyzeStructure(REPO_AFTER);
    console.log(`  - Index.js lines: ${afterMetrics.index_lines}`);
    console.log(`  - Modular structure: ${afterMetrics.has_modular_structure}`);
    console.log(`  - Config files: ${afterMetrics.config_files}`);
    console.log(`  - Model files: ${afterMetrics.model_files}`);
    console.log(`  - Controller files: ${afterMetrics.controller_files}`);
    console.log(`  - Route files: ${afterMetrics.route_files}`);
    console.log(`  - Middleware files: ${afterMetrics.middleware_files}`);
    console.log(`  - Total modular files: ${afterMetrics.total_files}`);
    
    // Run tests on before (should fail)
    console.log('\n[3/5] Running tests on repository_before (expected to FAIL)...');
    const beforeResults = runTests(REPO_BEFORE, 'repository_before');
    console.log(`  ✗ Passed: ${beforeResults.passed}`);
    console.log(`  ✗ Failed: ${beforeResults.failed}`);
    console.log(`  ✗ Total: ${beforeResults.total}`);
    console.log(`  ✗ Success: ${beforeResults.success}`);
    
    // Run tests on after (should pass)
    console.log('\n[4/5] Running tests on repository_after (expected to PASS)...');
    const afterResults = runTests(REPO_AFTER, 'repository_after');
    console.log(`  ✓ Passed: ${afterResults.passed}`);
    console.log(`  ✓ Failed: ${afterResults.failed}`);
    console.log(`  ✓ Total: ${afterResults.total}`);
    console.log(`  ✓ Success: ${afterResults.success}`);
    
    // Generate report
    console.log('\n[5/5] Generating report...');
    const { report, reportPath } = generateReport(beforeResults, afterResults, beforeMetrics, afterMetrics);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Evaluation Complete');
    console.log('='.repeat(60));
    console.log(`\nOverall Success: ${report.success}`);
    console.log(`\nBefore (Monolithic):`);
    console.log(`  - Tests Passed: ${beforeResults.passed}/${beforeResults.total}`);
    console.log(`  - Tests Failed: ${beforeResults.failed}/${beforeResults.total}`);
    console.log(`  - Has Modular Structure: ${beforeMetrics.has_modular_structure}`);
    console.log(`\nAfter (Modular):`);
    console.log(`  - Tests Passed: ${afterResults.passed}/${afterResults.total}`);
    console.log(`  - Tests Failed: ${afterResults.failed}/${afterResults.total}`);
    console.log(`  - Has Modular Structure: ${afterMetrics.has_modular_structure}`);
    console.log(`\nImprovements:`);
    console.log(`  - Index.js reduced by ${report.comparison.index_lines_reduced} lines (${report.comparison.index_lines_reduction_percent}%)`);
    console.log(`  - Created ${report.comparison.modular_files_created} modular files`);
    console.log(`  - Structure improved: ${report.comparison.structure_improved}`);
    console.log(`  - Index is minimal: ${report.comparison.index_is_minimal}`);
    console.log(`  - Tests fixed: ${report.comparison.tests_fixed}`);
    console.log(`\nReport saved to: ${reportPath}`);
    
    process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { runTests, analyzeStructure, generateReport };
