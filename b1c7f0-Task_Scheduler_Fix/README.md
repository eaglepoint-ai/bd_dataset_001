# Task Scheduler Fix

## Problem Statement
Noticed a critical reliability issue with a legacy TaskScheduler class that handles background job processing with dependencies, priorities, and retries. The system suffers from circular dependency infinite loops, race conditions on concurrent task completion, memory leaks from uncleaned timeouts, no way to cancel running tasks, O(n log n) priority sorting on every cycle, and tasks with failed dependencies waiting forever — all while needing to add pause/resume, graceful shutdown, event emission, and exponential backoff retry while maintaining the exact same public API.

## Prompt
Role: Senior Backend Engineer

Context: Your company has a legacy task scheduler that processes background jobs. The current implementation has severe performance issues and bugs. You need to completely refactor it while maintaining the exact same public API (addTask, run, cancel, getStatus).

CORE REQUIREMENTS (Must Fix):
1. Dependency Cycle Detection
   - Detect cycles before run(), throw: "Circular dependency detected: A → B → C → A"
2. Dependency Failure Propagation
   - Mark all dependent tasks as failed recursively
3. Concurrency Control
   - Respect maxConcurrent strictly, async-safe (no race conditions when multiple tasks complete via Promise.all)
4. Timeout Cleanup
   - Clear timers when task completes/fails
5. Exponential Backoff Retry
   - Formula: delay = min(baseDelay * 2^attempt, maxDelay)
6. Cancel Running Tasks
   - Pending: remove from queue
   - Running: abort via AbortController if task.fn supports AbortSignal

BONUS REQUIREMENTS:
7. Priority Queue Efficiency - O(log n) heap instead of O(n log n) sort
8. Event Emission - Extend EventEmitter, events: taskStart, taskComplete, taskFail, taskRetry, taskCancel
9. Pause/Resume Support - Let running tasks complete, don't start new ones
10. Graceful Shutdown - Wait for running tasks, reject pending, prevent new tasks
11. Task Result Caching - Return cached result for completed tasks

CONSTRAINTS:
- No external dependencies
- Same public API (addTask, run, cancel, getStatus)
- Async-safe (no race conditions)
- Memory efficient

## Requirements
- Dependency Cycle Detection - Detect cycles before running, throw descriptive error with path
- Dependency Failure Propagation - Mark dependent tasks as failed recursively
- Proper Concurrency Control - Respect maxConcurrent strictly, no race conditions
- Exponential Backoff Retry - Formula: delay = min(baseDelay * 2^attempt, maxDelay)
- Timeout Cleanup - Clear timers when task completes
- Cancel Running Tasks - Support AbortController for running tasks
- Priority Queue Efficiency - O(log n) heap instead of O(n log n) sort
- Event Emission - taskStart, taskComplete, taskFail, taskRetry, taskCancel events
- Pause/Resume Support - Let running tasks complete, don't start new ones
- Task Result Caching - Return cached result for completed tasks, support force re-run
- Graceful Shutdown - Wait for running tasks, reject pending, prevent new tasks

## Acceptance Criteria
1. Cycle test: A→B→C→A throws Error with "Circular dependency detected: A → B → C → A"
2. Concurrency test: maxConcurrent=2, never exceeds 2 running simultaneously
3. Retry test: 3 failures show exponential delays (~100ms, ~200ms, ~400ms)
4. Dependency failure: If A fails, B (depends on A) also marked failed
5. Timeout cleanup: No memory leaks from lingering timers
6. Cancel: cancel('taskId') returns true for pending, aborts running if supported

## Commands

### Run tests on repository_before
```bash
cd repository_before && node test.js
```

### Run tests on repository_after
```bash
cd repository_after && node test.js
```

### Run evaluation
```bash
node evaluation/evaluation.js
```

