
## 🐳 Quick Start (Docker)


# run tests (quick validation)

```bash
docker-compose up --build run_repository_after_tests
docker-compose up --build run_repository_before_tests
```

# Run evaluation script

```bash
docker-compose run evaluation
```


## Folder layout

- `repository_before/` original implementation
- `repository_after/` mechanically refactored implementation
- `tests/` equivalence + invariants tests
- `patches/` diff between before/after

## Run with Docker


### Run tests (before – expected some failures)

```bash
docker-compose up --build run_repository_before_tests
```


**Expected behavior:**

- Most functional tests may fail due to known concurrency, shutdown, or resource issues in the original implementation.
- Structural tests (helper functions, duplication reduction): ❌ FAIL (expected, as no improvements are present yet)
- Race detector may report data races or panics.

### Run tests (after – expected all pass)

```bash
docker-compose up --build run_repository_after_tests
```


**Expected behavior:**

- All functional and structural tests should pass, including edge cases and concurrency scenarios.
- No race detector warnings or panics.
- Resource cleanup, graceful shutdown, and thread safety are fully enforced.

#### Run evaluation (compares both implementations)

```bash
docker-compose run evaluation
```

This will:

- Run tests for both before and after implementations
- Run structure and equivalence tests
- Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`


