# e2484c — Refactor Odoo JSON-RPC Employee Creation Payload

## Problem statement
The provided JSON-RPC request is not Odoo-compliant because `params.args` does not match the positional signature of `object.execute`, and `mobile_phone` is not in international format. The goal is to correct only the invalid parts so the request can create an `hr.employee` record.

## Structure
- `repository_before/`: original (non-compliant) payload
- `repository_after/`: corrected (compliant) payload
- `tests/`: validation tests (run against either repo via `TEST_REPO_PATH`)
- `evaluation/`: evaluation runner that executes tests on before/after and writes a report

## Docker commands (before / after / evaluation)
Run from this task directory.

### Test `repository_before` (expected to FAIL)
```bash
docker-compose run --rm test-before
```

### Test `repository_after` (expected to PASS)
```bash
docker-compose run --rm test-after
```

### Run evaluation (runs both + writes report)
```bash
docker-compose run --rm evaluation
```

Reports are written to `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json` and also mirrored to `evaluation/reports/latest.json`.
