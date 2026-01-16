# Testing Guide

This project includes comprehensive testing for both the unoptimized (before) and optimized (after) implementations.

## Test Structure

```
tests/
├── test.js           # Legacy combined test (uses TEST_TARGET env var)
├── test_before.js    # Dedicated test for repository_before
└── test_after.js     # Dedicated test for repository_after
```

## Running Tests

### Quick Commands

| Command | Description |
|---------|-------------|
| `npm run test:before` | Test the unoptimized implementation |
| `npm run test:after` | Test the optimized implementation |
| `npm run test:all` | Test both implementations sequentially |
| `npm test` | Legacy test (requires TEST_TARGET env var) |

### Detailed Test Descriptions

#### 1. Test Before (Unoptimized)

**Command:** `npm run test:before`

**Purpose:** Verifies that the unoptimized implementation does NOT contain optimization features.

**Checks:**
- ✗ React.memo should be ABSENT
- ✗ useCallback should be ABSENT
- ✗ useReducer should be ABSENT
- ✓ Basic component structure should be PRESENT
- ✓ useState for items should be PRESENT
- ✓ useState for search should be PRESENT

**Expected Result:** All tests PASS (optimization features correctly absent)

---

#### 2. Test After (Optimized)

**Command:** `npm run test:after`

**Purpose:** Verifies that the optimized implementation contains ALL required optimization features.

**Checks:**
- ✓ React.memo on Item component
- ✓ useCallback for handleUpdate
- ✓ useReducer for state management
- ✓ Separated search state
- ✓ console.log for debugging
- ✓ Reducer function defined
- ✓ Explanation comment present

**Expected Result:** All tests PASS (all optimization features present)

---

#### 3. Test All

**Command:** `npm run test:all`

**Purpose:** Runs both test:before and test:after sequentially to validate the complete refactoring.

**Expected Result:** Both test suites pass, confirming:
1. Before implementation has no optimizations
2. After implementation has all optimizations

---

## Test Output Examples

### Before Implementation Test Output

```
Running tests against BEFORE (unoptimized) implementation.
Expected: NO optimization features should be present

=== Optimization Features (should be ABSENT) ===
React.memo on Item: PASS (correctly absent)
useCallback for handleUpdate: PASS (correctly absent)
useReducer for state: PASS (correctly absent)

=== Basic Structure (should be PRESENT) ===
Item component exists: PASS (correctly present)
Dashboard component exists: PASS (correctly present)
useState for items: PASS (correctly present)
useState for search: PASS (correctly present)

✓ All tests passed!
```

### After Implementation Test Output

```
Running tests against AFTER (optimized) implementation.
Expected: ALL optimization features should be present

=== Required Optimizations ===
React.memo on Item: PASS ✓
  → Prevents unnecessary re-renders of Item components
useCallback for handleUpdate: PASS ✓
  → Ensures stable function reference across renders
useReducer for state: PASS ✓
  → Efficient state management with O(1) updates
Separated search state: PASS ✓
  → Search state independent from items state
console.log in Item: PASS ✓
  → Demonstrates surgical re-renders (debugging)

=== Quality Checks ===
Reducer function defined: PASS ✓
  → Reducer handles state updates
Dashboard component exists: PASS ✓
  → Main component is exported
Item component defined: PASS ✓
  → Item component is defined

=== Documentation ===
Explanation comment: PASS ✓

==================================================
✓ ALL TESTS PASSED!
The implementation meets all optimization requirements.
==================================================
```

---

## Docker Testing

### Test Before with Docker

```bash
docker build -t react-optimization .
docker run --rm -e TEST_TARGET=before react-optimization npm test
```

### Test After with Docker

```bash
docker build -t react-optimization .
docker run --rm react-optimization npm test
```

Or:

```bash
docker build -t react-optimization .
docker run --rm -e TEST_TARGET=after react-optimization npm test
```

---

## Continuous Integration

For CI/CD pipelines, use:

```bash
npm run test:all
```

This ensures both implementations are validated in a single command.

---

## Troubleshooting

### Test Fails on Before Implementation

If optimization features are detected in the before implementation:
- Check that `repository_before/dashboard.js` doesn't contain React.memo, useCallback, or useReducer
- Verify you're testing the correct file

### Test Fails on After Implementation

If optimization features are missing in the after implementation:
- Verify `repository_after/Dashboard.js` contains all required optimizations
- Check that the regex patterns in the test match your code formatting
- Ensure the explanation comment is present

### Exit Codes

- `0` = All tests passed
- `1` = One or more tests failed

---

## Test Maintenance

When modifying the implementations:

1. **Before making changes:** Run `npm run test:all` to establish baseline
2. **After making changes:** Run `npm run test:all` to verify changes
3. **Update tests:** If adding new optimization patterns, update `test_after.js`

---

## Related Files

- `repository_before/dashboard.js` - Unoptimized implementation
- `repository_after/Dashboard.js` - Optimized implementation
- `evaluation/evaluation.js` - Performance evaluation script
- `README.md` - Project documentation
