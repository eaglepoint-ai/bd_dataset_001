
import { spawnSync } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

function runMocha(testFile: string, repoPath: string) {
	const startMem = process.memoryUsage().heapUsed;
	const start = Date.now();
	const result = spawnSync('npx', ['mocha', '-r', 'ts-node/register', testFile, '--reporter', 'spec'], { cwd: repoPath, encoding: 'utf-8' });
	const end = Date.now();
	const endMem = process.memoryUsage().heapUsed;
	return {
		output: result.stdout,
		error: result.stderr,
		duration_ms: end - start,
		memory_mb: ((endMem - startMem) / 1024 / 1024).toFixed(2),
		status: result.status
	};
}

function main() {
	try {
		const run_id = randomUUID();
		const started_at = new Date().toISOString();

		console.log('🚀 Starting ByteDance Evaluation...\n');

		// Run tests from root directory where tests/ folder is located
		const rootPath = path.join(__dirname, '..');
		const beforeTest = path.join(rootPath, 'tests', 'messageService.before.test.ts');
		const afterTest = path.join(rootPath, 'tests', 'messageService.after.test.ts');

		const before = runMocha(beforeTest, rootPath);
		const after = runMocha(afterTest, rootPath);

		const finished_at = new Date().toISOString();

		// Only repository_after determines pass/fail
		const success = after.status === 0;

		// Generate report (JSON, following evaluation_guide_training.txt style)
		const report = {
			run_id,
			started_at,
			finished_at,
			success,
			results: {
				before: {
					status: before.status,
					duration_ms: before.duration_ms,
					memory_mb: before.memory_mb,
					output: before.output,
					error: before.error
				},
				after: {
					status: after.status,
					duration_ms: after.duration_ms,
					memory_mb: after.memory_mb,
					output: after.output,
					error: after.error
				}
			}
		};

		// Generate reports in timestamped directory structure
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
		const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);

		fs.mkdirSync(reportDir, { recursive: true });

		const reportPath = path.join(reportDir, 'report.json');
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

		console.log(`\n📄 Report written to evaluation/reports/${dateStr}/${timeStr}/report.json`);

		// Print summary
		console.log('\n' + '='.repeat(60));
		console.log(`✅ Evaluation complete`);
		console.log(`🎯 Success: ${success}`);
		console.log('='.repeat(60) + '\n');

		process.exit(success ? 0 : 1);
	} catch (error: any) {
		// Catastrophic failure - generate error report
		console.error(`❌ Evaluation failed catastrophically: ${error.message}`);
		console.error(error.stack);

		try {
			const now = new Date();
			const dateStr = now.toISOString().split('T')[0];
			const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
			const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);

			fs.mkdirSync(reportDir, { recursive: true });

			const errorReport = {
				run_id: randomUUID(),
				started_at: now.toISOString(),
				finished_at: now.toISOString(),
				success: false,
				error: `Catastrophic failure: ${error.message}\n${error.stack}`
			};

			const reportPath = path.join(reportDir, 'report.json');
			fs.writeFileSync(reportPath, JSON.stringify(errorReport, null, 2));

			console.log(`\n📄 Error report written to evaluation/reports/${dateStr}/${timeStr}/report.json`);
		} catch (writeError: any) {
			console.error(`Failed to write error report: ${writeError.message}`);
		}

		process.exit(1);
	}
}

main();

