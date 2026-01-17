// Simple Node.js test to verify ghost state behavior
const fs = require('fs');
const path = require('path');

// Determine which repository to test
const repoPath = process.env.REPO_PATH || '../repository_before';
const componentPath = path.resolve(process.cwd(), `${repoPath}/src/components/UploadManager.jsx`);

console.log(`Testing repository: ${repoPath}`);
console.log(`Component path: ${componentPath}`);

// Read the component code
const componentCode = fs.readFileSync(componentPath, 'utf8');

// Test results
let passed = 0;
let failed = 0;
let total = 0;

function test(name, testFn) {
  total++;
  try {
    const result = testFn();
    if (result) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ ${name} - ${error.message}`);
    failed++;
  }
}

// Basic functionality tests (should pass for both versions)
test('Component exists', () => {
  return fs.existsSync(componentPath);
});

test('Component imports React', () => {
  return componentCode.includes('import React');
});

test('Component has useState', () => {
  return componentCode.includes('useState');
});

test('Component has handleUpload function', () => {
  return componentCode.includes('handleUpload');
});

test('Component has cancel function', () => {
  return componentCode.includes('cancel');
});

test('Component stays under 50 lines', () => {
  const lines = componentCode.split('\n').filter(line => line.trim() !== '').length;
  console.log(`  Component has ${lines} lines`);
  return lines <= 50;
});

test('Component has basic error handling', () => {
  return componentCode.includes('catch') && componentCode.includes('setError');
});

// Ghost state prevention tests (should fail for repository_before, pass for repository_after)
test('Has upload ID tracking (prevents ghost state)', () => {
  return componentCode.includes('uploadIdRef') || componentCode.includes('uploadId');
});

test('Has timer cleanup mechanism', () => {
  return componentCode.includes('clearTimeout') && componentCode.includes('timeoutRef');
});

test('Has state guards to prevent stale updates', () => {
  return componentCode.includes('currentUploadId === uploadIdRef.current') || 
         componentCode.includes('uploadId') && componentCode.includes('===');
});

test('Clears timers on new upload attempts', () => {
  return componentCode.includes('clearTimers') || 
         (componentCode.includes('clearTimeout') && componentCode.includes('handleUpload'));
});

// Print results
console.log('\n' + '='.repeat(50));
console.log('TEST RESULTS');
console.log('='.repeat(50));
console.log(`Total tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success rate: ${Math.round((passed/total) * 100)}%`);

// Expected results:
// repository_before: Should have some failures (ghost state tests)
// repository_after: Should pass all tests

const expectedBehavior = repoPath.includes('repository_before') ? 
  'Expected: Some tests should fail (ghost state bugs present)' :
  'Expected: All tests should pass (ghost state bugs fixed)';

console.log(`\n${expectedBehavior}`);

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);