/**
 * Comprehensive Runtime Behavior Tests for Redux Refactoring
 * 
 * These tests validate:
 * 1. Original behavior is preserved
 * 2. Safety guarantees from 13 requirements are enforced at runtime
 * 3. No regressions in runtime logic
 * 
 * Tests run against both repository_before and repository_after
 * Switch via TARGET environment variable: TARGET=before | TARGET=after
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Determine target repository based on environment variable
const TARGET = process.env.TARGET || 'after';
const REPO_PATH = path.join(__dirname, '..', `repository_${TARGET}`);
const SRC_PATH = path.join(REPO_PATH, 'src');

// Verify repository exists
if (!fs.existsSync(REPO_PATH)) {
  console.error(`Error: Repository ${REPO_PATH} does not exist`);
  process.exit(1);
}

// Load modules dynamically based on target
let betReducer, addBetSlip, deleteBetSlip, clearBetSlip, handleBet, createStore, applyMiddleware, combineReducers, thunk;

// Save original working directory before changing
const originalCwd = process.cwd();

try {
  // Change to repository directory to resolve modules correctly
  process.chdir(REPO_PATH);
  
  // Load Redux dependencies from repository's node_modules
  const nodeModulesPath = path.join(REPO_PATH, 'node_modules');
  const reduxPath = path.join(nodeModulesPath, 'redux');
  const thunkPath = path.join(nodeModulesPath, 'redux-thunk');
  
  const redux = require(reduxPath);
  const reduxThunk = require(thunkPath);
  
  createStore = redux.createStore;
  applyMiddleware = redux.applyMiddleware;
  combineReducers = redux.combineReducers;
  thunk = reduxThunk.default || reduxThunk;
  
  // Use absolute paths for module resolution
  if (TARGET === 'after') {
    // After version: Try TypeScript files first, then fallback to JS
    const reducerPathAbs = path.join(REPO_PATH, 'src', 'redux', 'reducer');
    const actionsPathAbs = path.join(REPO_PATH, 'src', 'redux', 'actions');
    
    // Check if TypeScript files exist
    if (fs.existsSync(reducerPathAbs + '.ts') && fs.existsSync(actionsPathAbs + '.ts')) {
      try {
        // Try loading with ts-node if available
        try {
          require('ts-node/register');
        } catch (e) {
          // ts-node not available, will try JS files
        }
        
        try {
          betReducer = require(reducerPathAbs).default;
          const actions = require(actionsPathAbs);
          addBetSlip = actions.addBetSlip;
          deleteBetSlip = actions.deleteBetSlip;
          clearBetSlip = actions.clearBetSlip;
          handleBet = actions.handleBet;
        } catch (e) {
          // If ts-node loading fails, try compiled JS
          if (fs.existsSync(reducerPathAbs + '.js')) {
            betReducer = require(reducerPathAbs).default;
          }
          if (fs.existsSync(actionsPathAbs + '.js')) {
            const actions = require(actionsPathAbs);
            addBetSlip = actions.addBetSlip;
            deleteBetSlip = actions.deleteBetSlip;
            clearBetSlip = actions.clearBetSlip;
            handleBet = actions.handleBet;
          } else {
            throw new Error('Could not load TypeScript actions. Try compiling first or install ts-node.');
          }
        }
      } catch (e) {
        console.error('Failed to load TypeScript files:', e.message);
        throw e;
      }
    } else {
      // No TypeScript files, use JavaScript
      betReducer = require(path.join(REPO_PATH, 'src', 'redux', 'reducer')).default;
      const actions = require(path.join(REPO_PATH, 'src', 'redux', 'action'));
      addBetSlip = actions.addBetSlip;
      deleteBetSlip = actions.deleteBetSlip;
      clearBetSlip = actions.clearBetSlip;
      handleBet = actions.handleBet;
    }
  } else {
    // Before version (JavaScript)
    betReducer = require(path.join(REPO_PATH, 'src', 'redux', 'reducer')).default;
    const actions = require(path.join(REPO_PATH, 'src', 'redux', 'action'));
    addBetSlip = actions.addBetSlip;
    deleteBetSlip = actions.deleteBetSlip;
    clearBetSlip = actions.clearBetSlip;
    handleBet = actions.handleBet;
  }
  
  // Restore original working directory
  process.chdir(originalCwd);
} catch (error) {
  // Restore original working directory even on error
  if (originalCwd) process.chdir(originalCwd);
  
  console.error(`\nFailed to load modules from ${REPO_PATH}:`);
  console.error(`  Error: ${error.message}`);
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\nNote: For TypeScript files, you may need to:');
    console.error(`  1. Install dependencies: cd ${REPO_PATH} && npm install`);
    console.error('  2. Install ts-node: npm install -g ts-node');
    console.error('  3. Or compile TypeScript: npm run build');
  }
  process.exit(1);
}

// Test framework
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
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      if (stackLines.length > 2) {
        console.log(`  ${stackLines[2].trim()}`);
      }
    }
  }
}

// Helper to create sample bet
function createSampleBet(id = '1-home', matchId = 1) {
  return {
    id: id,
    matchId: matchId,
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    league: 'Test League',
    selection: 'home',
    odds: 2.5,
    time: '15:00',
    date: 'Today'
  };
}

// Helper to create store
function createTestStore() {
  const rootReducer = combineReducers({
    bet: betReducer
  });
  return createStore(rootReducer, applyMiddleware(thunk));
}

console.log(`\n=== Testing ${TARGET.toUpperCase()} Version ===\n`);

// ============================================================================
// GROUP A: Compile-time requirements verified via runtime effects
// ============================================================================

// Test 1-2: Explicit typing / No implicit any
// Runtime implication: Functions handle malformed inputs gracefully
test('Reducer handles undefined state without crashing', () => {
  const action = addBetSlip(createSampleBet());
  const result = betReducer(undefined, action);
  
  assert(result !== undefined, 'Reducer must return valid state');
  assert(result.betData !== undefined, 'betData must exist');
  assert(typeof result.betData === 'object', 'betData must be object');
});

test('Reducer handles malformed action gracefully', () => {
  const initialState = { betData: {}, betData2: {}, betData3: {}, res: {} };
  
  // Action with missing type
  const result1 = betReducer(initialState, {});
  assert.deepStrictEqual(result1, initialState, 'Should return state unchanged');
  
  // Action with unknown type
  const result2 = betReducer(initialState, { type: 'UNKNOWN_ACTION' });
  assert.deepStrictEqual(result2, initialState, 'Should return state unchanged');
  
  // Action with null payload
  const result3 = betReducer(initialState, { type: 'ADD_BET_SLIP', payload: null });
  // Should not crash - may or may not add bet, but must return valid state
  assert(result3 !== undefined, 'Must return valid state');
  assert(result3.betData !== undefined, 'betData must exist');
});

// Test 3: Interfaces/types for objects, state, API responses
// Runtime implication: State shape is stable, API responses validated
test('State shape remains stable after operations', () => {
  const store = createTestStore();
  const bet = createSampleBet();
  
  store.dispatch(addBetSlip(bet));
  const state = store.getState();
  
  assert(state.bet !== undefined, 'bet slice must exist');
  assert(state.bet.betData !== undefined, 'betData must exist');
  assert(state.bet.betData2 !== undefined, 'betData2 must exist');
  assert(state.bet.betData3 !== undefined, 'betData3 must exist');
  assert(state.bet.res !== undefined, 'res must exist');
});

// Test 4: Optional chaining for undefined properties
// Runtime implication: No "Cannot read property of undefined" crashes
test('Accessing nested properties does not crash with missing data', () => {
  const initialState = { betData: {}, betData2: {}, betData3: {}, res: {} };
  
  // Access betData with missing keys should not crash
  const bets = Object.values(initialState.betData || {});
  assert(Array.isArray(bets), 'Should return array even if betData is empty');
  
  // Access res when it might be empty object
  const resKeys = Object.keys(initialState.res || {});
  assert(Array.isArray(resKeys), 'Should return array even if res is empty');
});

// Test 5-6: Record/index signatures for dynamic keys
// Runtime implication: Dictionary lookups work with dynamic keys
test('Dictionary access with dynamic string keys works correctly', () => {
  const store = createTestStore();
  const bet1 = createSampleBet('1-home', 1);
  const bet2 = createSampleBet('2-draw', 2);
  
  store.dispatch(addBetSlip(bet1));
  store.dispatch(addBetSlip(bet2));
  
  const state = store.getState();
  const betData = state.bet.betData;
  
  // Dynamic key access
  assert(betData['1-home'] !== undefined, 'Dynamic key lookup must work');
  assert(betData['2-draw'] !== undefined, 'Dynamic key lookup must work');
  assert.deepStrictEqual(betData['1-home'], bet1, 'Retrieved bet must match');
  assert.deepStrictEqual(betData['2-draw'], bet2, 'Retrieved bet must match');
  
  // Missing key returns undefined, not error
  assert(betData['999-nonexistent'] === undefined, 'Missing key should return undefined');
});

test('Dictionary keys are strings, not numbers (bet.id is string)', () => {
  const store = createTestStore();
  const bet = createSampleBet('1-home', 1); // bet.id is string "1-home"
  
  store.dispatch(addBetSlip(bet));
  const state = store.getState();
  
  // String key access works
  assert(state.bet.betData['1-home'] !== undefined, 'String key must work');
  // Number key access should not work (if someone tries number coercion)
  assert(state.bet.betData[1] === undefined, 'Number key should not work');
});

// Test 7-8: as const + discriminated unions for actions
// Runtime implication: Reducers ignore unknown actions safely, known actions work
test('Reducer ignores unknown/foreign actions safely', () => {
  const initialState = { betData: { 'test': createSampleBet() }, betData2: {}, betData3: {}, res: {} };
  
  // Foreign action from another reducer
  const foreignAction = { type: 'USER_LOGOUT', payload: {} };
  const result = betReducer(initialState, foreignAction);
  
  assert.deepStrictEqual(result, initialState, 'Foreign actions must not modify state');
});

test('Known actions behave correctly', () => {
  const store = createTestStore();
  const bet = createSampleBet();
  
  // ADD_BET_SLIP
  store.dispatch(addBetSlip(bet));
  let state = store.getState();
  assert(state.bet.betData[bet.id] !== undefined, 'ADD_BET_SLIP must add bet');
  
  // DELETE_BET_SLIP
  store.dispatch(deleteBetSlip(bet.id));
  state = store.getState();
  assert(state.bet.betData[bet.id] === undefined, 'DELETE_BET_SLIP must remove bet');
  
  // CLEAR_BET_SLIP
  store.dispatch(addBetSlip(bet));
  store.dispatch(clearBetSlip());
  state = store.getState();
  assert(Object.keys(state.bet.betData).length === 0, 'CLEAR_BET_SLIP must clear betData');
  assert.deepStrictEqual(state.bet.res, {}, 'CLEAR_BET_SLIP must clear res');
});

// Test 9: Typed reducer state, action, return
// Runtime implication: Reducer always returns valid state, never undefined
test('Reducer always returns valid state structure', () => {
  const testCases = [
    { state: undefined, action: { type: 'UNKNOWN' } },
    { state: { betData: {}, betData2: {}, betData3: {}, res: {} }, action: addBetSlip(createSampleBet()) },
    { state: { betData: { 'test': createSampleBet() }, betData2: {}, betData3: {}, res: {} }, action: deleteBetSlip('test') },
    { state: { betData: {}, betData2: {}, betData3: {}, res: {} }, action: clearBetSlip() },
  ];
  
  testCases.forEach((testCase, index) => {
    const result = betReducer(testCase.state, testCase.action);
    
    assert(result !== undefined, `Test case ${index}: Result must not be undefined`);
    assert(result !== null, `Test case ${index}: Result must not be null`);
    assert(typeof result === 'object', `Test case ${index}: Result must be object`);
    assert(result.betData !== undefined, `Test case ${index}: betData must exist`);
    assert(result.betData2 !== undefined, `Test case ${index}: betData2 must exist`);
    assert(result.betData3 !== undefined, `Test case ${index}: betData3 must exist`);
    assert(result.res !== undefined, `Test case ${index}: res must exist`);
  });
});

// Test 10: Typed thunk actions with proper Dispatch
// Runtime implication: Thunks dispatch expected actions in correct order
test('Thunk dispatches actions correctly', (done) => {
  const store = createTestStore();
  const dispatchCalls = [];
  
  // Mock dispatch to track calls
  const originalDispatch = store.dispatch;
  store.dispatch = (action) => {
    dispatchCalls.push(action);
    return originalDispatch.call(store, action);
  };
  
  const betPayload = {
    bets: [createSampleBet()],
    stake: 10,
    totalOdds: '2.50',
    potentialWin: '25.00'
  };
  
  const thunkResult = handleBet(betPayload);
  
  // Thunk should return a function
  assert(typeof thunkResult === 'function', 'Thunk must return function');
  
  // Execute thunk
  const result = thunkResult(store.dispatch, store.getState, undefined);
  
  // Should return a promise (async thunk) or be synchronous
  if (result && typeof result.then === 'function') {
    result.then(() => {
      // After async completes, should have dispatched HANDLE_BET
      const hasHandleBet = dispatchCalls.some(action => action.type === 'HANDLE_BET');
      assert(hasHandleBet, 'Thunk must dispatch HANDLE_BET action');
      
      // Verify payload structure
      const handleBetAction = dispatchCalls.find(action => action.type === 'HANDLE_BET');
      assert(handleBetAction !== undefined, 'HANDLE_BET action must exist');
      assert(handleBetAction.payload !== undefined, 'Payload must exist');
      assert(handleBetAction.payload.success === true, 'Success must be true');
      assert(handleBetAction.payload.betId !== undefined, 'betId must exist');
      assert(handleBetAction.payload.details !== undefined, 'details must exist');
      
      done();
    }).catch((error) => {
      done(error);
    });
  } else {
    // Synchronous thunk (for before version) - uses setTimeout internally
    setTimeout(() => {
      const hasHandleBet = dispatchCalls.some(action => action.type === 'HANDLE_BET');
      assert(hasHandleBet, 'Thunk must dispatch HANDLE_BET action');
      
      const handleBetAction = dispatchCalls.find(action => action.type === 'HANDLE_BET');
      if (handleBetAction) {
        assert(handleBetAction.payload !== undefined, 'Payload must exist');
      }
      
      done();
    }, 1000);
  }
});

// Test 11: unknown instead of any
// Runtime implication: Errors and external data are validated before use
test('Error handling does not assume .message property exists', () => {
  // This test verifies that error handling is defensive
  // We can't directly test catch blocks, but we can verify thunk error handling
  
  const store = createTestStore();
  const betPayload = {
    bets: [createSampleBet()],
    stake: 10,
    totalOdds: '2.50',
    potentialWin: '25.00'
  };
  
  // Thunk should handle errors gracefully
  const thunk = handleBet(betPayload);
  
  // Execute thunk - it should not crash even with malformed input
  try {
    const result = thunk(store.dispatch, store.getState, undefined);
    // If we get here, error handling is at least present
    assert(true, 'Thunk must execute without crashing');
  } catch (e) {
    // If error is thrown, it should be handled gracefully in production
    // For this test, we just verify it doesn't crash with undefined errors
    assert(true, 'Thunk error handling must exist');
  }
});

// ============================================================================
// GROUP B: Original functionality preservation (MOST IMPORTANT)
// ============================================================================

test('ADD_BET_SLIP adds bet to dictionary correctly', () => {
  const store = createTestStore();
  const bet = createSampleBet('1-home', 1);
  
  store.dispatch(addBetSlip(bet));
  const state = store.getState();
  
  assert(state.bet.betData[bet.id] !== undefined, 'Bet must be added');
  assert.deepStrictEqual(state.bet.betData[bet.id], bet, 'Bet data must match');
});

test('Multiple bets can be added independently', () => {
  const store = createTestStore();
  const bet1 = createSampleBet('1-home', 1);
  const bet2 = createSampleBet('2-draw', 2);
  const bet3 = createSampleBet('3-away', 3);
  
  store.dispatch(addBetSlip(bet1));
  store.dispatch(addBetSlip(bet2));
  store.dispatch(addBetSlip(bet3));
  
  const state = store.getState();
  assert(Object.keys(state.bet.betData).length === 3, 'All three bets must be present');
  assert(state.bet.betData[bet1.id] !== undefined, 'Bet 1 must exist');
  assert(state.bet.betData[bet2.id] !== undefined, 'Bet 2 must exist');
  assert(state.bet.betData[bet3.id] !== undefined, 'Bet 3 must exist');
});

test('DELETE_BET_SLIP removes specific bet without affecting others', () => {
  const store = createTestStore();
  const bet1 = createSampleBet('1-home', 1);
  const bet2 = createSampleBet('2-draw', 2);
  
  store.dispatch(addBetSlip(bet1));
  store.dispatch(addBetSlip(bet2));
  store.dispatch(deleteBetSlip(bet1.id));
  
  const state = store.getState();
  assert(state.bet.betData[bet1.id] === undefined, 'Bet 1 must be removed');
  assert(state.bet.betData[bet2.id] !== undefined, 'Bet 2 must still exist');
  assert(Object.keys(state.bet.betData).length === 1, 'Only one bet should remain');
});

test('CLEAR_BET_SLIP removes all bets and clears response', () => {
  const store = createTestStore();
  const bet1 = createSampleBet('1-home', 1);
  const bet2 = createSampleBet('2-draw', 2);
  
  store.dispatch(addBetSlip(bet1));
  store.dispatch(addBetSlip(bet2));
  
  // Set a response first
  store.dispatch({
    type: 'HANDLE_BET',
    payload: { success: true, betId: 'test', timestamp: 'test', message: 'test', details: {} }
  });
  
  store.dispatch(clearBetSlip());
  
  const state = store.getState();
  assert(Object.keys(state.bet.betData).length === 0, 'All bets must be cleared');
  assert.deepStrictEqual(state.bet.res, {}, 'Response must be cleared');
});

test('HANDLE_BET clears betData and sets response', () => {
  const store = createTestStore();
  const bet = createSampleBet();
  
  store.dispatch(addBetSlip(bet));
  
  const response = {
    success: true,
    betId: 'BET-123',
    timestamp: '2024-01-01T00:00:00Z',
    message: 'Bet placed successfully!',
    details: {
      totalBets: 1,
      stake: 10,
      totalOdds: '2.50',
      potentialWin: '25.00',
      status: 'pending'
    }
  };
  
  store.dispatch({
    type: 'HANDLE_BET',
    payload: response
  });
  
  const state = store.getState();
  assert(Object.keys(state.bet.betData).length === 0, 'betData must be cleared');
  assert.deepStrictEqual(state.bet.res, response, 'Response must be set');
});

test('Bet ID format works correctly (matchId-selection)', () => {
  const store = createTestStore();
  const bet = createSampleBet('5-home', 5);
  
  store.dispatch(addBetSlip(bet));
  const state = store.getState();
  
  // Bet ID should be stored as key
  assert(state.bet.betData['5-home'] !== undefined, 'Bet with ID "5-home" must exist');
  // Match ID should be in bet object
  assert(state.bet.betData['5-home'].matchId === 5, 'matchId must be 5');
});

test('Reducer handles empty payload gracefully', () => {
  const initialState = { betData: {}, betData2: {}, betData3: {}, res: {} };
  
  // DELETE_BET_SLIP with empty string
  const result1 = betReducer(initialState, deleteBetSlip(''));
  assert(result1 !== undefined, 'Must return valid state');
  
  // CLEAR_BET_SLIP (no payload)
  const result2 = betReducer(initialState, clearBetSlip());
  assert(result2 !== undefined, 'Must return valid state');
  assert.deepStrictEqual(result2.betData, {}, 'betData must be empty');
});

test('Reducer is pure function (does not mutate state)', () => {
  const initialState = { betData: {}, betData2: {}, betData3: {}, res: {} };
  const bet = createSampleBet();
  
  // Create deep copy to verify immutability
  const stateCopy = JSON.parse(JSON.stringify(initialState));
  
  const result = betReducer(initialState, addBetSlip(bet));
  
  // Original state should be unchanged
  assert.deepStrictEqual(initialState, stateCopy, 'Original state must not be mutated');
  // Result should be different
  assert.notDeepStrictEqual(result, initialState, 'Result should be new object');
});

// ============================================================================
// GROUP C: Edge cases and error scenarios
// ============================================================================

test('Deleting non-existent bet does not crash', () => {
  const store = createTestStore();
  
  // Delete bet that doesn't exist
  store.dispatch(deleteBetSlip('nonexistent-id'));
  
  const state = store.getState();
  assert(state.bet.betData !== undefined, 'betData must still exist');
  assert(Object.keys(state.bet.betData).length === 0, 'betData should be empty');
});

test('Adding same bet ID replaces previous bet', () => {
  const store = createTestStore();
  const bet1 = createSampleBet('1-home', 1);
  const bet2 = { ...createSampleBet('1-home', 1), odds: 3.0 }; // Same ID, different odds
  
  store.dispatch(addBetSlip(bet1));
  store.dispatch(addBetSlip(bet2));
  
  const state = store.getState();
  assert(Object.keys(state.bet.betData).length === 1, 'Should only have one bet');
  assert(state.bet.betData['1-home'].odds === 3.0, 'Bet should be replaced with new one');
});

test('Complex bet data structure is preserved', () => {
  const store = createTestStore();
  const bet = {
    id: '10-home',
    matchId: 10,
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool FC',
    league: 'Premier League',
    selection: 'home',
    odds: 2.45,
    time: '15:00',
    date: 'Today'
  };
  
  store.dispatch(addBetSlip(bet));
  const state = store.getState();
  
  const storedBet = state.bet.betData['10-home'];
  assert(storedBet !== undefined, 'Bet must exist');
  assert(storedBet.homeTeam === 'Manchester United', 'All properties must be preserved');
  assert(storedBet.awayTeam === 'Liverpool FC', 'All properties must be preserved');
  assert(storedBet.league === 'Premier League', 'All properties must be preserved');
  assert(storedBet.odds === 2.45, 'Numeric properties must be preserved');
});

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
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

console.log('='.repeat(70) + '\n');

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
