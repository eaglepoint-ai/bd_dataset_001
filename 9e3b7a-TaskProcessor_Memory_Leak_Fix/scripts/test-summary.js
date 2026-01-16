const { execSync } = require('child_process');

function runTests() {
  const repo = process.env.REPO || 'repository_after';
  const env = { ...process.env, REPO: repo, CI: 'true' };

  try {
    const stdout = execSync('npx jest tests/memory-leaks.test.js --json --forceExit --silent', {
      env,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });

    const results = JSON.parse(stdout);
    const passed = results.numPassedTests;
    const failed = results.numFailedTests;
    
    console.log(`${passed} amount passed and ${failed} amount failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    // If npx jest fails or returns non-zero, try to parse its stdout
    if (e.stdout) {
      try {
        const results = JSON.parse(e.stdout.toString());
        const passed = results.numPassedTests;
        const failed = results.numFailedTests;
        console.log(`${passed} amount passed and ${failed} amount failed`);
        process.exit(failed > 0 ? 1 : 0);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.log(`0 amount passed and 10 amount failed`);
        process.exit(1);
      }
    } else {
      console.log(`0 amount passed and 10 amount failed`);
      process.exit(1);
    }
  }
}

runTests();
