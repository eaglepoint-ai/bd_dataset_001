#!/usr/bin/env node
"use strict";
/**
 * ByteDance Evaluation Script - Standard Schema
 *
 * This script runs tests and generates reports matching ByteDance standard schema.
 *
 * Usage:
 *   node evaluation/evaluation.js
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const os = require("os");

function environmentInfo() {
    return {
        node_version: process.version,
        platform: `${os.type()}-${os.arch()}`
    };
}

function runTests() {
    console.log('� Run ning tests...');
    const startTime = Date.now();
    
    try {
        const output = execSync('npm test 2>&1', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 120000
        });
        
        console.log(output);
        
        // Parse Jest output
        const passMatch = output.match(/Tests:\s+(\d+)\s+passed/);
        const failMatch = output.match(/(\d+)\s+failed/);
        const passed = passMatch ? parseInt(passMatch[1]) : 0;
        const failed = failMatch ? parseInt(failMatch[1]) : 0;
        
        return {
            passed: failed === 0 && passed > 0,
            return_code: 0,
            output: output.slice(0, 8000)
        };
    } catch (error) {
        const output = error.stdout ? error.stdout.toString() : error.message;
        
        // Check if tests passed despite non-zero exit
        const passMatch = output.match(/Tests:\s+(\d+)\s+passed/);
        const failMatch = output.match(/(\d+)\s+failed/);
        const passed = passMatch ? parseInt(passMatch[1]) : 0;
        const failed = failMatch ? parseInt(failMatch[1]) : 0;
        
        if (passed > 0 && failed === 0) {
            console.log(output);
            return {
                passed: true,
                return_code: 0,
                output: output.slice(0, 8000)
            };
        }
        
        return {
            passed: false,
            return_code: error.status || 1,
            output: output.slice(0, 8000)
        };
    }
}

function runMetrics() {
    // Optional - implement if needed
    return {};
}

function evaluate(repoName) {
    const tests = runTests();
    const metrics = runMetrics();
    return { tests, metrics };
}

function runEvaluation() {
    const runId = randomUUID();
    const start = new Date();
    
    console.log('🚀 Starting ByteDance Evaluation...\n');
    
    try {
        // For this task, we only have repository_after with tests
        // repository_before is empty (.gitkeep only)
        const before = {
            tests: {
                passed: false,
                return_code: 1,
                output: "No implementation (repository_before is empty)"
            },
            metrics: {}
        };
        
        const after = evaluate("repository_after");
        
        const end = new Date();
        
        const comparison = {
            passed_gate: after.tests.passed,
            improvement_summary: after.tests.passed 
                ? "After implementation passed correctness checks" 
                : "After implementation failed correctness checks"
        };
        
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
    } catch (error) {
        const end = new Date();
        return {
            run_id: runId,
            started_at: start.toISOString(),
            finished_at: end.toISOString(),
            duration_seconds: (end - start) / 1000,
            environment: environmentInfo(),
            before: null,
            after: null,
            comparison: null,
            success: false,
            error: error.message || String(error)
        };
    }
}

function main() {
    const report = runEvaluation();
    
    // Generate reports in timestamped directory structure
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);
    
    fs.mkdirSync(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report written to ${reportPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log(`EVALUATION RESULT: ${report.success ? 'PASS' : 'FAIL'}`);
    console.log('='.repeat(60));
    console.log(`Success: ${report.success}`);
    console.log(`Duration: ${report.duration_seconds.toFixed(2)}s`);
    console.log('='.repeat(60) + '\n');
    
    return report.success ? 0 : 1;
}

if (require.main === module) {
    process.exit(main());
}
