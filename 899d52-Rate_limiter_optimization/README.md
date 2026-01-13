# Rate Limiter Optimization

This dataset task contains a naive rate limiter implementation that needs to be optimized into a high-performance, distributed token bucket rate limiter.

## Problem Statement

Design and implement a high-performance, distributed rate limiter for a global payment platform handling tens of thousands of requests per second. The existing centralized limiter introduces unacceptable latency, inconsistency, and single-point-of-failure risks.

## Requirements/Criteria

**All 6 requirements must be met for this task:**

1. **Implement the token bucket algorithm without external dependencies**
   - Must use proper TokenBucket class implementation
   - No external libraries (redis, memcache, etc.)
   - Pure Python implementation

2. **Support dynamic rate adjustment (e.g., from 1000 to 5000 requests/minute) without dropping requests**
   - Must have `update_rate()` method
   - Rate changes must preserve existing tokens proportionally
   - No request dropping during rate transitions

3. **Handle clock skew between servers (±100ms)**
   - Must tolerate backward time jumps up to 100ms
   - Must handle significant clock resets gracefully
   - Must support `clock_skew_tolerance` parameter

4. **Thread-safe for 100+ concurrent threads**
   - Must handle 100+ concurrent threads without race conditions
   - Must use proper locking mechanisms
   - Atomic operations for token consumption

5. **Memory efficient: ≤ 1KB per rate limit key**
   - Must use `__slots__` for memory optimization
   - Each TokenBucket instance must use ≤1KB memory
   - Must provide cleanup mechanism for inactive buckets

6. **Provide exactly-once semantics during rate limit window transitions**
   - No double-counting of tokens during refill
   - Atomic token consumption
   - Consistent behavior during window transitions

## Folder Layout

- `repository_before/` - naive implementation (fails requirements 1, 2, 5)
- `repository_after/` - optimized token bucket implementation (meets all requirements)
- `tests/` - comprehensive test suite covering all 6 requirements
- `evaluation/` - evaluation scripts
- `patches/` - diff between before/after
- `instances/` - problem instance configuration

## Expected Test Results

### Before Implementation (Expected Failures)
The naive implementation in `repository_before/` **FAILS** 5 critical tests:

```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest tests/ --tb=no -q
```

**Result:**
```
...F..F.F....FF.....                                          [100%]
5 failed, 15 passed in 0.06s

FAILED tests/test_rate_limiter.py::TestRequirement1TokenBucketAlgorithm::test_token_bucket_class_exists
FAILED tests/test_rate_limiter.py::TestRequirement2DynamicRateAdjustment::test_has_update_rate_method
FAILED tests/test_rate_limiter.py::TestRequirement2DynamicRateAdjustment::test_rate_change_without_dropping_requests
FAILED tests/test_rate_limiter.py::TestRequirement5MemoryEfficiency::test_uses_slots_for_memory_efficiency
FAILED tests/test_rate_limiter.py::TestRequirement5MemoryEfficiency::test_bucket_memory_under_1kb
```

**Specific Requirement Failures:**
- ❌ **Requirement 1**: Missing TokenBucket class - "Before implementation missing TokenBucket class - requirement 1 not met"
- ❌ **Requirement 2**: Missing update_rate method - "Before implementation missing update_rate method - requirement 2 not met"
- ❌ **Requirement 2**: Cannot change rates - "Before implementation cannot change rates - requirement 2 not met"
- ❌ **Requirement 5**: Missing TokenBucket for memory optimization - "Before implementation missing TokenBucket - requirement 5 not met"
- ❌ **Requirement 5**: Cannot measure memory efficiency - "Before implementation missing TokenBucket - requirement 5 not met"

### After Implementation (Expected Success)
The optimized implementation in `repository_after/` **PASSES** all requirements:

```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest tests/ --tb=no -q
```

**Result:**
```
....................                                          [100%]
20 passed in 0.12s
```

**All Requirements Met:**
- ✅ **Requirement 1**: Proper TokenBucket algorithm, no external dependencies
- ✅ **Requirement 2**: Dynamic rate adjustment with `update_rate()`
- ✅ **Requirement 3**: Clock skew tolerance (±100ms)
- ✅ **Requirement 4**: Thread-safe for 100+ concurrent threads
- ✅ **Requirement 5**: Memory efficient with `__slots__`, ≤1KB per key
- ✅ **Requirement 6**: Exactly-once semantics with atomic operations

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected 5 failures on requirements 1, 2, 5)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest -v tests/
```

**Expected behavior:**
- **5 FAILED tests** demonstrating missing critical requirements
- **15 PASSED tests** for basic functionality that works despite limitations
- Clear error messages showing which requirements are not met

### Run tests (after – expected all pass)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -v tests/
```

**Expected behavior:**
- **20 PASSED tests** demonstrating all 6 requirements are met
- Full TokenBucket implementation with all optimizations

### Run evaluation (compares both implementations)
```bash
docker compose run --rm app python evaluation/evaluation.py
```

**Expected output:**
```
============================================================
EVALUATION SUMMARY
============================================================

Before Implementation (repository_before):
  Overall: ❌ FAILED (expected - naive implementation)
  Tests: 15/20 passed

After Implementation (repository_after):
  Overall: ✅ PASSED
  Tests: 20/20 passed
```

This will:
- Run tests for both before and after implementations
- Show clear **FAILURES** (not skips) in before implementation
- Show all requirements met in after implementation
- Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`

### Run evaluation with custom output file
```bash
docker compose run --rm app python evaluation/evaluation.py --output /path/to/custom/report.json
```

## Run locally

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run all tests
```bash
# Test before implementation (expect 5 failures)
PYTHONPATH=repository_before pytest -v tests/

# Test after implementation (expect all pass)
PYTHONPATH=repository_after pytest -v tests/
```

## Test Coverage by Requirement

The test suite comprehensively covers all 6 requirements with specific test classes:

### Requirement 1: Token Bucket Algorithm
- **`TestRequirement1TokenBucketAlgorithm`**
  - `test_token_bucket_class_exists` - ❌ FAILS (before) / ✅ PASSES (after)
  - `test_no_external_dependencies` - ✅ PASSES (both)
  - `test_basic_token_bucket_behavior` - ✅ PASSES (both)

### Requirement 2: Dynamic Rate Adjustment  
- **`TestRequirement2DynamicRateAdjustment`**
  - `test_has_update_rate_method` - ❌ FAILS (before) / ✅ PASSES (after)
  - `test_rate_change_1000_to_5000_preserves_tokens` - ✅ PASSES (both)
  - `test_rate_change_without_dropping_requests` - ❌ FAILS (before) / ✅ PASSES (after)

### Requirement 3: Clock Skew Handling
- **`TestRequirement3ClockSkewHandling`**
  - `test_handles_minor_clock_skew_100ms` - ✅ PASSES (both)
  - `test_handles_significant_clock_skew` - ✅ PASSES (both)

### Requirement 4: Thread Safety
- **`TestRequirement4ThreadSafety`**
  - `test_concurrent_100_threads_no_race_conditions` - ✅ PASSES (both)
  - `test_concurrent_same_user_rate_limiting` - ✅ PASSES (both)

### Requirement 5: Memory Efficiency
- **`TestRequirement5MemoryEfficiency`**
  - `test_uses_slots_for_memory_efficiency` - ❌ FAILS (before) / ✅ PASSES (after)
  - `test_bucket_memory_under_1kb` - ❌ FAILS (before) / ✅ PASSES (after)
  - `test_cleanup_removes_inactive_buckets` - ✅ PASSES (both)

### Requirement 6: Exactly-Once Semantics
- **`TestRequirement6ExactlyOnceSemantics`**
  - `test_no_double_counting_at_refill` - ✅ PASSES (both)
  - `test_atomic_token_consumption` - ✅ PASSES (both)
  - `test_window_transition_consistency` - ✅ PASSES (both)

## Key Differences Demonstrated

### Before Implementation Issues
1. **Import Bug**: `from time import time` but calls `time.time()` - causes AttributeError
2. **Missing TokenBucket**: No proper token bucket algorithm implementation
3. **No Dynamic Rates**: Missing `update_rate()` method
4. **Global Rate Limit**: Ignores user_id, not per-user
5. **No Memory Optimization**: No `__slots__`, no cleanup mechanism
6. **Not Thread-Safe**: No locking, race conditions possible

### After Implementation Features
1. **Proper TokenBucket**: Full algorithm implementation with `__slots__`
2. **Dynamic Rate Adjustment**: `update_rate()` preserves tokens proportionally
3. **Clock Skew Tolerance**: Handles ±100ms time inconsistencies
4. **Thread-Safe**: Fine-grained locking for 100+ concurrent threads
5. **Memory Efficient**: ≤1KB per key with cleanup mechanism
6. **Exactly-Once Semantics**: Atomic operations, no double-counting

## Performance Characteristics

The optimized rate limiter provides:

- **Per-user token buckets** with independent rate limits
- **Thread-safe operations** using fine-grained locking
- **Dynamic rate adjustment** preserving existing tokens
- **Clock skew tolerance** handling time inconsistencies
- **Memory optimization** using `__slots__` and cleanup
- **Exactly-once semantics** with atomic token consumption
- **High performance** suitable for payment platform scale

## Regenerate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/diff.patch
```