# Trajectory

## 1) Understand
- Read Prompt and README.md to capture core (cycles, failure propagation, concurrency, timeout cleanup, backoff, cancel) and bonus (heap, events, pause/resume, shutdown, caching) requirements; API must stay `addTask`, `run`, `cancel`, `getStatus`.
- Inspect `repository_before/TaskScheduler.js` to note missing pieces: no cycle detection, no failure propagation, races on `maxConcurrent`, no timeout cleanup, no AbortController, O(n log n) sort, stuck dependents.

## 2) Plan
- Implement core fixes in `repository_after/TaskScheduler.js`: DFS cycle detection; recursive dependency failure; atomic `runningCount`; timeout tracking/cleanup; exponential backoff with retrying state; AbortController cancel for running tasks.
- Add bonus features: max-heap priority, EventEmitter events, pause/resume flags, graceful shutdown, result caching (force option), JSDoc on public API.
- Build tests covering acceptance criteria (cycle, concurrency cap, retry delays, dependency failure, timeout cleanup, cancel pending/running) with mode flags (before/after/both).
- Add evaluation runner to execute before+after, capture output, write report, exit based on after.

## 3) Implement
- Updated `repository_after/TaskScheduler.js` with the above fixes/features; kept public API unchanged.
- Wrote `tests/test.js` to run in modes (before baseline fails, after strict pass) with per-behavior tests.
- Built `evaluation/evaluation.js`: runs before/after with timeouts, captures stdout/stderr, return codes, durations, writes `evaluation/reports/latest.json`, exit = after result.

## 4) Validate
- Ran `node tests/test.js after` → all acceptance tests pass; `node tests/test.js before` → expected failures.
- Ran `node evaluation/evaluation.js` → no hang; report created at `evaluation/reports/latest.json`; after passed (success true).

## 5) Result
- After implementation satisfies README acceptance criteria; evaluation is deterministic and reports both before (fail) and after (pass).***
