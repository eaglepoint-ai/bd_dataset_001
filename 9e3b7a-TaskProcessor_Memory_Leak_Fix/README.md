# TaskProcessor Memory Leak Fix

## Problem Statement

TaskProcessor class used in long-running Node.js service has memory leaks causing memory usage to grow over time until process crashes. The class manages async task processing with pending tasks, completed results, callbacks, cached data, external event subscriptions, periodic health checks and cleanup routines. At ~100 tasks/second, even small leaks compound quickly over days/weeks of runtime.

## Prompt

Fix the memory leaks in the `TaskProcessor` class. This class is used in a long-running Node.js service and users report memory usage growing over time until the process crashes.

**Tech Stack:**
- Language: JavaScript (Node.js)
- The class extends EventEmitter for event-based communication

**The class manages async task processing with these features:**
- Stores pending tasks and completed results
- Supports callbacks for task completion
- Caches frequently accessed data
- Subscribes to an external event source for incoming tasks
- Has periodic health checks and cleanup routines
- Can be destroyed when no longer needed

**Memory leak symptoms:**
- Memory grows linearly over time
- Process crashes after days/weeks of runtime
- ~100 tasks/second throughput makes small leaks compound quickly

Fix all memory leaks without changing method signatures or breaking existing functionality.

## Requirements

1. Clear health check interval in destroy() method
2. Clear cleanup interval in destroy() method
3. Remove external source event listeners ('task', 'error', 'batch') in destroy()
4. Clear callbacks Map after resolving or rejecting each task
5. Clear cache Map in destroy() method
6. Implement cache eviction when cache exceeds cacheSize limit
7. Clear subscribers array in destroy() method
8. Clear results Map in destroy() method
9. Remove full task arrays from lastError (allPending, allProcessing cause unbounded growth)
10. Clear timeout timer when task completes before timeout expires
11. Remove task reference from results object to avoid retaining large objects
12. Set externalSource to null in destroy() method
13. Set lastError to null in destroy() method
14. Reject pending callbacks in destroy() to prevent memory retention

## Category

Code Refactoring

## Commands

```bash
# Build and run
docker-compose run --rm run_before
```

