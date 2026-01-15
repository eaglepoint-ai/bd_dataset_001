# Go Concurrent Cache Bug Fix

## Problem Statement
A concurrent cache implementation for a web service has multiple bugs causing race conditions, goroutine leaks, and deadlocks. The cache supports get, set, delete operations with TTL-based expiration. Users report intermittent crashes, memory growth over time, and the service hanging under load.

## Prompt
Fix the concurrent cache implementation that has race conditions, goroutine leaks, and improper channel handling. The cache should safely handle concurrent access, properly clean up expired entries, and gracefully shutdown without leaking goroutines.

## Requirements
1. Fix race condition on map access by adding proper mutex synchronization for all read/write operations
2. Fix goroutine leak in the cleanup routine by properly listening to the done channel and exiting when signaled
3. Fix channel deadlock by using select with default case or buffered channels where appropriate
4. Fix context cancellation - the Get operation should respect context timeout and return early if cancelled
5. Fix the Stop method to properly signal shutdown, wait for cleanup goroutine to exit, and close channels safely
6. Ensure Set operation properly resets TTL timer when updating existing keys
7. Fix potential panic from closing already-closed channel or sending on closed channel

## Category
Bug Fix

## Commands
```bash
docker-compose run --rm run_before
```

