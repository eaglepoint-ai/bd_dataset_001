# Task Scheduler Fix - Implementation Trajectory

## 1. Audit the Original Code (Identify Critical Bugs)

I audited the original `repository_before/TaskScheduler.js` implementation and identified critical bugs that prevented production use:

**Major Issues Found:**

- **No cycle detection**: Circular dependencies cause infinite loops (A→B→C→A)
- **Race conditions on concurrency**: Uses `Object.keys(this.running).length` which isn't atomic
- **Memory leaks**: Timeout timers never cleared when tasks complete
- **No dependency failure propagation**: Failed task dependencies leave dependent tasks stuck in pending forever
- **Missing exponential backoff**: Retries happen immediately without delay
- **O(n log n) priority sorting**: Sorts entire task array every loop iteration
- **No cancellation support**: Running tasks cannot be aborted
- **No AbortController**: Tasks don't receive abort signals

These violations meant the scheduler worked for simple cases but failed catastrophically on real-world workloads with complex dependencies, high concurrency, and production failure scenarios.

**Learn more:**
- Circular dependency detection algorithms: https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search
- Exponential backoff best practices: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/

---

## 2. Define Requirements First

I established reliability and performance requirements as the contract before writing any code:

**Mandatory Requirements (MUST FIX):**
1. **Cycle detection** - Detect circular dependencies before run(), throw with path
2. **Dependency failure propagation** - Recursively mark all dependents as failed
3. **Atomic concurrency control** - Respect maxConcurrent strictly, no race conditions
4. **Timeout cleanup** - Clear all timers when tasks complete/fail
5. **Exponential backoff retry** - Formula: `delay = min(baseDelay * 2^attempt, maxDelay)`
6. **Cancel running tasks** - Support AbortController for graceful cancellation

**Bonus Requirements:**
7. **Priority queue efficiency** - O(log n) heap instead of O(n log n) sort
8. **Event emission** - Extend EventEmitter for observability
9. **Pause/resume** - Stop scheduling new tasks while letting running ones finish
10. **Graceful shutdown** - Wait for running tasks, reject pending
11. **Result caching** - Return cached results for completed tasks

**Performance Contract:**
- Handle 100+ concurrent tasks without memory leaks
- No race conditions under Promise.all() concurrency
- O(log n) task selection instead of O(n log n)
- Maintain exact same public API: `addTask()`, `run()`, `cancel()`, `getStatus()`

**Learn more:**
- AbortController API: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- EventEmitter patterns: https://nodejs.org/api/events.html

---

## 3. Redesign Scheduler Architecture

I redesigned from a simple loop-based approach to a robust event-driven architecture:

**Architectural Changes:**

**Before (Fragile):**
```javascript
class TaskScheduler {
  constructor() {
    this.tasks = [];
    this.running = {};
    // No EventEmitter
    // No timeout tracking
    // No abort controllers
  }
  
  async run() {
    while (tasks pending) {
      available.sort((a, b) => b.priority - a.priority); // O(n log n) every loop!
      const toRun = available.slice(0, maxConcurrent - Object.keys(this.running).length); // ❌ Race condition
      // No cycle detection
      // No cleanup
    }
  }
}
```

**After (Robust):**
```javascript
class TaskScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.runningCount = 0; // ✓ Atomic concurrency
    this.timeouts = new Map(); // ✓ Timeout tracking
    this.abortControllers = new Map(); // ✓ Cancellation support
    this.baseDelay = options.baseDelay || 100;
    this.maxDelay = options.maxDelay || 5000;
    this.isPaused = false;
    this.isShuttingDown = false;
  }
  
  async run() {
    this._detectCycles(); // ✓ Upfront validation
    // ... event-driven execution with cleanup
  }
}
```

**Key Design Decisions:**

1. **Extend EventEmitter** - Enables observability (taskStart, taskComplete, taskFail, taskRetry, taskCancel)
2. **Atomic runningCount** - Prevents race conditions under concurrent task completion
3. **Timeout/abort tracking** - Maps for proper cleanup
4. **State flags** - isPaused, isShuttingDown for lifecycle management

**Learn more:**
- EventEmitter inheritance: https://nodejs.org/api/events.html#class-eventemitter

---

## 4. Implement Cycle Detection (DFS)

I implemented depth-first search to detect circular dependencies before execution:

**Algorithm:**

```javascript
_detectCycles() {
  const visited = new Set();
  const recursionStack = new Set();
  const path = [];
  
  const dfs = (taskId) => {
    if (recursionStack.has(taskId)) {
      // Cycle detected! Build path string
      const cycleStart = path.indexOf(taskId);
      const cyclePath = [...path.slice(cycleStart), taskId].join(' → ');
      throw new Error(`Circular dependency detected: ${cyclePath}`);
    }
    
    if (visited.has(taskId)) return;
    
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);
    
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      for (const dep of task.dependencies) {
        dfs(dep);
      }
    }
    
    recursionStack.delete(taskId);
    path.pop();
  };
  
  for (const task of this.tasks) {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  }
}
```

**Benefits:**
- Detects cycles before any execution starts
- Provides human-readable cycle path in error message
- Prevents infinite loops that would crash production

**Learn more:**
- DFS cycle detection: https://www.geeksforgeeks.org/detect-cycle-in-a-graph/
- Topological sorting: https://en.wikipedia.org/wiki/Topological_sorting

---

## 5. Fix Concurrency Control (Atomic Counter)

I replaced the race-prone `Object.keys()` approach with an atomic counter:

**Before (Race Condition):**
```javascript
async run() {
  while (/* ... */) {
    // ❌ RACE CONDITION: Multiple tasks can complete between these two lines
    const runningCount = Object.keys(this.running).length;
    const toRun = available.slice(0, this.maxConcurrent - runningCount);
    
    for (const task of toRun) {
      this.running[task.id] = task;
      this.executeTask(task).then(() => {
        delete this.running[task.id]; // Not atomic!
      });
    }
  }
}
```

**After (Atomic):**
```javascript
constructor() {
  this.runningCount = 0; // Atomic counter
}

async _executeTask(task) {
  this.runningCount++; // ✓ Increment before execution
  this.running[task.id] = task;
  
  try {
    const result = await /* ... */;
    return result;
  } finally {
    this.runningCount--; // ✓ Always decrement in finally block
    delete this.running[task.id];
  }
}

async run() {
  while (/* ... */) {
    const available = /* ... */;
    const canRun = this.maxConcurrent - this.runningCount; // ✓ Atomic read
    const toRun = available.slice(0, canRun);
    
    await Promise.all(toRun.map(t => this._executeTask(t)));
  }
}
```

**Why This Fixes the Race:**
- `runningCount` is always accurate because increment/decrement happen in the same tick
- `finally` block ensures decrement even on errors
- No time gap between checking count and starting tasks

**Learn more:**
- Promise.all() concurrency: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
- Race conditions in async JavaScript: https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

---

## 6. Add Timeout Cleanup and Exponential Backoff

I implemented proper timeout management and exponential backoff for retries:

**Timeout Cleanup:**

```javascript
constructor() {
  this.timeouts = new Map(); // Track all active timeouts
}

async _executeTask(task) {
  // Set timeout
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
    }, task.timeout);
  });
  this.timeouts.set(task.id, timeoutId);
  
  try {
    const result = await Promise.race([taskPromise, timeoutPromise]);
    return result;
  } finally {
    // ✓ Always cleanup timeout
    clearTimeout(this.timeouts.get(task.id));
    this.timeouts.delete(task.id);
  }
}
```

**Exponential Backoff:**

```javascript
async _scheduleRetry(task) {
  const attempt = task.attempts;
  const delay = Math.min(
    this.baseDelay * Math.pow(2, attempt), // 2^attempt
    this.maxDelay
  );
  
  task.status = 'retrying';
  this.emit('taskRetry', task.id, attempt, delay);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  task.status = 'pending';
}
```

**Retry Sequence Example:**
- Attempt 0: 100ms * 2^0 = 100ms
- Attempt 1: 100ms * 2^1 = 200ms
- Attempt 2: 100ms * 2^2 = 400ms
- Attempt 3: 100ms * 2^3 = 800ms (or maxDelay if lower)

**Learn more:**
- Exponential backoff: https://en.wikipedia.org/wiki/Exponential_backoff
- Timeout patterns: https://github.com/sindresorhus/p-timeout

---

## 7. Implement Task Cancellation with AbortController

I added full cancellation support for both pending and running tasks:

**Implementation:**

```javascript
constructor() {
  this.abortControllers = new Map(); // Track AbortControllers
}

async _executeTask(task) {
  // Create AbortController for this task
  const controller = new AbortController();
  this.abortControllers.set(task.id, controller);
  
  try {
    // Pass signal to task function
    const result = await task.fn(controller.signal);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      task.status = 'cancelled';
      throw err;
    }
    throw err;
  } finally {
    this.abortControllers.delete(task.id);
  }
}

cancel(taskId) {
  const task = this.tasks.find(t => t.id === taskId);
  if (!task) return false;
  
  if (task.status === 'pending') {
    // Remove from queue
    task.status = 'cancelled';
    this.emit('taskCancel', taskId);
    return true;
  }
  
  if (task.status === 'running') {
    // Abort via AbortController
    const controller = this.abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.emit('taskCancel', taskId);
      return true;
    }
  }
  
  return false;
}
```

**Usage in Task Function:**

```javascript
scheduler.addTask({
  id: 'longTask',
  fn: async (signal) => {
    // Check if aborted
    if (signal?.aborted) throw new Error('Aborted');
    
    await someAsyncWork();
    
    // Check again
    if (signal?.aborted) throw new Error('Aborted');
    
    return result;
  }
});
```

**Learn more:**
- AbortController API: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- Cancellable async patterns: https://github.com/tc39/proposal-cancellation

---

## 8. Add Dependency Failure Propagation

I implemented recursive dependency failure to prevent stuck tasks:

**Implementation:**

```javascript
_markDependentsFailed(failedTaskId, reason) {
  const dependents = this.tasks.filter(t => 
    t.dependencies.includes(failedTaskId) && 
    (t.status === 'pending' || t.status === 'retrying')
  );
  
  for (const dependent of dependents) {
    dependent.status = 'failed';
    dependent.error = new Error(
      `Dependency '${failedTaskId}' failed: ${reason}`
    );
    this.failed[dependent.id] = dependent.error;
    this.emit('taskFail', dependent.id, dependent.error);
    
    // ✓ Recursive: mark their dependents as failed too
    this._markDependentsFailed(dependent.id, dependent.error.message);
  }
}

async _executeTask(task) {
  try {
    const result = await /* ... */;
    task.status = 'completed';
    this.completed[task.id] = result;
  } catch (error) {
    if (task.attempts >= task.retries) {
      task.status = 'failed';
      this.failed[task.id] = error;
      
      // ✓ Propagate failure
      this._markDependentsFailed(task.id, error.message);
    }
  }
}
```

**Example:**
```
A (fails) → B (depends on A) → C (depends on B)
                ↓
A fails → B marked failed → C marked failed
```

**Learn more:**
- Dependency graphs: https://en.wikipedia.org/wiki/Dependency_graph
- Failure propagation patterns: https://martinfowler.com/articles/patterns-of-distributed-systems/

---

## 9. Add Event Emission and Observability

I extended EventEmitter to provide full observability:

**Events Emitted:**

```javascript
class TaskScheduler extends EventEmitter {
  // ...
  
  async _executeTask(task) {
    this.emit('taskStart', task.id); // ✓ Started
    
    try {
      const result = await task.fn(signal);
      task.status = 'completed';
      this.emit('taskComplete', task.id, result); // ✓ Completed
      return result;
    } catch (error) {
      if (task.attempts < task.retries) {
        this.emit('taskRetry', task.id, task.attempts, delay); // ✓ Retrying
      } else {
        this.emit('taskFail', task.id, error); // ✓ Failed
      }
    }
  }
  
  cancel(taskId) {
    // ...
    this.emit('taskCancel', taskId); // ✓ Cancelled
  }
}
```

**Usage:**

```javascript
const scheduler = new TaskScheduler();

scheduler.on('taskStart', (id) => console.log(`Started: ${id}`));
scheduler.on('taskComplete', (id, result) => console.log(`Done: ${id} = ${result}`));
scheduler.on('taskFail', (id, error) => console.error(`Failed: ${id}`, error));
scheduler.on('taskRetry', (id, attempt, delay) => console.log(`Retry #${attempt} in ${delay}ms`));
scheduler.on('taskCancel', (id) => console.log(`Cancelled: ${id}`));
```

**Learn more:**
- EventEmitter patterns: https://nodejs.org/api/events.html
- Observability best practices: https://www.honeycomb.io/blog/observability-101-terminology-and-concepts

---

## 10. Result: Production-Ready Scheduler with Measurable Improvements

The refactored implementation achieves all requirements with measurable improvements:

**Verification Results:**

✅ **Cycle detection** - Throws `Circular dependency detected: A → B → C → A`
✅ **Concurrency control** - Never exceeds maxConcurrent, no race conditions
✅ **Exponential backoff** - Delays follow 2^attempt pattern (100ms, 200ms, 400ms)
✅ **Dependency failure** - Failed dependencies propagate recursively
✅ **Timeout cleanup** - Zero lingering timers after completion
✅ **Task cancellation** - Supports both pending removal and running abort
✅ **Event emission** - All lifecycle events emitted correctly
✅ **Pause/resume** - Stops new tasks, lets running complete
✅ **Result caching** - Returns cached results unless force=true
✅ **Graceful shutdown** - Waits for running, rejects pending

**Performance Improvements:**

| Metric | Before | After |
|--------|--------|-------|
| Cycle detection | ❌ None | ✅ O(V+E) DFS |
| Concurrency control | ❌ Race conditions | ✅ Atomic counter |
| Priority sorting | ❌ O(n log n) every loop | ✅ O(log n) heap (bonus) |
| Timeout cleanup | ❌ Memory leaks | ✅ Proper cleanup |
| Retry delays | ❌ Immediate | ✅ Exponential backoff |
| Cancellation | ❌ Not supported | ✅ AbortController |
| Dependency failure | ❌ Tasks stuck | ✅ Recursive propagation |
| Observability | ❌ No events | ✅ Full EventEmitter |
| Pause/Resume | ❌ Not supported | ✅ Supported |
| Result caching | ❌ None | ✅ With force option |

**Node.js Verification:**

```bash
# Before tests (baseline failures expected)
node tests/test.js before
# Result: Shows expected failures

# After tests (all pass)
node tests/test.js after
# Result: ✅ All acceptance tests pass

# Evaluation report
node evaluation/evaluation.js
# Generates: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

**API Stability:**

Public API remained unchanged:
```javascript
const scheduler = new TaskScheduler({ maxConcurrent: 2 });
scheduler.addTask({ id: 'A', fn: async () => 'result' });
await scheduler.run();
scheduler.getStatus('A'); // { status: 'completed', result: 'result' }
scheduler.cancel('B');
```

**Learn more:**
- Task scheduling patterns: https://www.patterns.dev/posts/scheduling-patterns
- Async control flow: https://github.com/caolan/async

---

## Summary

This refactoring transformed a fragile loop-based scheduler into a production-ready event-driven system through:

1. **Audit** - identified 8 critical bugs
2. **Requirements** - established reliability contract
3. **Architecture** - event-driven with proper state tracking
4. **Cycle detection** - DFS algorithm prevents infinite loops
5. **Concurrency** - atomic counter eliminates race conditions
6. **Timeouts/retries** - proper cleanup and exponential backoff
7. **Cancellation** - full AbortController support
8. **Failure propagation** - recursive dependency handling
9. **Observability** - EventEmitter with 5 event types
10. **Verification** - 100% acceptance criteria met

The result is a production-ready task scheduler that handles complex dependency graphs, high concurrency, and failure scenarios without memory leaks or race conditions.
