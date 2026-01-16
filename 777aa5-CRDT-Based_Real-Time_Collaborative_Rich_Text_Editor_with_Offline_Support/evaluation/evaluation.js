#!/usr/bin/env node
"use strict";
/**
 * ByteDance Evaluation Script - Simplified Version
 *
 * This script runs the tests and generates a success report if they pass.
 *
 * Usage:
 *   node evaluation/evaluation.js
 */
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
class Evaluator {
    constructor() {
        this.testResults = [];
        this.performanceMetrics = [];
        this.errors = [];
        this.startTime = Date.now();
    }
    /**
     * Main evaluation entry point
     */
    async run() {
        console.log('🚀 Starting ByteDance Evaluation...\n');
        try {
            // Step 1: Run unit tests (the main requirement)
            await this.runUnitTests();
            // Step 2: Determine overall status based on test results
            const allTestsPassed = this.testResults.every(t => t.passed);
            const overallStatus = allTestsPassed ? 'PASS' : 'FAIL';
            // Step 3: Generate reports
            await this.generateReports(overallStatus);
            // Step 4: Exit with appropriate code
            process.exit(overallStatus === 'PASS' ? 0 : 1);
        }
        catch (error) {
            console.error('❌ Evaluation failed:', error);
            this.errors.push(error instanceof Error ? error.message : String(error));
            await this.generateReports('FAIL');
            process.exit(1);
        }
    }
    /**
     * Runs unit tests (CRDT convergence tests)
     */
    async runUnitTests() {
        console.log('📝 Running unit tests...');
        const startTime = Date.now();
        try {
            // Run tests from /tests directory
            const output = (0, child_process_1.execSync)('npm test 2>&1', {
                cwd: path.join(__dirname, '..'),
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            console.log(output);
            // Parse Jest output for test results
            const passMatch = output.match(/Tests:\s+(\d+)\s+passed/);
            const failMatch = output.match(/(\d+)\s+failed/);
            const timeMatch = output.match(/Time:\s+([\d.]+)\s*s/);
            const passed = passMatch ? parseInt(passMatch[1]) : 0;
            const failed = failMatch ? parseInt(failMatch[1]) : 0;
            const duration = timeMatch ? parseFloat(timeMatch[1]) * 1000 : Date.now() - startTime;
            this.testResults.push({
                name: 'Unit Tests (CRDT)',
                passed: failed === 0 && passed > 0,
                duration
            });
            if (failed === 0 && passed > 0) {
                console.log(`✅ Unit tests: ${passed} passed, ${failed} failed\n`);
            }
            else {
                console.error(`❌ Unit tests: ${passed} passed, ${failed} failed\n`);
                this.errors.push(`Unit tests failed: ${passed} passed, ${failed} failed`);
            }
        }
        catch (error) {
            const errorMsg = error.message || String(error);
            const duration = Date.now() - startTime;
            // Check if tests actually passed but npm test returned non-zero
            const output = error.stdout ? error.stdout.toString() : '';
            const passMatch = output.match(/Tests:\s+(\d+)\s+passed/);
            const failMatch = output.match(/(\d+)\s+failed/);
            const passed = passMatch ? parseInt(passMatch[1]) : 0;
            const failed = failMatch ? parseInt(failMatch[1]) : 0;
            if (passed > 0 && failed === 0) {
                // Tests actually passed
                console.log(output);
                console.log(`✅ Unit tests: ${passed} passed, ${failed} failed\n`);
                this.testResults.push({
                    name: 'Unit Tests (CRDT)',
                    passed: true,
                    duration
                });
            }
            else {
                this.testResults.push({
                    name: 'Unit Tests (CRDT)',
                    passed: false,
                    duration,
                    error: errorMsg
                });
                this.errors.push(`Unit tests failed: ${errorMsg}`);
                console.error('❌ Unit tests failed\n');
            }
        }
    }
    /**
     * Generates JSON report
     */
    async generateReports(overallStatus) {
        const duration = Date.now() - this.startTime;
        const report = {
            timestamp: new Date().toISOString(),
            overall_status: overallStatus,
            test_results: {
                total: this.testResults.length,
                passed: this.testResults.filter(t => t.passed).length,
                failed: this.testResults.filter(t => !t.passed).length,
                duration
            },
            performance_metrics: this.performanceMetrics,
            details: {
                tests: this.testResults,
                errors: this.errors
            }
        };
        // Generate reports in timestamped directory structure
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);
        fs.mkdirSync(reportDir, { recursive: true });
        const jsonPath = path.join(reportDir, 'report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        console.log(`📄 JSON report generated: ${jsonPath}`);
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log(`EVALUATION RESULT: ${overallStatus}`);
        console.log('='.repeat(60));
        console.log(`Tests: ${report.test_results.passed}/${report.test_results.total} passed`);
        if (this.performanceMetrics.length > 0) {
            console.log(`Performance Gates: ${this.performanceMetrics.filter(m => m.passed).length}/${this.performanceMetrics.length} passed`);
        }
        console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log('='.repeat(60) + '\n');
    }
}
// Run evaluation
const evaluator = new Evaluator();
evaluator.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
