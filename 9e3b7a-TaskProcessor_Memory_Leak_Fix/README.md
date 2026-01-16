# TaskProcessor Memory Leak Fix

This dataset task involves fixing memory leaks in a TaskProcessor class used in long-running Node.js services. The class manages async task processing and has multiple memory leaks causing unbounded memory growth.

## Folder Layout

- `repository_before/` - TaskProcessor with memory leaks
- `repository_after/` - TaskProcessor with all leaks fixed
- `tests/` - Test suite validating all 9 leak fixes
- `patches/` - Diff between before/after
- `evaluation/` - Evaluation runner with report generation

## Problem Statement

TaskProcessor class used in long-running Node.js service has memory leaks causing memory usage to grow over time until process crashes. The class manages async task processing with pending tasks, completed results, callbacks, cached data, external event subscriptions, periodic health checks and cleanup routines. At ~100 tasks/second, even small leaks compound quickly over days/weeks of runtime.

## Prompt Used

```
Fix the memory leaks in TaskProcessor.js. This class is used in a long-running Node.js service 
and users report memory usage growing over time until the process crashes. 

The class manages async task processing with these features:
- Stores pending tasks and completed results
- Supports callbacks for task completion
- Caches frequently accessed data
- Subscribes to an external event source for incoming tasks
- Has periodic health checks and cleanup routines
- Can be destroyed when no longer needed

Requirements:
- Fix all memory leaks that could cause unbounded memory growth
- Ensure proper cleanup of all resources in destroy()
- Maintain the same public API and functionality
- The processor may run for days/weeks without restart
- Tasks are added at ~100/second, so even small leaks compound quickly

Focus on:
- Timers and intervals - health check and cleanup intervals not cleared
- Event listeners and subscriptions - external source listeners not removed
- Maps/objects that grow without bounds - results, callbacks, cache never cleaned
- References retained longer than needed - lastError stores full task array
- Cleanup consistency - if you clean X, clean related Y too
- Do not change method signatures
```

## Functional Requirements (Memory Leak Fixes)

1. Clear health check interval in destroy() method
2. Clear cleanup interval in destroy() method
3. Remove external source event listeners ('task', 'error', 'batch') in destroy()
4. Clear callbacks Map after resolving or rejecting each task
5. Clear cache Map in destroy() method
6. Implement cache eviction when cache exceeds cacheSize limit
7. Clear subscribers array in destroy() method
8. Remove full task arrays from lastError (allPending, allProcessing cause unbounded growth)
9. Clear timeout timer when task completes before timeout expires

## Technical Context

- **Language**: JavaScript (Node.js)
- **Runtime**: Long-running service (days/weeks)
- **Load**: ~100 tasks/second
- **Problem**: Memory leaks causing process crashes

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected FAIL, leaks detected)
```bash
docker compose run --rm app-before
```
*Expected: Tests FAIL - memory leaks detected*

### Run tests (after – expected PASS, leaks fixed)
```bash
docker compose run --rm app-after
```
*Expected: All tests PASS - no memory leaks*

### Run evaluation
```bash
docker compose run --rm evaluation
```

## Run Locally

```bash
# Install dependencies
npm install

# Run tests on repository_before (should fail)
REPO=repository_before npm test

# Run tests on repository_after (should pass)
REPO=repository_after npm test

# Run evaluation
npm run evaluate
```

## Memory Leak Categories

### 1. Timer Leaks
- Health check interval not cleared in destroy()
- Cleanup interval not cleared in destroy()
- Timeout promises not cancelled

### 2. Event Listener Leaks
- External source listeners never removed
- EventEmitter listeners accumulate

### 3. Collection Growth Leaks
- Results map grows without bounds
- Callbacks map never cleaned
- Cache grows without eviction
- Subscribers array never cleared

### 4. Reference Leaks
- lastError stores full task arrays
- Completed tasks retain unnecessary data
