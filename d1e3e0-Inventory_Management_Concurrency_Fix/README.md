# Inventory Management Concurrency Fix
This dataset task contains a production-style inventory management system built with NestJS and TypeORM that suffers from critical concurrency bugs. The objective is to fix these issues (Race Conditions, Transaction Leaks, Performance) while maintaining the existing API contract.

## Folder layout
* `repository_before/`: original buggy implementation
* `repository_after/`: fixed implementation
* `tests/`: specific test scenarios (equivalence + invariants)
* `patches/`: diff between before/after

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected failures)
```bash
docker compose run --rm --build app npm run test:before
```
**Expected behavior:**
*   Functional tests: ❌ FAIL (Bugs present: Lost updates, Leaks, etc.)
*   Exit code: 1

### Run tests (after – expected all pass)
```bash
docker compose run --rm --build app npm run test:after
```
**Expected behavior:**
*   Functional tests: ✅ PASS (All strict requirements met)
*   Exit code: 0

### Run evaluation (compares both implementations)
```bash
docker compose run --rm --build app npm run evaluate
```
This will:
*   Run tests for both before and after implementations
*   Verify strict failure for "before" and strict success for "after"
*   Generate a report at `evaluation/reports/latest.json`

## Run locally

### Install dependencies
```bash
npm install
```

### Run all tests
```bash
# Run all tests (before, after, etc.)
npm test
```

### Run specific scenarios
```bash
npm run test:before
npm run test:after
```

## Regenerate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
