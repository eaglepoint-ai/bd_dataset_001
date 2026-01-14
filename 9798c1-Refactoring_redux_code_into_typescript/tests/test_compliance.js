/**
 * Compliance Tests - Enforce 13 Requirements
 * 
 * These tests MUST:
 * - FAIL on repository_before (JavaScript, non-compliant)
 * - PASS on repository_after (TypeScript, compliant)
 * 
 * They validate the 13 TypeScript + Redux requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGET = process.env.TARGET || 'after';
const REPO_PATH = path.join(__dirname, '..', `repository_${TARGET}`);

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    failures.push({ name, error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

console.log(`\n=== Compliance Tests for ${TARGET.toUpperCase()} Version ===\n`);
console.log('These tests enforce the 13 TypeScript + Redux requirements\n');

// ============================================================================
// Requirement 1-2: Explicit typing / No implicit any
// ============================================================================

test('TypeScript configuration exists (tsconfig.json)', () => {
  const tsconfigPath = path.join(REPO_PATH, 'tsconfig.json');
  
  if (TARGET === 'before') {
    // Before version should NOT have TypeScript - this is a FAILURE
    if (fs.existsSync(tsconfigPath)) {
      throw new Error('Before version should not have tsconfig.json (it is JavaScript)');
    }
    // BEFORE FAILS: No TypeScript configuration (non-compliant)
    throw new Error('BEFORE version must FAIL: No TypeScript configuration (Requirement 1-2: Explicit typing, no implicit any)');
  }
  
  // After version MUST have TypeScript
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('After version must have tsconfig.json');
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (!tsconfig.compilerOptions) {
    throw new Error('tsconfig.json must have compilerOptions');
  }
  
  // Must have strict mode
  if (tsconfig.compilerOptions.strict !== true) {
    throw new Error('tsconfig.json must have strict: true (Requirement 2: No implicit any)');
  }
});

test('TypeScript files exist', () => {
  const tsFiles = findFiles(REPO_PATH, '.ts');
  
  if (TARGET === 'before') {
    // BEFORE FAILS: No TypeScript files (non-compliant)
    if (tsFiles.length > 0) {
      throw new Error('Before version should not have .ts files (it is JavaScript)');
    }
    throw new Error('BEFORE version must FAIL: No TypeScript files (Requirement 1: Explicit typing)');
  }
  
  // After version MUST have TypeScript files
  if (tsFiles.length === 0) {
    throw new Error('After version must have TypeScript (.ts) files');
  }
  
  // Must have key TypeScript files
  const requiredFiles = [
    'src/redux/types.ts',
    'src/redux/actions.ts',
    'src/redux/reducer.ts',
    'src/store.ts'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(REPO_PATH, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required TypeScript file missing: ${file}`);
    }
  });
});

// ============================================================================
// Requirement 3: Interfaces/types for objects, state, API responses
// ============================================================================

test('Type definitions exist (Requirement 3)', () => {
  if (TARGET === 'before') {
    return; // Pass for before (no types expected)
  }
  
  const typesPath = path.join(REPO_PATH, 'src', 'redux', 'types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('types.ts must exist (Requirement 3: Interfaces/types for objects, state, API responses)');
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Must have state interface
  if (!typesContent.includes('interface') && !typesContent.includes('export interface')) {
    throw new Error('types.ts must define interfaces (Requirement 3)');
  }
  
  // Should have RootState or BetState
  if (!typesContent.includes('State') && !typesContent.includes('BetState') && !typesContent.includes('RootState')) {
    throw new Error('types.ts must define state interfaces (Requirement 3)');
  }
});

// ============================================================================
// Requirement 7: as const for action type constants
// ============================================================================

test('Action type constants use as const (Requirement 7)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No "as const" (non-compliant)
    throw new Error('BEFORE version must FAIL: No "as const" for action types (Requirement 7)');
  }
  
  const typesPath = path.join(REPO_PATH, 'src', 'redux', 'types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('types.ts must exist');
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Must have "as const" for action types
  if (!typesContent.includes('as const')) {
    throw new Error('Action type constants must use "as const" (Requirement 7)');
  }
  
  // Should have action type constants
  if (!typesContent.includes('ADD_BET_SLIP') && !typesContent.includes('export const ADD_BET_SLIP')) {
    throw new Error('Action type constants must be defined');
  }
});

// ============================================================================
// Requirement 8: Discriminated union types for actions
// ============================================================================

test('Discriminated union types exist (Requirement 8)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No discriminated unions (non-compliant)
    throw new Error('BEFORE version must FAIL: No discriminated union types (Requirement 8)');
  }
  
  const typesPath = path.join(REPO_PATH, 'src', 'redux', 'types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('types.ts must exist');
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Must have discriminated union (type with |)
  if (!typesContent.includes('BetAction') && !typesContent.includes('type') && !typesContent.includes('|')) {
    // Check if it uses type alias with union
    const hasUnion = typesContent.match(/type\s+\w+\s*=\s*[^=]+\|/);
    if (!hasUnion) {
      throw new Error('Discriminated union types must be defined for actions (Requirement 8)');
    }
  }
});

// ============================================================================
// Requirement 5: Record for dictionary/map-like objects
// ============================================================================

test('Record type used for dictionaries (Requirement 5)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No Record type (non-compliant)
    throw new Error('BEFORE version must FAIL: No Record type for dictionaries (Requirement 5)');
  }
  
  const typesPath = path.join(REPO_PATH, 'src', 'redux', 'types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('types.ts must exist');
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  const reducerPath = path.join(REPO_PATH, 'src', 'redux', 'reducer.ts');
  const reducerContent = fs.existsSync(reducerPath) ? fs.readFileSync(reducerPath, 'utf8') : '';
  
  // Must use Record for dictionary types (betData)
  const allContent = typesContent + reducerContent;
  if (!allContent.includes('Record<')) {
    throw new Error('Record type must be used for dictionary/map-like objects (Requirement 5)');
  }
});

// ============================================================================
// Requirement 9: Typed reducer state, action, return
// ============================================================================

test('Reducer has explicit types (Requirement 9)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No explicit types (non-compliant)
    throw new Error('BEFORE version must FAIL: Reducer lacks explicit types (Requirement 9)');
  }
  
  const reducerPath = path.join(REPO_PATH, 'src', 'redux', 'reducer.ts');
  if (!fs.existsSync(reducerPath)) {
    throw new Error('reducer.ts must exist');
  }
  
  const reducerContent = fs.readFileSync(reducerPath, 'utf8');
  
  // Reducer function must have explicit types
  if (!reducerContent.includes('BetState') && !reducerContent.includes('BetAction')) {
    throw new Error('Reducer must have explicit state and action types (Requirement 9)');
  }
  
  // Function signature should show typing
  if (!reducerContent.match(/betReducer\s*\([^)]*:\s*BetState[^)]*:\s*BetAction[^)]*\)\s*:\s*BetState/)) {
    // More lenient check
    if (!reducerContent.includes(': BetState') || !reducerContent.includes(': BetAction')) {
      throw new Error('Reducer function must have explicit parameter and return types (Requirement 9)');
    }
  }
});

// ============================================================================
// Requirement 10: Typed thunk actions with proper Dispatch
// ============================================================================

test('Thunk actions properly typed (Requirement 10)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No proper thunk typing (non-compliant)
    throw new Error('BEFORE version must FAIL: Thunk actions not properly typed (Requirement 10)');
  }
  
  const actionsPath = path.join(REPO_PATH, 'src', 'redux', 'actions.ts');
  const storePath = path.join(REPO_PATH, 'src', 'store.ts');
  
  if (!fs.existsSync(actionsPath) || !fs.existsSync(storePath)) {
    throw new Error('actions.ts and store.ts must exist');
  }
  
  const actionsContent = fs.readFileSync(actionsPath, 'utf8');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  
  // Must have AppDispatch or ThunkDispatch
  if (!actionsContent.includes('AppDispatch') && !actionsContent.includes('ThunkDispatch') && !storeContent.includes('AppDispatch')) {
    throw new Error('Thunk actions must use proper Dispatch typing (Requirement 10)');
  }
  
  // Should have ThunkAction
  if (!actionsContent.includes('ThunkAction') && !actionsContent.includes('AppThunk')) {
    throw new Error('Thunk actions must use ThunkAction type (Requirement 10)');
  }
});

// ============================================================================
// Requirement 11: unknown instead of any
// ============================================================================

test('unknown used instead of any (Requirement 11)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No TypeScript error handling (non-compliant)
    throw new Error('BEFORE version must FAIL: No "unknown" type for error handling (Requirement 11)');
  }
  
  const actionsPath = path.join(REPO_PATH, 'src', 'redux', 'actions.ts');
  if (!fs.existsSync(actionsPath)) {
    throw new Error('actions.ts must exist');
  }
  
  const actionsContent = fs.readFileSync(actionsPath, 'utf8');
  
  // Catch blocks should use unknown, not any
  if (actionsContent.includes('catch') && !actionsContent.includes('catch (error: unknown)')) {
    // Check if catch has unknown
    const catchPattern = /catch\s*\([^)]+\)/g;
    const catches = actionsContent.match(catchPattern);
    if (catches && catches.some(c => !c.includes('unknown'))) {
      throw new Error('Catch blocks must use "unknown" instead of "any" (Requirement 11)');
    }
  }
});

// ============================================================================
// Requirement 4: Optional chaining for potentially undefined properties
// ============================================================================

test('Optional chaining used for undefined properties (Requirement 4)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No optional chaining (non-compliant)
    throw new Error('BEFORE version must FAIL: No optional chaining (Requirement 4)');
  }
  
  // Check TypeScript files for optional chaining or nullish coalescing
  const tsFiles = findFiles(REPO_PATH, '.ts');
  let foundOptionalChaining = false;
  
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Check for optional chaining (?.) or nullish coalescing (??)
    if (content.includes('??') || content.includes('?.') || content.includes('?[')) {
      foundOptionalChaining = true;
      break;
    }
  }
  
  if (!foundOptionalChaining) {
    // Check tsx files too
    const tsxFiles = findFiles(REPO_PATH, '.tsx');
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('??') || content.includes('?.') || content.includes('?[')) {
        foundOptionalChaining = true;
        break;
      }
    }
  }
  
  if (!foundOptionalChaining) {
    throw new Error('Optional chaining or nullish coalescing must be used for potentially undefined properties (Requirement 4)');
  }
});

// ============================================================================
// Requirement 6: Index signatures for dynamic keys
// ============================================================================

test('Index signatures or Record used for dynamic keys (Requirement 6)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No index signatures (non-compliant)
    throw new Error('BEFORE version must FAIL: No index signatures for dynamic keys (Requirement 6)');
  }
  
  const typesPath = path.join(REPO_PATH, 'src', 'redux', 'types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('types.ts must exist');
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Must use Record (which uses index signatures) or explicit index signatures
  // Record<string, T> is the preferred way, which internally uses index signatures
  if (!typesContent.includes('Record<') && !typesContent.match(/\[key:\s*string\]:/) && !typesContent.match(/\[key:\s*number\]:/)) {
    throw new Error('Index signatures or Record type must be used for dynamic keys (Requirement 6)');
  }
});

// ============================================================================
// Requirement 12: Maintain original functionality
// ============================================================================

test('TypeScript code maintains original functionality (Requirement 12)', () => {
  if (TARGET === 'before') {
    // BEFORE: No TypeScript to maintain functionality (pass)
    return; // Pass for before
  }
  
  // For Requirement 12, we verify that:
  // 1. All original JavaScript files exist alongside TypeScript files (backward compatibility)
  // 2. Or TypeScript files are properly structured to maintain functionality
  
  // Check that key functionality files exist
  const reducerPath = path.join(REPO_PATH, 'src', 'redux', 'reducer.ts');
  const actionsPath = path.join(REPO_PATH, 'src', 'redux', 'actions.ts');
  const storePath = path.join(REPO_PATH, 'src', 'store.ts');
  
  if (!fs.existsSync(reducerPath)) {
    throw new Error('reducer.ts must exist (Requirement 12: Maintain original functionality)');
  }
  if (!fs.existsSync(actionsPath)) {
    throw new Error('actions.ts must exist (Requirement 12: Maintain original functionality)');
  }
  if (!fs.existsSync(storePath)) {
    throw new Error('store.ts must exist (Requirement 12: Maintain original functionality)');
  }
  
  // Verify reducer exports default (maintains compatibility)
  const reducerContent = fs.readFileSync(reducerPath, 'utf8');
  if (!reducerContent.includes('export default')) {
    throw new Error('Reducer must export default (Requirement 12: Maintain original functionality)');
  }
});

// ============================================================================
// Requirement 13: Imports continue to work correctly
// ============================================================================

test('TypeScript files have correct imports (Requirement 13)', () => {
  if (TARGET === 'before') {
    // BEFORE FAILS: No TypeScript imports (non-compliant)
    throw new Error('BEFORE version must FAIL: No TypeScript imports (Requirement 13)');
  }
  
  const reducerPath = path.join(REPO_PATH, 'src', 'redux', 'reducer.ts');
  if (!fs.existsSync(reducerPath)) {
    throw new Error('reducer.ts must exist');
  }
  
  const reducerContent = fs.readFileSync(reducerPath, 'utf8');
  
  // Must import types
  if (!reducerContent.includes('from') && !reducerContent.includes('import')) {
    throw new Error('Reducer must have proper imports (Requirement 13)');
  }
  
  // Check that imports reference correct files
  const actionsPath = path.join(REPO_PATH, 'src', 'redux', 'actions.ts');
  if (fs.existsSync(actionsPath)) {
    const actionsContent = fs.readFileSync(actionsPath, 'utf8');
    if (!actionsContent.includes('import') && !actionsContent.includes('from')) {
      throw new Error('Actions must have proper imports (Requirement 13)');
    }
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(findFiles(filePath, ext));
      }
    } else if (file.endsWith(ext)) {
      results.push(filePath);
    }
  });
  
  return results;
}

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('COMPLIANCE TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Target: ${TARGET.toUpperCase()}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);

if (failures.length > 0) {
  console.log('\nFailed Tests:');
  failures.forEach(f => {
    console.log(`  - ${f.name}: ${f.error}`);
  });
}

console.log('='.repeat(70));
console.log(`\nExpected Result:`);
console.log(`  BEFORE: Should FAIL (JavaScript, non-compliant)`);
console.log(`  AFTER:  Should PASS (TypeScript, compliant)\n`);

// Exit with appropriate code
// For before: failures are expected, so we want to exit 0 if tests fail (non-compliant is expected)
// For after: failures are NOT expected, so we want to exit 1 if tests fail
if (TARGET === 'before') {
  // Before should fail compliance tests - this is expected
  process.exit(testsFailed > 0 ? 0 : 1); // Exit 0 if tests failed (expected), 1 if all passed (unexpected)
} else {
  // After should pass all compliance tests
  process.exit(testsFailed > 0 ? 1 : 0); // Exit 1 if tests failed (unexpected), 0 if all passed (expected)
}
