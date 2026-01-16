const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, '..', 'repository_before');
const dashboardFile = path.join(repoPath, 'dashboard.js');

console.log('Running tests against BEFORE (unoptimized) implementation.');
console.log('Expected: NO optimization features should be present\n');

// Feature checks - these should NOT be present in the unoptimized version
const optimizationChecks = [
  {
    name: 'React.memo on Item',
    lineRegex: /^\s*const\s+Item\s*=\s*React\.memo\s*\(/,
    shouldBeAbsent: true
  },
  {
    name: 'useCallback for handleUpdate',
    lineRegex: /^\s*const\s+handleUpdate\s*=\s*useCallback\s*\(/,
    shouldBeAbsent: true
  },
  {
    name: 'useReducer for state',
    lineRegex: /^\s*const\s*\[\s*state\s*,\s*dispatch\s*\]\s*=\s*useReducer\s*\(/,
    shouldBeAbsent: true
  }
];

// Basic structure checks - these can be present
const structureChecks = [
  {
    name: 'Item component exists',
    lineRegex: /^\s*const\s+Item\s*=/,
    shouldBePresent: true
  },
  {
    name: 'Dashboard component exists',
    lineRegex: /^\s*export\s+default\s+function\s+Dashboard/,
    shouldBePresent: true
  },
  {
    name: 'useState for items',
    lineRegex: /^\s*const\s*\[\s*items\s*,\s*setItems\s*\]\s*=\s*useState\s*\(/,
    shouldBePresent: true
  },
  {
    name: 'useState for search',
    lineRegex: /^\s*const\s*\[\s*search\s*,\s*setSearch\s*\]\s*=\s*useState\s*\(/,
    shouldBePresent: true
  }
];

function checkFeature(content, check) {
  const lines = content.split(/\r?\n/);
  const matches = lines.filter(line => check.lineRegex.test(line));
  const hasFeature = matches.length > 0;
  
  let pass;
  let detail = '';
  
  if (check.shouldBeAbsent) {
    pass = !hasFeature;
    if (hasFeature) {
      detail = ` (FOUND but should be ABSENT: ${matches[0].trim()})`;
    } else {
      detail = ' (correctly absent)';
    }
  } else if (check.shouldBePresent) {
    pass = hasFeature;
    if (hasFeature) {
      detail = ' (correctly present)';
    } else {
      detail = ' (MISSING but should be present)';
    }
  }
  
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${check.name}: ${status}${detail}`);
  return pass;
}

function main() {
  if (!fs.existsSync(dashboardFile)) {
    console.log('dashboard.js not found: FAIL');
    process.exit(1);
  }

  const content = fs.readFileSync(dashboardFile, 'utf8');
  let allPassed = true;

  console.log('=== Optimization Features (should be ABSENT) ===');
  for (const check of optimizationChecks) {
    const passed = checkFeature(content, check);
    if (!passed) allPassed = false;
  }

  console.log('\n=== Basic Structure (should be PRESENT) ===');
  for (const check of structureChecks) {
    const passed = checkFeature(content, check);
    if (!passed) allPassed = false;
  }

  console.log('\n' + (allPassed ? '✓ All tests passed!' : '✗ Some tests failed!'));
  process.exit(allPassed ? 0 : 1);
}

main();
