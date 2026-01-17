# Testing Guide: Separate Squares Problem

This guide explains how to test the `repository_before` and `repository_after` implementations, and run the full evaluation.

## Folder Layout

```
830687-separate-squares-problem/
├── repository_before/          # Naive O(n²) implementation
│   ├── __init__.py
│   └── solution.py
├── repository_after/           # Optimized O(n log n) implementation  
│   ├── __init__.py
│   └── solution.py
├── tests/
│   ├── __init__.py
│   └── test_solution.py        # Shared test suite (17 tests)
├── evaluation/
│   ├── evaluation.py           # Standard evaluator
│   └── reports/
│       ├── latest.json         # Standard report (per spec)
│       └── report.json          # Compatibility report
├── patches/
│   └── diff.patch              # Diff between before/after
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Run with Docker

### Build Image

```bash
docker compose build
```

### Run Tests (Before - Expected: All Pass)

```bash
docker compose run --rm test-before
```

**Expected behavior:**
- Functional tests: ✅ PASS (17/17)
- All correctness tests pass

### Run Tests (After - Expected: All Pass)

```bash
docker compose run --rm test-after
```

**Expected behavior:**
- Functional tests: ✅ PASS (17/17)
- All correctness tests pass
- Same results as before (functional equivalence)

### Run Full Evaluation (Compares Both Implementations)

```bash
docker compose run --rm evaluate
```

This will:
- Run tests for both `repository_before` and `repository_after`
- Generate reports at:
  - `evaluation/reports/latest.json` (standard format)
  - `evaluation/reports/report.json` (compatibility format)

### Run Evaluation with Custom Output (Optional)

The evaluation script can be modified to support custom output paths, but by default writes to both `latest.json` and `report.json`.

## Run Locally

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Tests on "Before" Implementation

```bash
# Windows PowerShell
$env:PYTHONPATH="repository_before"; pytest tests -q

# Linux/Mac
PYTHONPATH=repository_before pytest tests -q
```

### Run Tests on "After" Implementation

```bash
# Windows PowerShell
$env:PYTHONPATH="repository_after"; pytest tests -q

# Linux/Mac
PYTHONPATH=repository_after pytest tests -q
```

### Run Full Evaluation

```bash
python evaluation/evaluation.py
```

**Output:**
- `evaluation/reports/latest.json` - Standard evaluation report
- `evaluation/reports/report.json` - Compatibility report (same content)

## Test Suite Overview

The test suite (`tests/test_solution.py`) contains **17 tests** organized into:

1. **TestBasicCases** (4 tests)
   - Single square
   - Two squares stacked
   - Two squares side by side
   - Empty input

2. **TestOverlappingCases** (3 tests)
   - Two overlapping squares
   - Fully contained square
   - Three overlapping squares

3. **TestComplexGeometries** (3 tests)
   - Grid of squares
   - L-shaped configuration
   - Many small squares

4. **TestEdgeCases** (4 tests)
   - Single point square
   - Very large square
   - Negative coordinates
   - Precision requirement

5. **TestFunctionalCorrectness** (2 tests)
   - Area conservation
   - Deterministic output

6. **Standalone Test** (1 test)
   - Import successful

## Evaluation Report Structure

The evaluation generates a JSON report with the following structure:

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601 with Z",
  "finished_at": "ISO-8601 with Z",
  "duration_seconds": 2.5,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {
      "passed": true,
      "return_code": 0,
      "output": "pytest output (truncated to 8000 chars)"
    },
    "metrics": {}
  },
  "after": {
    "tests": {
      "passed": true,
      "return_code": 0,
      "output": "pytest output (truncated to 8000 chars)"
    },
    "metrics": {}
  },
  "comparison": {
    "passed_gate": true,
    "improvement_summary": "After implementation passed correctness tests"
  },
  "success": true,
  "error": null
}
```

## Success Criteria

The evaluation succeeds (`success: true`) when:
- `after.tests.passed == true` (default success rule)
- All tests pass for the "after" implementation

## Regenerate Patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/diff.patch
```

Or manually:

```bash
diff -u repository_before/solution.py repository_after/solution.py > patches/diff.patch
```

## Key Differences: Before vs After

| Aspect | Before (Naive) | After (Optimized) |
|--------|---------------|-------------------|
| **Algorithm** | Coordinate compression + brute force | Sweep line with event processing |
| **Time Complexity** | O(n² log n) or worse | O(n log² n) |
| **Space Complexity** | O(n²) intermediate grids | O(n) events |
| **Code Structure** | Monolithic functions | Modular classes (Event, IntervalSet, SweepLineSolver) |
| **Scalability** | Struggles with 100+ squares | Handles thousands efficiently |

## Troubleshooting

### Tests Fail for One Implementation

- Check that `PYTHONPATH` is set correctly
- Verify the solution module can be imported
- Check test output for specific failure messages

### Evaluation Fails

- Ensure both `repository_before` and `repository_after` exist
- Check that `tests/` directory is present
- Verify pytest is installed: `pip install -r requirements.txt`

### Docker Issues

- Ensure Docker is running
- Rebuild image if code changes: `docker compose build`
- Check volumes are mounted correctly

## Performance Notes

Both implementations produce **identical results** (functional equivalence), but:
- **Before**: Simple, correct, but doesn't scale
- **After**: Same behavior, production-grade with better performance

The evaluation focuses on **correctness**, not performance metrics (metrics are optional and empty in this case).
