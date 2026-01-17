# Testing Guide

## How to Test the Solution

### 1. Local Testing

#### Run Tests on repository_before
```bash
cd "C:\Users\biruk\Desktop\eagle point python\bd_dataset_001\830687-separate-squares-problem"
$env:PYTHONPATH="repository_before"
pytest tests -v
```

#### Run Tests on repository_after
```bash
cd "C:\Users\biruk\Desktop\eagle point python\bd_dataset_001\830687-separate-squares-problem"
$env:PYTHONPATH="repository_after"
pytest tests -v
```

### 2. Run Full Evaluation

```bash
cd "C:\Users\biruk\Desktop\eagle point python\bd_dataset_001\830687-separate-squares-problem"
python evaluation/evaluation.py
```

**Output:**
- Creates timestamped folder: `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`
- Also creates: `evaluation/reports/latest.json` for convenience

### 3. Docker Testing

#### Build Docker Images
```bash
docker-compose build
```

#### Test repository_before in Docker
```bash
docker-compose run --rm test-before
```

#### Test repository_after in Docker
```bash
docker-compose run --rm test-after
```

#### Run Full Evaluation in Docker
```bash
docker-compose run --rm evaluate
```

### 4. Verify Report Format

The report will be generated at:
```
evaluation/YYYY-MM-DD/HH-MM-SS/report.json
```

**Report Structure:**
```json
{
  "run_id": "short-uuid",
  "started_at": "2026-01-17T04:50:00.210397",
  "finished_at": "2026-01-17T04:50:02.290443",
  "duration_seconds": 2.08,
  "success": true,
  "error": null,
  "environment": {
    "python_version": "3.10.11",
    "platform": "...",
    "os": "Windows",
    "os_release": "10",
    "architecture": "AMD64",
    "hostname": "...",
    "git_commit": "...",
    "git_branch": "..."
  },
  "results": {
    "before": {
      "success": true,
      "exit_code": 0,
      "tests": [...],
      "summary": {...},
      "stdout": "...",
      "stderr": ""
    },
    "after": {
      "success": true,
      "exit_code": 0,
      "tests": [...],
      "summary": {...},
      "stdout": "...",
      "stderr": ""
    },
    "comparison": {
      "before_tests_passed": true,
      "after_tests_passed": true,
      "before_total": 17,
      "before_passed": 17,
      "before_failed": 0,
      "after_total": 17,
      "after_passed": 17,
      "after_failed": 0
    }
  }
}
```

### 5. Quick Test Commands

**Windows PowerShell:**
```powershell
# Test before
$env:PYTHONPATH="repository_before"; pytest tests -v

# Test after
$env:PYTHONPATH="repository_after"; pytest tests -v

# Run evaluation
python evaluation/evaluation.py
```

**Linux/Mac:**
```bash
# Test before
PYTHONPATH=repository_before pytest tests -v

# Test after
PYTHONPATH=repository_after pytest tests -v

# Run evaluation
python evaluation/evaluation.py
```

### 6. Expected Results

✅ **Both implementations should pass all 17 tests**
- repository_before: 17/17 passed
- repository_after: 17/17 passed

✅ **Evaluation should succeed**
- `success: true`
- Both before and after tests pass
- Report generated in timestamped folder

### 7. Troubleshooting

**Issue: Tests fail to import**
- Make sure PYTHONPATH is set correctly
- Check that `repository_before/solution.py` and `repository_after/solution.py` exist

**Issue: Report format incorrect**
- Check that `evaluation/evaluation.py` is the latest version
- Verify pytest output parsing is working

**Issue: Folder structure wrong**
- Report should be in `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`
- Check that the evaluation script creates the directory structure correctly
