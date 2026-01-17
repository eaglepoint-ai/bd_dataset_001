## Folder layout

- `repository_before/` original implementation
- `repository_after/` mechanically refactored implementation
- `tests/` equivalence + invariants tests
- `patches/` diff between before/after

## Run with Docker

### Build image

```bash
docker compose build
```

### Run consile tests

```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app python -m pytest -v repository_after/test_console.py --collect-only

```

### Run tests (before – expected some failures)

```bash

```

**Expected behavior:**

- Functional tests: ✅ PASS
- Structural tests (helper functions, duplication reduction): ❌ FAIL (expected - no improvements yet)

### Run tests (after – expected all pass)

```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app python -m pytest -v tests/test_test_coverage.py
```

**Expected behavior:**

- Functional tests: ✅ PASS
- Structural tests (helper functions, duplication reduction): ✅ PASS (improvements present)

#### Run evaluation (compares both implementations)

```bash
docker compose run --rm app python evaluation/evaluation.py
```

This will:

- Run tests for both before and after implementations
- Run structure and equivalence tests
- Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`
