const { execSync } = require('child_process');
const path = require('path');

function runTests() {
  const repo = process.env.REPO || 'repository_after';
  const projectRoot = path.join(__dirname, '..');
  
  const env = { ...process.env, REPO: repo, CI: 'true' };

  // Try different ways to run jest
  const commands = [
    './node_modules/.bin/jest',
    'npx --no-install jest',
    'jest'
  ];

  let stdout = '';
  let success = false;

  for (const cmd of commands) {
    try {
      stdout = execSync(`${cmd} tests/memory-leaks.test.js --json --forceExit --silent`, {
        env,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      success = true;
      break;
    } catch (e) {
      if (e.stdout && e.stdout.toString().includes('{"numTotalTests"')) {
        stdout = e.stdout.toString();
        success = true;
        break;
      }
    }
  }

  if (success) {
    try {
      const results = JSON.parse(stdout);
      const passed = results.numPassedTests || 0;
      const failed = results.numFailedTests || 0;
      process.stdout.write(`${passed} amount passed and ${failed} amount failed\n`);
    } catch (parseError) {
      process.stdout.write(`0 amount passed and 10 amount failed\n`);
    }
  } else {
    process.stdout.write(`0 amount passed and 10 amount failed\n`);
  }
}

runTests();
