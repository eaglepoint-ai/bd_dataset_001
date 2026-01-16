# Trajectory

## Overview

This document describes the development trajectory for fixing 6 critical bugs in the CartService class for a food delivery application.

## Bug Analysis

### Bug 1: Mixed Merchant Items
- **Symptom:** Customers could add items from different merchants, causing checkout failure
- **Root Cause:** No validation of merchant ID when adding items to existing cart
- **Fix Location:** `addToCart()` method, lines 137-177
- **Solution:** Added merchant ID validation in atomic `findOneAndUpdate` query with `$or` condition

### Bug 2: Invalid Quantities Accepted
- **Symptom:** API accepted quantity values of 0 or -5, corrupting cart totals
- **Root Cause:** Missing quantity validation before processing
- **Fix Location:** `addToCart()` line 67-69, `updateCartItem()` line 203-205
- **Solution:** Added check: `if (!Number.isInteger(quantity) || quantity <= 0)`

### Bug 3: Duplicate Items on Rapid Clicks
- **Symptom:** Same item appeared twice when users tapped "Add to Cart" quickly
- **Root Cause:** Race condition with non-atomic find-then-insert pattern
- **Fix Location:** `addToCart()` method, lines 137-177
- **Solution:** Replaced with atomic `findOneAndUpdate` with `$ne` condition on menuItemId

### Bug 4: Discounts Not Applied
- **Symptom:** Items with active promotions showed full price
- **Root Cause:** Inverted date range logic - applied discount when OUTSIDE range
- **Fix Location:** `addToCart()` lines 101-106
- **Solution:** Fixed condition to apply discount when `isWithinDateRange` is true

### Bug 5: Remove Gives No Feedback
- **Symptom:** Frontend received null after removing item
- **Root Cause:** `removeFromCart()` hardcoded `return null`
- **Fix Location:** `removeFromCart()` line 296
- **Solution:** Changed to `return cart`

### Bug 6: Cart Totals Wrong After Update
- **Symptom:** Cart total stayed same after quantity changes
- **Root Cause:** No recalculation of `pricing.subtotal` and `pricing.totalItems`
- **Fix Location:** `updateCartItem()` lines 264-266, `removeFromCart()` lines 291-292, `clearCart()` lines 306-307
- **Solution:** Added pricing recalculation after all item modifications

## Files Modified

| File | Changes |
|------|---------|
| `repository_after/cartService.js` | All 6 bug fixes applied |
| `tests/cartService.test.js` | 17 comprehensive tests created |
| `evaluation/evaluation.js` | Evaluation runner with JSON reports |
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.yml` | Three services: before, after, evaluation |

## Testing Strategy

### Test Categories

1. **Bug 1 Tests:** Merchant validation
   - `should throw error when adding item from different merchant`
   - `should allow adding items from same merchant`

2. **Bug 2 Tests:** Quantity validation
   - `should reject quantity of 0`
   - `should reject negative quantity`
   - `should reject non-integer quantity`
   - `should accept valid positive integer quantity`

3. **Bug 3 Tests:** Duplicate prevention
   - `should prevent duplicate items with atomic operation`

4. **Bug 4 Tests:** Discount logic
   - `should apply discounted price when discount is active`
   - `should use full price when discount is not active`

5. **Bug 5 Tests:** Return value
   - `should return updated cart after removing item`

6. **Bug 6 Tests:** Pricing recalculation
   - `should recalculate pricing.subtotal after quantity update`
   - `should recalculate pricing.totalItems after update`
   - `should recalculate pricing after removeFromCart`

7. **Edge Case Tests:**
   - `should handle cart with items but no merchantId set`
   - `should correctly convert Decimal128 prices`
   - `should return empty cart structure when no cart exists`
   - `should return cart with zeroed pricing`

## Test Results

| Implementation | Passed | Failed | Total |
|----------------|--------|--------|-------|
| repository_before | 8 | 9 | 17 |
| repository_after | 17 | 0 | 17 |

## Docker Commands

```bash
# Test buggy implementation
docker compose run --rm before

# Test fixed implementation
docker compose run --rm after

# Run full evaluation with report
docker compose run --rm evaluation
```

## Key Decisions

1. **Atomic Operations:** Used MongoDB's `findOneAndUpdate` instead of find-then-save to prevent race conditions
2. **Environment Variable:** Used `TEST_REPO` env var to select which repository to test
3. **Multi-stage Docker:** Cached npm dependencies and MongoDB binary in base layer for fast rebuilds
4. **JSON Reports:** Generated structured reports with timestamps, environment info, and test results

