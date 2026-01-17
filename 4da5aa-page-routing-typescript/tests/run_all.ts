import { glob } from 'glob';
import { execSync } from 'child_process';

const tests = glob.sync('tests/test_*.ts');

console.log(`Found ${tests.length} tests.`);

let passed = 0;
let failed = 0;

tests.forEach(testFile => {
    console.log(`\nRunning ${testFile}...`);
    try {
        // Use encoding to capture output as string instead of buffer
        // Replace [PASS] with ✅ [PASS]
        const output = execSync(`npx ts-node ${testFile}`, { encoding: 'utf-8' });
        console.log(output.replace(/\[PASS\]/g, '✅ [PASS]').trim());
        passed++;
    } catch (e: any) {
        // Capture output from failed execution
        const output = e.stdout ? e.stdout.toString() : '';
        const error = e.stderr ? e.stderr.toString() : '';

        if (output) {
            console.log(output.replace(/\[PASS\]/g, '✅ [PASS]').replace(/\[FAIL\]/g, '❌ [FAIL]').trim());
        }
        if (error) {
            console.error(error);
        }
        console.error(`❌ FAILED: ${testFile}`);
        failed++;
    }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) {
    process.exit(1);
}
