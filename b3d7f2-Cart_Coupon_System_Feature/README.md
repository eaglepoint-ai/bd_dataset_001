# Advanced Cart Coupon System
This dataset task contains a production-style Node.js/Mongoose `CartService` with missing coupon functionality. The objective is to implement a robust coupon system including validation, stacking logic, and automatic price recalculation.

## Folder layout
- `repository_before/`: original implementation (missing coupon features)
- `repository_after/`: implemented advanced coupon system
- `tests/`: comprehensive requirement tests
- `patches/`: diff between before/after (to be generated)
- `evaluation/`: automated scoring and reporting framework

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected failures)
```bash
docker compose up --build --exit-code-from test-before test-before
```
**Expected behavior:**
- Basic Cart functionality: ✅ PASS
- Coupon Schema & Validation: ❌ FAIL (Models/Properties missing)
- Coupon Scaling & Integration: ❌ FAIL (Logic missing)

### Run tests (after – expected all pass)
```bash
docker compose up --build --exit-code-from test-after test-after
```
**Expected behavior:**
- Schema Design & Indexing: ✅ PASS
- Service Validation & Stacking: ✅ PASS
- Cart Integration & Auto-removal: ✅ PASS

### Run evaluation (compares both implementations)
```bash
docker compose up --build --exit-code-from evaluate evaluate
```
This will:
1. Run tests for both before and after implementations using isolated Docker namespaces.
2. Compare results and verify that the "after" repository passes all gates.
3. Generate a report at `evaluation/reports/latest.json`.

## Run locally

### Install dependencies
```bash
npm install
```

### Run evaluation
```bash
node evaluation/evaluation.js
```

## Regenerate patch
From repo root:
```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
