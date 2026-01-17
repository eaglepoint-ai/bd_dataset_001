# API Fetch Optimization

This dataset task contains a production-style Java method for fetching items with performance issues and missing features.
The objective is to **completely refactor** the implementation while preserving **exact public API compatibility** and fixing all critical issues.

The existing Java method for fetching items simulates an API response but is not suitable for real-world usage because it removes duplicates inefficiently, leading to poor performance as data size grows, and provides no mechanism to limit or segment results for large datasets. In practical API scenarios, optimization is necessary to ensure scalable performance, pagination is required to control payload size and support client-side navigation through results, and input validation is essential to prevent invalid requests and unpredictable runtime failures. The goal is to refactor the method to address these limitations by improving time complexity, introducing optional pagination with clear and predictable behavior, and enforcing robust input validation, while preserving backward compatibility so that existing consumers of the method are not affected.

## Folder Layout

- `repository_before/` - Original implementation with performance issues
- `repository_after/` - Optimized implementation with fixes
- `tests/` - Comprehensive test suite
- `patches/` - Diff between before/after
- `evaluation/` - Evaluation script and reports

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected some failures)
```bash
docker compose run --rm test-before
```

**Expected behavior:**
- Some tests: ❌ FAIL (expected - performance issues present in original implementation)

### Run tests (after – expected all pass)
```bash
docker compose run --rm test-after
```

**Expected behavior:**
- All tests: ✅ PASS (optimizations implemented, requirements met)

### Run evaluation (compares both implementations)
```bash
docker compose run --rm evaluation
```

This will:
- Run tests for both before and after implementations
- Compare results and verify improvements
- Generate a report at `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

## Regenerate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/api_fetch_optimization.patch
```
