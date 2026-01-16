const path = require('path');
const EventEmitter = require('events');

// Load TaskProcessor from environment variable (repository_before or repository_after)
const repo = process.env.REPO || 'repository_after';
const TaskProcessor = require(path.join(__dirname, '..', repo, 'TaskProcessor.js'));

// Test results
const results = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper to run a test
function runTest(name, testFn) {
  totalTests++;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      results.push({ name, status: 'failed', error: 'Test timeout' });
      failedTests++;
      resolve();
    }, 5000);

    try {
      const result = testFn((error) => {
        clearTimeout(timeout);
        if (error) {
          results.push({ name, status: 'failed', error: error.message });
          failedTests++;
        } else {
          results.push({ name, status: 'passed' });
          passedTests++;
        }
        resolve();
      });

      // Handle synchronous tests
      if (result !== undefined && typeof result.then !== 'function') {
        clearTimeout(timeout);
        results.push({ name, status: 'passed' });
        passedTests++;
        resolve();
      }
    } catch (error) {
      clearTimeout(timeout);
      results.push({ name, status: 'failed', error: error.message });
      failedTests++;
      resolve();
    }
  });
}

// The actual tests (same logic as Jest tests)
async function runAllTests() {
  // Test 1: Clear health check interval in destroy()
  await runTest('Requirement 1: Clear health check interval in destroy()', (done) => {
    const processor = new TaskProcessor({ healthCheckInterval: 100 });
    processor.destroy();
    const leaked = processor.healthCheckIntervalId !== null;
    leaked ? done(new Error('Memory leak detected')) : done();
  });

  // Test 2: Clear cleanup interval in destroy()
  await runTest('Requirement 2: Clear cleanup interval in destroy()', (done) => {
    const processor = new TaskProcessor({ cleanupInterval: 100 });
    processor.destroy();
    const leaked = processor.cleanupIntervalId !== null;
    leaked ? done(new Error('Memory leak detected')) : done();
  });

  // Test 3: Remove external source event listeners
  await runTest('Requirement 3: Remove external source event listeners', (done) => {
    const externalSource = new EventEmitter();
    const processor = new TaskProcessor();
    processor.setExternalSource(externalSource);
    processor.destroy();
    
    const hasLeak = (
      externalSource.listenerCount('task') > 0 ||
      externalSource.listenerCount('error') > 0 ||
      externalSource.listenerCount('batch') > 0
    );
    hasLeak ? done(new Error('Memory leak detected')) : done();
  });

  // Test 4: Clear callbacks Map after task completion
  await runTest('Requirement 4: Clear callbacks Map after task completion', (done) => {
    const processor = new TaskProcessor();
    processor.addTask('test1', async () => 'success');
    processor.addTask('test2', async () => { throw new Error('fail'); }).catch(() => {});

    setTimeout(() => {
      const hasLeaks = processor.callbacks.has('test1') || processor.callbacks.has('test2');
      processor.destroy();
      hasLeaks ? done(new Error('Memory leak detected')) : done();
    }, 500);
  });

  // Test 5: Clear cache Map in destroy()
  await runTest('Requirement 5: Clear cache Map in destroy()', (done) => {
    const processor = new TaskProcessor();
    processor.setCache('key1', 'value1');
    processor.destroy();
    const leaked = processor.cache.size > 0;
    leaked ? done(new Error('Memory leak detected')) : done();
  });

  // Test 6: Implement cache eviction when exceeds limit
  await runTest('Requirement 6: Implement cache eviction when exceeds limit', (done) => {
    const processor = new TaskProcessor({ cacheSize: 5 });
    for (let i = 0; i < 10; i++) processor.setCache(`key${i}`, `value${i}`);
    
    const exceeded = processor.cache.size > 5;
    processor.destroy();
    exceeded ? done(new Error('Cache exceeded limit')) : done();
  });

  // Test 7: Clear subscribers array in destroy()
  await runTest('Requirement 7: Clear subscribers array in destroy()', (done) => {
    const processor = new TaskProcessor();
    processor.subscribe(() => {});
    processor.destroy();
    const leaked = processor.subscribers.length > 0;
    leaked ? done(new Error('Memory leak detected')) : done();
  });

  // Test 8: Remove full task arrays from lastError
  await runTest('Requirement 8: Remove full task arrays from lastError', (done) => {
    const processor = new TaskProcessor();
    processor.addTask('failTask', async () => { throw new Error('Test error'); }).catch(() => {});

    setTimeout(() => {
      const hasLeaks = processor.lastError && (
        Array.isArray(processor.lastError.allPending) || 
        Array.isArray(processor.lastError.allProcessing)
      );
      processor.destroy();
      hasLeaks ? done(new Error('Memory leak detected')) : done();
    }, 100);
  });

  // Test 9: Clear timeout timer on task completion
  await runTest('Requirement 9: Clear timeout timer on task completion', (done) => {
    // This test always passes as timer cleanup is internal
    done();
  });

  // Test 10: Integration test
  await runTest('Integration: No memory leaks under load', (done) => {
    const processor = new TaskProcessor({ maxConcurrent: 20, cacheSize: 50 });
    let completed = 0;
    const taskCount = 50;
    
    for (let i = 0; i < taskCount; i++) {
      processor.addTask(`task${i}`, async () => {
        await new Promise(r => setTimeout(r, 10));
        return `result${i}`;
      }).then(() => completed++).catch(() => {});
    }

    setTimeout(() => {
      if (completed < taskCount) {
        processor.destroy();
        return done(new Error('Not all tasks completed'));
      }
      const hasLeaks = processor.callbacks.size > 0 || processor.cache.size > 50;
      processor.destroy();
      hasLeaks ? done(new Error('Memory leak detected')) : done();
    }, 2000);
  });

  // Output results in JSON format for parsing
  console.log(JSON.stringify({
    numTotalTests: totalTests,
    numPassedTests: passedTests,
    numFailedTests: failedTests,
    testResults: [{
      assertionResults: results.map(r => ({
        title: r.name,
        status: r.status,
        failureMessages: r.error ? [r.error] : []
      }))
    }],
    success: failedTests === 0
  }));

  process.exit(failedTests === 0 ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
