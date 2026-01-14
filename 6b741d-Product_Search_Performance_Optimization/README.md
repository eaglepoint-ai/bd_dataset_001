# Product Search Performance Optimization

This dataset task contains a production-style JavaScript class for product search. The objective is to optimize for high performance (100,000+ products, sub-100ms search) while preserving **bit-for-bit** runtime behavior and public API.

## Folder layout

- `repository_before/` original implementation
- `repository_after/` optimized implementation
- `tests/` correctness + performance tests
- `patches/` diff between before/after
- `evaluation/` evaluation runner and reports
- `instances/` task metadata
- `trajectory/` solution write-up

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected to FAIL performance)
```bash
docker compose run --rm before
```
**Expected behavior:**
- Correctness tests: ✅ PASS
- Performance test: ❌ FAIL (expected - not optimized)

### Run tests (after – expected to PASS all)
```bash
docker compose run --rm after
```
**Expected behavior:**
- Correctness tests: ✅ PASS
- Performance test: ✅ PASS (optimized)

### Run evaluation (compares both implementations)
```bash
docker compose run --rm evaluation
```
This will:
- Run tests for both before and after implementations
- Compare correctness and performance
- Generate a report at `evaluation/reports/latest.json`

## Run locally

### Install dependencies
```bash
npm install
```

### Run all tests (before)
```bash
NODE_PATH=repository_before npx mocha tests/productSearch.before.test.js
```

### Run all tests (after)
```bash
NODE_PATH=repository_after npx mocha tests/productSearch.after.test.js
```

### Run evaluation
```bash
node evaluation/evaluation.js
```

## Regenerate patch

From repo root:
```bash
git diff --no-index repository_before repository_after > patches/task.patch
```

---

## Task Summary

- Optimize ProductSearch to handle 100,000+ products and 1,000 queries/sec with sub-100ms response.
- Maintain exact public API and result equivalence.
- See `instances/instance.json` for requirements and test expectations.

