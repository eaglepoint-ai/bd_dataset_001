# Performance Optimization: Rust Text Processor

This dataset task contains a production-style Rust library with intentional performance bottlenecks. The objective is to optimize the implementation while preserving and improving its behavioral correctness.

## Folder Layout
- `repository_before/`: Original unoptimized implementation.
- `repository_after/`: Optimized implementation.
- `tests/`: Shared behavioral and performance-proxy tests.
- `evaluation/`: Rust-based evaluator and generated reports.

## Run with Docker

### Build Image
```bash
docker compose build
```

### Run Tests (Before – Expected logic failure)
```bash
docker compose run --rm --build before
```
**Expected behavior:**
- Functional tests: ❌ FAIL (Fails punctuation-aware stop-word filtering)
- Basic counts: ✅ PASS

### Run Tests (After – Expected all pass)
```bash
docker compose run --rm --build after
```
**Expected behavior:**
- Functional tests: ✅ PASS
- Performance proxies (pre-allocation, etc.): ✅ PASS

### Run Evaluation (Compares both implementations)
```bash
docker compose up --build evaluate
```
**This will:**
- Run tests for both `before` and `after` implementations.
- Compare results and calculate relative speedup.
- Generate a report at `evaluation/reports/latest.json`.

## Requirements
1. **Optimize Lookups**: Replace `Vec<String>` for stop words with `HashSet<String>` for O(1) lookups.
2. **Reduce Allocations**: Remove unnecessary `.clone()` calls and use references.
3. **Use Entry API**: Use `HashMap::entry()` instead of `contains_key` + `get_mut`.
4. **Pre-allocate Capacity**: Use `with_capacity()` when the result size is known.
5. **Logic Correction**: Ensure text is cleaned and normalized *before* stop-word filtering.

## Local Execution (Rust 1.80+)
Execute tests directly from the repository directories:
```bash
cd repository_after
cargo test --test lib_test
```

