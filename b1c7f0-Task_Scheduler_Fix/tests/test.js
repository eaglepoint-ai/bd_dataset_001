const assert = require('assert');
const TaskSchedulerBefore = require('../repository_before/TaskScheduler');
const TaskSchedulerAfter = require('../repository_after/TaskScheduler');

const mode = (process.argv[2] || 'after').toLowerCase(); // before | after | both

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('run_timeout')), ms)),
  ]);
}

async function testCycleDetection(Scheduler, name, strict) {
  const scheduler = new Scheduler();
  scheduler.addTask({ id: 'A', fn: async () => {}, dependencies: ['C'] });
  scheduler.addTask({ id: 'B', fn: async () => {}, dependencies: ['A'] });
  scheduler.addTask({ id: 'C', fn: async () => {}, dependencies: ['B'] });

  try {
    await withTimeout(scheduler.run(), 1500);
    if (strict) throw new Error('Expected cycle detection to throw');
    console.log(`(before) cycle detection did not throw`);
  } catch (err) {
    if (strict) {
      assert.ok(
        err.message.includes('Circular dependency detected'),
        `${name} wrong cycle error: ${err.message}`
      );
      console.log(`✅ ${name} cycle detection passed`);
    } else {
      console.log(`(before) cycle detection failed as expected: ${err.message}`);
    }
  }
}

async function testConcurrency(Scheduler, name, strict) {
  const maxConcurrent = 2;
  const scheduler = new Scheduler({ maxConcurrent });
  let running = 0;
  let maxRunning = 0;
  for (let i = 0; i < 5; i++) {
    scheduler.addTask({
      id: `T${i}`,
      fn: async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await sleep(100);
        running--;
      },
    });
  }
  await withTimeout(scheduler.run(), 5000);
  if (strict) {
    assert.ok(maxRunning <= maxConcurrent, `${name} exceeded maxConcurrent: ${maxRunning}`);
    console.log(`✅ ${name} concurrency passed (max ${maxRunning})`);
  } else {
    console.log(`(before) concurrency max observed ${maxRunning}`);
  }
}

async function testRetryDelays(Scheduler, name, strict) {
  const scheduler = new Scheduler({ maxConcurrent: 1, baseDelay: 100, maxDelay: 500 });
  const timestamps = [];
  scheduler.addTask({
    id: 'R',
    retries: 3,
    fn: async () => {
      timestamps.push(Date.now());
      if (timestamps.length < 4) throw new Error('fail');
      return 'ok';
    },
  });
  await withTimeout(scheduler.run(), 5000);
  if (strict) {
    const d1 = timestamps[1] - timestamps[0];
    const d2 = timestamps[2] - timestamps[1];
    const d3 = timestamps[3] - timestamps[2];
    assert.ok(d1 >= 90 && d1 < 250, `${name} retry1 delay ~100ms, got ${d1}`);
    assert.ok(d2 >= 180 && d2 < 400, `${name} retry2 delay ~200ms, got ${d2}`);
    assert.ok(d3 >= 360 && d3 < 600, `${name} retry3 delay ~400ms, got ${d3}`);
    console.log(`✅ ${name} retry backoff passed (${d1}/${d2}/${d3} ms)`);
  } else {
    console.log(`(before) retry timestamps: ${timestamps.join(', ')}`);
  }
}

async function testDependencyFailure(Scheduler, name, strict) {
  const scheduler = new Scheduler({ maxConcurrent: 1 });
  scheduler.addTask({ id: 'A', fn: async () => { throw new Error('A fail'); } });
  scheduler.addTask({ id: 'B', dependencies: ['A'], fn: async () => 'B' });

  try {
    await withTimeout(scheduler.run(), 1500);
  } catch (err) {
    if (!strict) {
      console.log(`(before) dependency failure run did not finish: ${err.message}`);
      return;
    }
    throw err;
  }

  const statusB = scheduler.getStatus('B');
  if (strict) {
    assert.ok(statusB && statusB.status === 'failed', `${name} B should be failed`);
    console.log(`✅ ${name} dependency failure propagation passed`);
  } else {
    console.log(`(before) dependency failure status B: ${statusB?.status}`);
  }
}

async function testTimeoutCleanup(Scheduler, name, strict) {
  const scheduler = new Scheduler({ maxConcurrent: 1, defaultTimeout: 200 });
  scheduler.addTask({
    id: 'quick',
    fn: async () => {
      await sleep(50);
      return 'done';
    },
    timeout: 500,
  });

  await withTimeout(scheduler.run(), 5000);
  await sleep(50);

  if (!strict) {
    console.log(`(before) timeout cleanup: not enforced`);
    return;
  }

  const lingering = scheduler.timeouts?.size ?? 0;
  assert.strictEqual(lingering, 0, `${name} lingering timeouts: ${lingering}`);
  console.log(`✅ ${name} timeout cleanup passed`);
}

async function testCancel(Scheduler, name, strict) {
  const scheduler = new Scheduler({ maxConcurrent: 1 });
  scheduler.addTask({ id: 'P', fn: async () => 'pending' });
  const cancelledPending = scheduler.cancel('P');

  scheduler.addTask({
    id: 'R',
    fn: async (signal) => {
      await sleep(1000);
      if (signal?.aborted) throw new Error('aborted');
      return 'done';
    }
  });

  const runPromise = scheduler.run();
  await sleep(50);
  const cancelledRunning = scheduler.cancel('R');
  await Promise.race([runPromise, sleep(1500)]);

  if (strict) {
    assert.ok(cancelledPending, `${name} pending cancel failed`);
    assert.ok(cancelledRunning, `${name} running cancel failed`);
    console.log(`✅ ${name} cancel pending/running passed`);
  } else {
    console.log(`(before) cancel pending:${cancelledPending} running:${cancelledRunning}`);
  }
}

async function runSuite(Scheduler, name, strict) {
  console.log(`\n=== Running ${name} (${strict ? 'strict' : 'baseline'}) ===\n`);
  await testCycleDetection(Scheduler, name, strict);
  await testConcurrency(Scheduler, name, strict);
  await testRetryDelays(Scheduler, name, strict);
  await testDependencyFailure(Scheduler, name, strict);
  await testTimeoutCleanup(Scheduler, name, strict);
  await testCancel(Scheduler, name, strict);
  console.log(`\n=== ${name} complete ===\n`);
}

(async () => {
  if (mode === 'before') {
    await runSuite(TaskSchedulerBefore, 'repository_before', false);
    process.exit(0);
  }

  if (mode === 'both') {
    await runSuite(TaskSchedulerBefore, 'repository_before', false);
    await runSuite(TaskSchedulerAfter, 'repository_after', true);
    console.log('✅ Done (both)');
    process.exit(0);
  }

  // default: after
  await runSuite(TaskSchedulerAfter, 'repository_after', true);
  console.log('✅ Done (after)');
  process.exit(0);
})().catch(err => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});