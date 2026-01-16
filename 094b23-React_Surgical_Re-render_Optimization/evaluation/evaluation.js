#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'evaluation', 'reports');

function environmentInfo() {
    return {
        node_version: process.version,
        platform: process.platform + '-' + process.arch
    };
}

function checkCodeFeatures(repoPath) {
    // Try both Dashboard.js and dashboard.js
    let dashboardFile = path.join(repoPath, 'Dashboard.js');
    if (!fs.existsSync(dashboardFile)) {
        dashboardFile = path.join(repoPath, 'dashboard.js');
    }
    
    if (!fs.existsSync(dashboardFile)) {
        return { passed: false, details: 'Dashboard.js not found' };
    }

    const content = fs.readFileSync(dashboardFile, 'utf8');

    const features = {
        react_memo: content.includes('React.memo'),
        use_callback: content.includes('useCallback'),
        use_reducer: content.includes('useReducer'),
        search_separated: content.includes('const [search, setSearch]') && content.includes('const [state, dispatch]')
    };

    const passed = Object.values(features).every(Boolean);
    return { passed, details: features };
}

function runTests(repoPath) {
    const { passed, details } = checkCodeFeatures(repoPath);
    const output = `Features check: ${JSON.stringify(details)}`;
    return {
        passed,
        return_code: passed ? 0 : 1,
        output
    };
}

function runMetrics(repoPath) {
    // Optional metrics
    return {};
}

function evaluate(repoName) {
    const repoPath = path.join(ROOT, repoName);
    const tests = runTests(repoPath);
    const metrics = runMetrics(repoPath);
    return {
        tests,
        metrics
    };
}

function runEvaluation() {
    const runId = Math.random().toString(36).substring(2, 15);
    const start = new Date();
    const before = evaluate('repository_before');
    const after = evaluate('repository_after');
    const comparison = {
        passed_gate: after.tests.passed,
        improvement_summary: 'After implementation includes React.memo, useCallback, useReducer, and separated search state'
    };
    const end = new Date();
    return {
        run_id: runId,
        started_at: start.toISOString(),
        finished_at: end.toISOString(),
        duration_seconds: (end - start) / 1000,
        environment: environmentInfo(),
        before,
        after,
        comparison,
        success: comparison.passed_gate,
        error: null
    };
}

function main() {
    if (!fs.existsSync(REPORTS)) {
        fs.mkdirSync(REPORTS, { recursive: true });
    }
    const report = runEvaluation();
    const pathToReport = path.join(REPORTS, 'latest.json');
    fs.writeFileSync(pathToReport, JSON.stringify(report, null, 2));
    console.log(`Report written to ${pathToReport}`);
    return report.success ? 0 : 1;
}

if (require.main === module) {
    process.exit(main());
}
