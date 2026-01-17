# Internal Tool Troubleshooting Guide

## Error: "Job status is 'error', report.json artifact missing"

This error means the Docker container failed **before** the evaluation could run and write report.json.

## Root Cause Analysis

The internal tool (AWS CodeBuild/Aquila) expects:
1. Docker container to start successfully ✓
2. Evaluation script to run ✓
3. `report.json` to be written to `evaluation/reports/report.json` ✓
4. Exit code 0 for success ✓

If **any** of these fail, you get the S3 404 error.

## Fixes Applied

### 1. Fixed Dockerfile
**Before:**
```dockerfile
# Could fail if evaluation/reports doesn't exist
CMD ["pytest", "tests", "-v", "--tb=short"]
```

**After:**
```dockerfile
# Ensure directory exists
RUN mkdir -p /app/evaluation/reports

# Run evaluation (always writes report.json)
CMD ["python", "evaluation/evaluation.py"]
```

### 2. Fixed docker-compose.yml
**Before:**
```yaml
volumes:
  - ./repository_before:/app/repository_before:ro  # Read-only!
```

**After:**
```yaml
volumes:
  - ./:/app  # Read-write access needed for report.json
```

### 3. Added Robust Error Handling
```python
def write_error_report(run_id, start_time, error_msg):
    """Always write report.json even if evaluation crashes"""
    # Creates minimal valid report
    
if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        # Last resort: write error report
        write_error_report(...)
        sys.exit(1)
```

### 4. Fixed Report Location
```python
# Fixed location (not timestamped)
output_path = REPORTS / "report.json"  # evaluation/reports/report.json
```

## Verification Checklist

Before pushing to internal tool, verify:

### 1. Local Test
```powershell
cd "path/to/830687-separate-squares-problem"
python evaluation/evaluation.py

# Check:
# ✓ Exit code 0
# ✓ evaluation/reports/report.json exists
# ✓ report.json has "success": true
```

### 2. Docker Test
```bash
docker-compose build
docker-compose run --rm evaluate

# Check:
# ✓ Container starts
# ✓ Exit code 0
# ✓ evaluation/reports/report.json exists on HOST
# ✓ report.json has "success": true
```

### 3. File Structure Check
```
830687-separate-squares-problem/
├── Dockerfile                          ← Has mkdir -p command
├── docker-compose.yml                  ← evaluate service mounts ./:/app
├── requirements.txt                    ← Has pytest
├── evaluation/
│   ├── evaluation.py                   ← Writes to REPORTS/report.json
│   └── reports/
│       └── report.json                 ← Fixed location (not timestamped)
├── repository_before/
│   ├── __init__.py                     ← Must exist
│   └── solution.py
├── repository_after/
│   ├── __init__.py                     ← Must exist
│   └── solution.py
└── tests/
    ├── __init__.py                     ← Must exist
    └── test_solution.py
```

### 4. Report Format Check
```bash
cat evaluation/reports/report.json | python -m json.tool
```

Must have:
- `run_id`: string
- `success`: boolean
- `error`: string or null
- `results.before.tests`: array
- `results.after.tests`: array
- `results.comparison`: object

## Common Issues & Solutions

### Issue: "Artifact not found in S3"
**Cause:** report.json wasn't written
**Solution:** Check Dockerfile has `RUN mkdir -p /app/evaluation/reports`

### Issue: "Job status is 'error'"
**Cause:** Container crashed before evaluation ran
**Solutions:**
1. Check Dockerfile syntax
2. Check requirements.txt has all dependencies
3. Check evaluation.py has error handling

### Issue: "No logs available"
**Cause:** Container failed immediately
**Solutions:**
1. Test locally with `docker-compose run evaluate`
2. Check for Python syntax errors
3. Check all `__init__.py` files exist

### Issue: "Exit code 1"
**Cause:** Tests failed or evaluation failed
**Solutions:**
1. Run locally: `python evaluation/evaluation.py`
2. Check test output
3. Verify repository_before and repository_after work

## Debug Commands

### Test evaluation locally
```bash
python evaluation/evaluation.py
echo Exit code: $?
```

### Test in Docker
```bash
docker-compose run --rm evaluate
```

### Check if report exists
```bash
ls -la evaluation/reports/report.json
```

### Validate JSON
```bash
python -c "import json; print(json.load(open('evaluation/reports/report.json'))['success'])"
```

### Check Docker logs
```bash
docker-compose run evaluate 2>&1 | tee evaluation_log.txt
```

## Expected Output (Success)

```
Run ID: 87dd8a2f
Started at: 2026-01-17T02:22:23.768989

============================================================
SQUARE SPLIT LINE EVALUATION
============================================================

============================================================
RUNNING TESTS: REPOSITORY_BEFORE
============================================================
Repository: /app/repository_before
Tests: /app/tests
[PASS] Tests PASSED (17/17)

============================================================
RUNNING TESTS: REPOSITORY_AFTER
============================================================
Repository: /app/repository_after
Tests: /app/tests
[PASS] Tests PASSED (17/17)

[SUCCESS] Report written to /app/evaluation/reports/report.json

============================================================
EVALUATION SUMMARY
============================================================
Before Tests: PASSED (17/17)
After Tests:  PASSED (17/17)

Success: YES
Duration: 2.85s
============================================================
```

## What the Internal Tool Does

1. Clones your repository
2. Runs: `docker-compose build`
3. Runs: `docker-compose run evaluate`
4. Looks for: `evaluation/reports/report.json`
5. Uploads report.json to S3
6. Shows result in UI

If step 3 fails (exit code ≠ 0), step 4 finds nothing → 404 error.

## Final Verification Before Push

```bash
# Clean build
docker-compose build --no-cache

# Run evaluation
docker-compose run --rm evaluate

# Verify report exists
test -f evaluation/reports/report.json && echo "✓ Report exists" || echo "✗ Report missing"

# Verify report is valid JSON
python -c "import json; r=json.load(open('evaluation/reports/report.json')); print(f'✓ Valid JSON, success={r[\"success\"]}')"

# Check exit code
docker-compose run --rm evaluate
echo "Exit code: $?"
```

All checks must pass ✓ before pushing to internal tool.
