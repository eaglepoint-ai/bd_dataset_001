const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, '..', 'repository_after');
const dashboardFile = path.join(repoPath, 'Dashboard.js');

console.log('Running tests against AFTER (optimized) implementation.');
console.log('Expected: ALL optimization features should be present\n');

// Feature checks - these MUST be present in the optimized version
const requiredOptimizations = [
  {
    name: 'React.memo on Item',
    lineRegex: /^\s*const\s+Item\s*=\s*React\.memo\s*\(/,
    description: 'Prevents unnecessary re-renders of Item components'
  },
  {
    name: 'useCallback for handleUpdate',
    lineRegex: /^\s*const\s+handleUpdate\s*=\s*useCallback\s*\(/,
    description: 'Ensures stable function reference across renders'
  },
  {
    name: 'useReducer for state',
    lineRegex: /^\s*const\s*\[\s*state\s*,\s*dispatch\s*\]\s*=\s*useReducer\s*\(/,
    description: 'Efficient state management with O(1) updates'
  },
  {
    name: 'Separated search state',
    lineRegex: /^\s*const\s*\[\s*search\s*,\s*setSearch\s*\]\s*=\s*useState\s*\(/,
    description: 'Search state independent from items state'
  },
  {
    name: 'console.log in Item',
    lineRegex: /^\s*console\.log\s*\(.*Rendering Item.*\)/,
    description: 'Demonstrates surgical re-renders (debugging)'
  }
];

// Additional quality checks
const qualityChecks = [
  {
    name: 'Reducer function defined',
    lineRegex: /^\s*const\s+reducer\s*=\s*\(/,
    description: 'Reducer handles state updates'
  },
  {
    name: 'Dashboard component exists',
    lineRegex: /^\s*export\s+default\s+function\s+Dashboard/,
    description: 'Main component is exported'
  },
  {
    name: 'Item component defined',
    lineRegex: /^\s*const\s+Item\s*=/,
    description: 'Item component is defined'
  }
];

function checkFeature(content, check) {
  const lines = content.split(/\r?\n/);
  const matches = lines.filter(line => check.lineRegex.test(line));
  const hasFeature = matches.length > 0;
  
  const status = hasFeature ? 'PASS' : 'FAIL';
  const detail = hasFeature ? ' ✓' : ' ✗ (missing)';
  
  console.log(`${check.name}: ${status}${detail}`);
  if (check.description) {
    console.log(`  → ${check.description}`);
  }
  
  return hasFeature;
}

function main() {
  if (!fs.existsSync(dashboardFile)) {
    console.log('Dashboard.js not found: FAIL');
    process.exit(1);
  }

  const content = fs.readFileSync(dashboardFile, 'utf8');
  let allPassed = true;

  console.log('=== Required Optimizations ===');
  for (const check of requiredOptimizations) {
    const passed = checkFeature(content, check);
    if (!passed) allPassed = false;
  }

  console.log('\n=== Quality Checks ===');
  for (const check of qualityChecks) {
    const passed = checkFeature(content, check);
    if (!passed) allPassed = false;
  }

  // Check for explanation comment
  console.log('\n=== Documentation ===');
  const hasExplanation = content.includes('Why React.memo alone') || 
                         content.includes('React.memo performs a shallow comparison');
  console.log(`Explanation comment: ${hasExplanation ? 'PASS ✓' : 'FAIL ✗ (missing)'}`);
  if (!hasExplanation) allPassed = false;

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✓ ALL TESTS PASSED!');
    console.log('The implementation meets all optimization requirements.');
  } else {
    console.log('✗ SOME TESTS FAILED!');
    console.log('Please review the missing features above.');
  }
  console.log('='.repeat(50));

  process.exit(allPassed ? 0 : 1);
}

main();
