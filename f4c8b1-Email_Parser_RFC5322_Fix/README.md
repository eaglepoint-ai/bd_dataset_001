# Email Parser RFC 5322 Fix

This dataset task contains a legacy email parser with RFC 5322 compliance issues.
The objective is to fix all bugs while preserving the exact same public API.

## Folder layout

- `repository_before/` original implementation with bugs
- `repository_after/` fixed implementation
- `tests/` comprehensive test suite
- `patches/` diff between before/after
- `evaluation/` evaluation script and reports

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected some failures)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest -q
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
git diff --no-index repository_before repository_after > patches/email_parser_fix.patch
```


