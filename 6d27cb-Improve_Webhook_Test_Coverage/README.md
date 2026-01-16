# Improve Webhook Test Coverage

The current test suite for the Flask webhook endpoint provides basic coverage of core functionality such as successful requests, invalid signatures, and replay attack prevention. However, the existing tests do not fully exercise many important execution paths in the implementation. Several edge cases—including malformed JSON payloads, missing required fields, incorrect header formats, database failures, and unexpected runtime exceptions—are either untested or only partially validated. Without tests for these scenarios, regressions can be introduced unknowingly, error handling behavior may change, and overall system reliability is reduced. To ensure the webhook service is robust, deterministic, and maintainable, the test suite must be expanded to cover all meaningful branches and failure modes of the endpoint logic.

## Folder layout
- `repository_before/` - original implementation with bugs
- `repository_after/` - fixed implementation
- `tests/` - comprehensive test suite
- `patches/` - diff between before/after
- `evaluation/` - evaluation script and reports

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected some failures)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest tests/ -q
```

**Expected behavior:**
- Functional tests: ✅ PASS
- Bug verification tests: ✅ PASS (confirms bugs exist in original implementation)

### Run tests (after – expected all pass)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -q
```

**Expected behavior:**
- All tests: ✅ PASS (all bugs fixed, proper implementation)

### Run evaluation (compares both implementations)
```bash
docker compose run --rm app python evaluation/evaluation.py
```

This will:
- Run tests for both before and after implementations
- Compare results and verify improvements
- Generate a report at `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

### Run evaluation with custom output file
```bash
docker compose run --rm app python evaluation/evaluation.py
```

## Run locally

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run all tests
```bash
# Run all tests (quiet mode)
pytest -q
```

## Regenerate patch
From repo root:
```bash
git diff --no-index repository_before repository_after > patches/diff.patch
```
