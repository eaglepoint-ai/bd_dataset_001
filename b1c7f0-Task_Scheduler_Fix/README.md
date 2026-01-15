# Task Scheduler Fix

This dataset task contains a production-style TaskScheduler class with intentional bugs and performance issues.
The objective is to **completely refactor** the implementation while preserving **exact public API compatibility** and fixing all critical issues.

 
## Folder Layout

- `repository_before/` - Original implementation with bugs
- `repository_after/` - Refactored implementation with fixes
- `tests/` - Acceptance tests and invariants
- `patches/` - Diff between before/after

 
## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected some failures)
```bash
docker compose run --rm app node tests/test.js before
```

**Expected behavior:**
- Some tests: ❌ FAIL (expected - bugs present in original implementation)

### Run tests (after – expected all pass)
```bash
docker compose run --rm app node tests/test.js after
```

**Expected behavior:**
- All tests: ✅ PASS (bugs fixed, requirements implemented)

### Run evaluation (compares both implementations)
```bash
docker compose run --rm app node evaluation/evaluation.js
```

This will:
- Run tests for both before and after implementations
- Compare results and verify improvements
- Generate a report at `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

## Run locally

### Install dependencies
```bash
npm install
```

### Run tests
```bash
# Test before implementation
node tests/test.js before

# Test after implementation
node tests/test.js after
```

### Run evaluation
```bash
node evaluation/evaluation.js
```

## Regenerate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/task_scheduler.patch
```

