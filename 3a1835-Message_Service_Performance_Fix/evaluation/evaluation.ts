
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function runPrismaSetup(repoPath: string) {
	spawnSync('npx', ['prisma', 'generate'], { stdio: 'inherit', cwd: repoPath });
	spawnSync('npx', ['prisma', 'db', 'push'], { stdio: 'inherit', cwd: repoPath });
}

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
	const run_id = Date.now().toString();
	const started_at = new Date().toISOString();

	// Setup Prisma for both repos
	runPrismaSetup(path.join(__dirname, '..', 'repository_before'));
	runPrismaSetup(path.join(__dirname, '..', 'repository_after'));

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

	fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2));
	console.log('Evaluation complete. Report written to evaluation/report.json');
	if (success) {
		console.log('✅ PASS: Optimized solution meets all requirements.');
	} else {
		console.log('❌ FAIL: Optimized solution did not meet all requirements.');
	}
}

main();

