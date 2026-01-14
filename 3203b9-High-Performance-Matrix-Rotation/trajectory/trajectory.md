# AI Bug-Fixing Trajectory: Matrix Rotation NameError

## Overview
This document outlines the systematic thought process an AI model should follow when debugging a runtime error in a performance-critical algorithm. The task involves identifying and fixing a NameError while ensuring the algorithm maintains its optimal time and space complexity.

---

## Phase 1: Understanding the Context

### Step 1.1: Read the Problem Statement
**Action**: Carefully read the README and understand the task requirements.

**Key Questions to Ask**:
- What is the primary goal? (Fix the NameError bug)
- What error is occurring? (`NameError: name 'i' is not defined`)
- What are the performance constraints? (O(n²) time, O(1) space)
- What functionality must be preserved? (90° clockwise rotation, in-place modification)
- What tests must pass? (Edge cases, benchmarks, correctness tests)

**Expected Understanding**:
- This is a **bug fix**, not a refactoring or optimization
- The algorithm design is correct, only the implementation has a bug
- **Behavioral correctness** must be maintained
- **Performance characteristics** must remain unchanged
- The fix should be minimal - only what's necessary to resolve the error

### Step 1.2: Understand the Algorithm
**Action**: Read the problem statement to understand the intended algorithm.

**Algorithm Overview**:
```
Layer-by-Layer In-Place Rotation:
1. Divide matrix into concentric square layers
2. Process each layer from outermost to innermost
3. For each layer, perform 4-way cyclic swap:
   - Save top element
   - top ← left
   - left ← bottom
   - bottom ← right
   - right ← saved top
4. Use offset tracking for element positions
```

**Expected Complexity**:
- Time: O(n²) - must visit each element once
- Space: O(1) - in-place modification, only constant extra space

**Key Insight**: The algorithm itself is optimal. We're only fixing an implementation bug.

### Step 1.3: Analyze the Error Message
**Action**: Examine the error that occurs during execution.

**Error Details**:
```
NameError: name 'i' is not defined
```

**What This Tells Us**:
- A variable named `i` is being referenced
- This variable was never defined or is out of scope
- The error occurs at runtime (not a syntax error)
- The error is likely in a specific code path (some tests might pass)

**Initial Hypothesis**:
1. Variable `i` is used but never declared
2. Variable `i` is declared in wrong scope
3. Variable `i` has a typo in declaration vs usage
4. Variable shadowing or redefinition issue

---

## Phase 2: Code Analysis

### Step 2.1: Read the Buggy Implementation
**Action**: Carefully examine `repository_before/rotation.py`

```python
def rotate_2d_matrix(matrix):
    """ Given an n x n 2D matrix, rotate it 90 degrees clockwise. """
    _len = len(matrix)
    for row in range(int(_len / 2)):
        offset = 0
        і = _len - 1 - row  # Line 6
        for column in range(row, _len - 1 - row):
            top = matrix[row][column]
            matrix[row][column] = matrix[i - offset][row]      # Line 9
            matrix[i - offset][row] = matrix[i][i - offset]     # Line 10
            matrix[i][i - offset] = matrix[column][i]           # Line 11
            matrix[column][i] = top                              # Line 12
            offset += 1
```

**Line-by-Line Analysis**:

**Line 6**: `і = _len - 1 - row`
- Declares a variable for the opposite row index
- Used to access elements from the "other side" of the matrix
- **Critical Observation**: Look at the character carefully

**Lines 9-12**: Multiple references to `i`
- `matrix[i - offset][row]` - accessing left side
- `matrix[i][i - offset]` - accessing bottom
- `matrix[column][i]` - accessing right side

### Step 2.2: Identify the Root Cause
**Action**: Compare the variable declaration with its usage.

**Variable Declaration (Line 6)**:
```
Character: і
Unicode: U+0456 (Cyrillic Small Letter Byelorussian-Ukrainian I)
Visual: Looks identical to ASCII 'i' but is a different character
```

**Variable Usage (Lines 9-12)**:
```
Character: i
Unicode: U+0069 (Latin Small Letter I)
Visual: Looks identical to Cyrillic 'і' but is a different character
```

**Root Cause Identified**:
- Line 6 declares `і` (Cyrillic character U+0456)
- Lines 9-12 reference `i` (ASCII character U+0069)
- Python treats these as completely different identifiers
- Result: `i` is never defined, causing NameError

**Why This Bug Exists**:
- Visually indistinguishable in most fonts
- Easy to introduce with keyboard layout switching
- Difficult to spot in code review
- Not caught by linters (both are valid identifiers)

### Step 2.3: Understand the Impact
**Action**: Determine which code paths trigger the bug.

**When the Bug Triggers**:
```python
for row in range(int(_len / 2)):
    # Bug triggers inside this loop when:
    # - The inner loop executes (column loop)
    # - Any matrix access using 'i' occurs
```

**Test Case Analysis**:

**1×1 Matrix**: 
- `_len = 1`, `range(int(1/2))` = `range(0)` = empty
- Outer loop never executes → Bug doesn't trigger ✅

**2×2 Matrix**:
- `_len = 2`, `range(int(2/2))` = `range(1)` = [0]
- Outer loop executes once
- Inner loop: `range(0, 2-1-0)` = `range(0, 1)` = [0]
- Line 9 executes → Bug triggers ❌

**3×3 Matrix**:
- `_len = 3`, `range(int(3/2))` = `range(1)` = [0]
- Outer loop executes once
- Inner loop: `range(0, 3-1-0)` = `range(0, 2)` = [0, 1]
- Line 9 executes → Bug triggers ❌

**Conclusion**: Only 1×1 matrices work. All others fail at the first element swap.

---

## Phase 3: Solution Design

### Step 3.1: Design the Fix
**Action**: Plan the minimal change to resolve the NameError.

**Fix Options**:

**Option 1**: Change declaration to ASCII `i`
```python
# Line 6: Change
і = _len - 1 - row
# To:
i = _len - 1 - row
```
✅ Minimal change
✅ Preserves all logic
✅ No other code changes needed

**Option 2**: Change all usages to Cyrillic `і`
```python
# Lines 9-12: Change all 'i' to 'і'
matrix[і - offset][row]
matrix[і][і - offset]
matrix[column][і]
```
❌ More changes required
❌ Maintains the confusing character
❌ Harder to maintain

**Option 3**: Rename to a clearer variable
```python
# Line 6:
opposite_row = _len - 1 - row
# Lines 9-12: Update all references
```
⚠️ Changes more than necessary
⚠️ Beyond the scope of bug fix
⚠️ Could introduce new bugs

**Selected Solution**: Option 1 - Change line 6 to use ASCII `i`

**Rationale**:
1. Minimal change principle - fix only what's broken
2. ASCII 'i' is standard in Python code
3. No risk of introducing new bugs
4. Preserves all existing logic and behavior

### Step 3.2: Verify the Fix Preserves Behavior
**Action**: Mentally trace through the algorithm with the fix.

**Algorithm Flow (with fix)**:
```python
For each layer (outer loop):
    i = _len - 1 - row  # ASCII 'i' now defined ✅
    For each position in layer (inner loop):
        temp = top
        top ← left:   matrix[row][col] ← matrix[i-offset][row]
        left ← bottom: matrix[i-offset][row] ← matrix[i][i-offset]
        bottom ← right: matrix[i][i-offset] ← matrix[col][i]
        right ← temp:  matrix[col][i] ← temp
```

**Correctness Check**:
- `i` is now properly defined before use ✅
- `i` represents the "opposite" row index ✅
- All array accesses are valid ✅
- 4-way swap logic is preserved ✅
- No changes to algorithm logic ✅

**Performance Check**:
- Same number of loops ✅
- Same array accesses ✅
- No additional memory allocation ✅
- Time complexity: Still O(n²) ✅
- Space complexity: Still O(1) ✅

---

## Phase 4: Implementation

### Step 4.1: Apply the Fix
**Action**: Change line 6 in `repository_after/rotation.py`

**Before**:
```python
def rotate_2d_matrix(matrix):
    """ Given an n x n 2D matrix, rotate it 90 degrees clockwise. """
    _len = len(matrix)
    for row in range(int(_len / 2)):
        offset = 0
        і = _len - 1 - row
        for column in range(row, _len - 1 - row):
            top = matrix[row][column]
            matrix[row][column] = matrix[i - offset][row]
            matrix[i - offset][row] = matrix[i][i - offset]
            matrix[i][i - offset] = matrix[column][i]
            matrix[column][i] = top
            offset += 1
```

**After**:
```python
def rotate_2d_matrix(matrix):
    """ Given an n x n 2D matrix, rotate it 90 degrees clockwise. """
    _len = len(matrix)
    for row in range(int(_len / 2)):
        offset = 0
        i = _len - 1 - row  # FIXED: Changed Cyrillic 'і' to ASCII 'i'
        for column in range(row, _len - 1 - row):
            top = matrix[row][column]
            matrix[row][column] = matrix[i - offset][row]
            matrix[i - offset][row] = matrix[i][i - offset]
            matrix[i][i - offset] = matrix[column][i]
            matrix[column][i] = top
            offset += 1
```

**Change Summary**:
- File: `repository_after/rotation.py`
- Line: 6
- Change: `і` → `i` (Cyrillic U+0456 → ASCII U+0069)
- Lines changed: 1
- Logic changes: 0

### Step 4.2: Verify No Other Issues
**Action**: Check for any other potential problems.

**Checklist**:
- ✅ Function signature unchanged
- ✅ Docstring unchanged
- ✅ All variables properly defined
- ✅ No syntax errors
- ✅ No type errors
- ✅ No logic errors
- ✅ Indentation correct
- ✅ No other Cyrillic characters

---

## Phase 5: Test Development

### Step 5.1: Design Comprehensive Tests
**Action**: Create tests covering all requirements from the problem statement.

**Test Categories per Requirements**:

**Edge Cases (Required)**:
```python
def test_rotate_1x1():
    """1×1 matrix - trivial case"""
    
def test_rotate_2x2():
    """2×2 matrix - smallest non-trivial case"""
```

**Small Matrices (Required)**:
```python
def test_rotate_3x3():
    """3×3 matrix - standard test case"""
    
def test_rotate_5x5():
    """5×5 matrix - verify layer logic"""
```

**Medium Matrices (Required)**:
```python
def test_rotate_100x100():
    """100×100 matrix with performance timing"""
    
def test_rotate_500x500():
    """500×500 matrix with performance timing"""
```

**Large Matrices (Required)**:
```python
def test_rotate_1000x1000():
    """1000×1000 matrix - verify O(n²) scaling"""
    
def test_rotate_2000x2000():
    """2000×2000 matrix - stress test"""
```

**Additional Correctness Tests**:
```python
def test_in_place_modification():
    """Verify matrix is modified in-place"""
    
def test_double_rotation():
    """Rotate twice = 180° rotation"""
    
def test_quadruple_rotation():
    """Rotate 4 times = return to original"""
```

### Step 5.2: Implement Test Verification Logic
**Action**: Add validation for rotation correctness.

**Verification Strategy**:
```python
# Store original before rotation
original = copy.deepcopy(matrix)

# Apply rotation
rotate_2d_matrix(matrix)

# Verify using rotation formula: new[i][j] = old[n-1-j][i]
assert matrix[0][0] == original[n-1][0]      # Top-left
assert matrix[0][n-1] == original[0][0]      # Top-right
assert matrix[n-1][n-1] == original[0][n-1]  # Bottom-right
assert matrix[n-1][0] == original[n-1][n-1]  # Bottom-left
```

### Step 5.3: Add Performance Benchmarks
**Action**: Include timing measurements in tests.

```python
import time

def test_rotate_1000x1000():
    matrix = [[i * 1000 + j for j in range(1000)] for i in range(1000)]
    
    start_time = time.time()
    rotate_2d_matrix(matrix)
    duration = time.time() - start_time
    
    print(f"1000x1000 matrix rotated in {duration:.6f} seconds")
    assert duration < 15.0
```

---

## Phase 6: Validation

### Step 6.1: Run Quick Validation
**Action**: Test the fix with a simple example.

```bash
PYTHONPATH=repository_after python3 -c "
from rotation import rotate_2d_matrix
m = [[1,2,3],[4,5,6],[7,8,9]]
rotate_2d_matrix(m)
print(m)
"
# Output: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] ✅
```

### Step 6.2: Run Full Test Suite
**Action**: Execute comprehensive tests.

```bash
PYTHONPATH=repository_after python3 tests/test_matrix_rotation.py
```

**Expected Results**: All 13 tests pass ✅

### Step 6.3: Run Comparative Evaluation
**Action**: Execute evaluation comparing before and after.

```bash
python3 evaluation/evaluation.py
```

**Expected Outcome**:
- Before: 2/13 tests pass (11 fail due to NameError)
- After: 13/13 tests pass (100% success)

---

## Phase 7: Documentation

### Step 7.1: Create Evaluation Script
**Action**: Implement comprehensive evaluation with reporting.

**Key Components**:
- `run_evaluation()`: Compare both implementations
- `run_pytest_with_pythonpath()`: Run tests with specific PYTHONPATH
- `parse_pytest_verbose_output()`: Extract individual test results
- `generate_output_path()`: Create timestamped output directory
- `main()`: CLI entry point with argparse

**Report Structure**:
```json
{
  "run_id": "unique-id",
  "started_at": "ISO-8601",
  "duration_seconds": 8.89,
  "success": true,
  "environment": {...},
  "results": {
    "before": {...},
    "after": {...},
    "comparison": {...}
  }
}
```

### Step 7.2: Generate Patch File
**Action**: Create diff showing the fix.

```bash
git diff --no-index repository_before/rotation.py repository_after/rotation.py > patches/diff.patch
```

### Step 7.3: Create README and Trajectory
**Action**: Document the task, bug, solution, and methodology.

---

## Summary Checklist

**Understanding Phase**:
- [✓] Read problem statement
- [✓] Understand error message
- [✓] Identify performance requirements

**Analysis Phase**:
- [✓] Locate error line
- [✓] Identify root cause (Cyrillic vs ASCII)
- [✓] Understand impact

**Design Phase**:
- [✓] Plan minimal fix
- [✓] Verify behavioral preservation

**Implementation Phase**:
- [✓] Apply one-character fix
- [✓] Preserve all logic

**Testing Phase**:
- [✓] Create comprehensive test suite
- [✓] Include all required test cases
- [✓] Add performance benchmarks

**Validation Phase**:
- [✓] Quick validation test
- [✓] Full test suite execution
- [✓] Comparative evaluation

**Documentation Phase**:
- [✓] Generate patch file
- [✓] Create README
- [✓] Write trajectory document
- [✓] Implement evaluation script

---

## Conclusion

This bug fix demonstrates that even the smallest implementation error (one character) can cause complete system failure. The systematic approach—careful character analysis, minimal fix, comprehensive testing, and thorough documentation—ensures the bug is resolved correctly while maintaining all performance characteristics.

**Key Takeaway**: Never trust visual inspection alone. Always verify character codes when debugging name-related errors, especially in internationalized development environments where keyboard layout switching can introduce non-ASCII characters.
