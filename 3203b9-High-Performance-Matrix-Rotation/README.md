# Bug Fix: High-Performance Matrix Rotation

This dataset task contains a production-style Python function for rotating n×n matrices 90 degrees clockwise with an intentional runtime bug.
The objective is to **identify and fix the NameError bug** while preserving the **O(n²) time complexity** and **O(1) space complexity** of the in-place rotation algorithm.

## Problem Statement

The `rotate_2d_matrix` function implements a layer-by-layer rotation approach with in-place modifications. The algorithm should:
1. Divide the matrix into concentric square layers
2. Process each layer from outermost to innermost
3. Perform four-way cyclic swaps of corresponding elements
4. Use offset tracking to handle element positions during rotation

**The Bug**: The function currently fails with `NameError: name 'i' is not defined` due to a variable naming issue where the loop variable is declared with a Cyrillic character `і` (U+0456) but referenced as ASCII `i`.

## Folder Layout

- `repository_before/` — original implementation with the NameError bug
- `repository_after/` — fixed implementation
- `tests/` — comprehensive test suite including edge cases and benchmarks
- `evaluation/` — evaluation scripts comparing before/after implementations
- `instances/` — problem instance metadata (JSON)
- `patches/` — diff between before/after implementations
- `trajectory/` — detailed problem-solving methodology (Markdown)

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected failures)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest -v --tb=short
```

**Expected behavior:**
- Most tests: ❌ FAIL (due to NameError: name 'i' is not defined)
- Only 1×1 test passes (loop never executes)
- All other tests show: `NameError: name 'i' is not defined`

**Example failure output:**
```
tests/test_matrix_rotation.py::test_rotate_2x2 FAILED
...
NameError: name 'i' is not defined
```

### Run tests (after – expected all pass)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -v
```

**Expected behavior:**
- All tests: ✅ PASS
- Edge cases (1×1, 2×2): ✅ PASS
- Small matrices (3×3, 5×5): ✅ PASS
- Medium matrices (100×100, 500×500): ✅ PASS
- Large matrices (1000×1000, 2000×2000): ✅ PASS
- Performance benchmarks within acceptable time limits

### Run evaluation (compares both implementations)
```bash
docker compose run --rm app python evaluation/evaluation.py
```

This will:
- Run tests for both before (buggy) and after (fixed) implementations
- Collect individual test results with pass/fail status
- Verify the bug fix resolves all failures
- Generate a report at `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

### Run evaluation with custom output file
```bash
docker compose run --rm app python evaluation/evaluation.py --output /path/to/custom/report.json
```

## Run Locally

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run all tests with failure details (before implementation)
```bash
# Show test failures with details
PYTHONPATH=repository_before pytest -v --tb=short tests/
```

### Run all tests (after implementation)
```bash
# Set PYTHONPATH to repository_after and run tests
PYTHONPATH=repository_after pytest -v

# Or run the comprehensive test suite directly
PYTHONPATH=repository_after python3 tests/test_matrix_rotation.py
```

### Run evaluation locally
```bash
python3 evaluation/evaluation.py
```

## Performance Requirements

The fixed implementation must meet these performance criteria:

### Time Complexity
- **Expected**: O(n²) - optimal since every element must be visited
- **Verified**: All benchmark tests confirm linear scaling with n²

### Benchmarking Results
- **1×1 matrix**: Instant
- **2×2 matrix**: Instant
- **3×3 matrix**: Instant
- **100×100 matrix**: ~0.001s
- **500×500 matrix**: ~0.03s
- **1000×1000 matrix**: ~0.15s
- **2000×2000 matrix**: ~0.64s

### Space Complexity
- **Expected**: O(1) extra space (in-place rotation)
- **Verified**: Function modifies matrix in-place, returns None

## Test Coverage

The test suite includes:

### Edge Cases
- 1×1 matrix (trivial case)
- 2×2 matrix (smallest non-trivial case)

### Small Matrices
- 3×3 matrix (odd dimension)
- 4×4 matrix (even dimension)
- 5×5 matrix (larger odd dimension)

### Medium Matrices
- 100×100 matrix
- 500×500 matrix

### Large Matrices
- 1000×1000 matrix
- 2000×2000 matrix

### Correctness Tests
- In-place modification verification
- Double rotation (180°)
- Quadruple rotation (360° = identity)

## Regenerate Patch

From repository root:

```bash
git diff --no-index repository_before/rotation.py repository_after/rotation.py > patches/diff.patch
```

## Bug Details

**Line 6 in repository_before/rotation.py**:
```python
і = _len - 1 - row  # Cyrillic 'і' (U+0456)
```

**Lines 9-12** reference the variable as:
```python
matrix[i - offset][row]  # ASCII 'i'
matrix[i][i - offset]    # ASCII 'i'
```

This mismatch causes `NameError: name 'i' is not defined` at runtime.

**Fix**: Change the Cyrillic `і` to ASCII `i` on line 6

### Report Schema

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "duration_seconds": 0.0,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {},
    "metrics": {}
  },
  "after": {
    "tests": {},
    "metrics": {}
  },
  "comparison": {},
  "success": true,
  "error": null
}
```

The developer should add any additional metrics and keys that reflect the runs (e.g., data seeded to test the code on before/after repository).

---

## Final README Contents
> **Note:** Replace the template content above with the following sections before pushing:

1. **Problem Statement**
2. **Prompt Used**
3. **Requirements Specified**
4. **Commands:**
   - Commands to spin up the app and run tests on `repository_before`
   - Commands to run tests on `repository_after`
   - Commands to run `evaluation/evaluation.py` and generate reports
   
   > **Note:** For full-stack app tasks, the `repository_before` commands will be empty since there is no app initially.
