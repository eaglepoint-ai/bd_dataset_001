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
    // Try multiple possible locations for Dashboard file
    const possiblePaths = [
        path.join(repoPath, 'Dashboard.js'),
        path.join(repoPath, 'dashboard.js'),
        path.join(repoPath, 'src', 'components', 'Dashboard', 'Dashboard.jsx')
    ];
    
    let dashboardFile = null;
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            dashboardFile = filePath;
            break;
        }
    }
    
    if (!dashboardFile) {
        return { passed: false, details: 'Dashboard file not found' };
    }

    const content = fs.readFileSync(dashboardFile, 'utf8');
    
    // Check for Item.jsx in the same directory (for modular structure)
    const dashboardDir = path.dirname(dashboardFile);
    const itemFile = path.join(dashboardDir, 'Item.jsx');
    let itemContent = '';
    if (fs.existsSync(itemFile)) {
        itemContent = fs.readFileSync(itemFile, 'utf8');
    }
    
    // Combine content for feature checking
    const combinedContent = content + '\n' + itemContent;

    const features = {
        react_memo: combinedContent.includes('React.memo'),
        use_callback: combinedContent.includes('useCallback'),
        use_reducer: combinedContent.includes('useReducer'),
        search_separated: combinedContent.includes('const [search, setSearch]') && combinedContent.includes('const [state, dispatch]')
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
    // Create date/time folder structure: YYYY-MM-DD/HH-MM-SS/
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeFolder = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    const reportDir = path.join(REPORTS, dateFolder, timeFolder);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = runEvaluation();
    const pathToReport = path.join(reportDir, 'report.json');
    fs.writeFileSync(pathToReport, JSON.stringify(report, null, 2));
    
    // Also write to latest.json for backward compatibility
    const latestPath = path.join(REPORTS, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
    
    console.log(`Report written to ${pathToReport}`);
    console.log(`Latest report: ${latestPath}`);
    return report.success ? 0 : 1;
}

if (require.main === module) {
    process.exit(main());
}
