# Fix Concurrent Worker Pool in Go

## Problem Statement

A high-throughput microservices platform processing 10,000+ tasks per hour is experiencing critical issues with its worker pool implementation. Production systems report race conditions, memory leaks, and occasional panics during deployment. The CI/CD pipeline's race detector is failing intermittently. Your task is to fix all concurrency bugs while maintaining API compatibility with 50+ dependent microservices.

---

## Prompt

**Role:** Senior Go Engineer

**Context:** Your company's worker pool library (`worker_pool.go`) is used across authentication, payment processing, and notification services. Users report:
- Memory growing indefinitely (requires hourly restarts)
- "concurrent map writes" panics under load
- Graceful shutdown hanging for minutes
- Race detector failures in CI/CD

**Scale Assumptions:**
- 10,000+ tasks/hour during peak traffic
- 100+ concurrent workers per service
- Zero-downtime rolling deployments every 2 hours
- 99.9% uptime SLA

---

## Core Requirements (Must Fix)

### 1. Thread-Safe Operations
- All shared state must be protected from race conditions
- Must pass `go test -race` with zero warnings

### 2. Graceful Shutdown
- `Stop()` must wait for in-flight tasks to complete
- Multiple `Stop()` calls must not panic

### 3. Resource Cleanup
- No goroutine leaks after `Stop()`
- No memory leaks from blocked submissions

### 4. Context Awareness
- Workers must respect context cancellation immediately
- Workers must exit when `ctx.Done()` fires, not wait for all queued tasks

---

## Edge Cases (Must Handle)

### 5. Zero Workers
- `Submit()` with 0 workers must return error, NOT block forever

### 6. Thousands of Tasks
- Handle 5000+ tasks without memory issues

### 7. Concurrent Submit
- Support 20+ goroutines calling `Submit()` simultaneously

### 8. Submit After Stop
- `Submit()` after `Stop()` must return error gracefully (no panic, no block)

### 9. Nil Tasks
- `Submit(nil)` must return error, not panic

### 10. Negative Workers
- `NewWorkerPool(-5)` must not panic

---

## Constraints

- **Standard Library Only**: Use Go 1.21+ standard library only. No external packages.
- **API Compatibility**: Maintain exact public method signatures:
  - `NewWorkerPool(workers int) *WorkerPool`
  - `Start(ctx context.Context)`
  - `Submit(task Task) error`
  - `Stop()`
  - `GetResults() map[int]error`
- **No Unsafe**: Do not use the `unsafe` package
- **Results Immutability**: `GetResults()` must return a copy, not internal reference

---

## Definition of Done

1. ✅ All goroutines terminate after `Stop()` (verify with `runtime.NumGoroutine()`)
2. ✅ `go test -race` passes with zero warnings
3. ✅ Multiple `Stop()` calls do not panic
4. ✅ `Submit()` after `Stop()` returns error gracefully
5. ✅ Workers stop within 250ms after context cancellation

---

## Acceptance Criteria

1. Basic task execution (10 tasks, 3 workers) completes successfully
2. Zero workers returns error immediately, does not block
3. 5000 tasks with 10 workers completes without memory issues
4. 20 concurrent submitters (100 tasks each) all succeed
5. 5 consecutive `Stop()` calls do not panic
6. Context timeout (150ms) with 100 pending tasks - `Stop()` completes in <250ms
7. Submit after stop returns error, does not panic or block
8. Goroutine count returns to baseline after stop
9. Concurrent Submit + GetResults passes race detector
10. External modification of GetResults() does not affect internal state

---

## Commands

### Run repository_before
```bash
docker-compose run --rm run_before
```

