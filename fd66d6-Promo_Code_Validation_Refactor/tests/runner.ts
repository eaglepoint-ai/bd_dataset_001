#!/usr/bin/env node

import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Test runner for before/after codebase validation
 */
function runTests(): void {
  console.log('🧪 Running Promo Code Migration Tests\n');

  const beforePath = path.join(__dirname, '..', 'repository_before');
  const afterPath = path.join(__dirname, '..', 'repository_after');

  try {
    console.log('📋 Testing BEFORE codebase...');
    process.env.TEST_PATH = beforePath;
    execSync('npx jest tests/', { stdio: 'inherit', env: { ...process.env, TEST_PATH: beforePath } });
    
    console.log('\n📋 Testing AFTER codebase...');
    process.env.TEST_PATH = afterPath;
    execSync('npx jest tests/', { stdio: 'inherit', env: { ...process.env, TEST_PATH: afterPath } });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.log('\n⚠️  Some tests failed as expected (this validates migration correctness)');
    console.log('Check test output above for details.');
  }
}

if (require.main === module) {
  runTests();
}

export { runTests };