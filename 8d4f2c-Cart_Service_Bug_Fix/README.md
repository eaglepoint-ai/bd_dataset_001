# Cart Service Bug Fix

## Problem Statement

The `CartService` handles shopping cart operations for a food delivery application. Users have reported multiple critical issues in production:

1. **Mixed merchant items** - Customers can add items from Pizza Palace to a cart that already contains items from Burger Barn, causing checkout to fail with "Cannot order from multiple merchants" error after items were already added.

2. **Invalid quantities accepted** - The API accepts quantity values of 0 or -5, resulting in corrupted cart totals showing negative prices.

3. **Duplicate items on rapid clicks** - When users quickly tap "Add to Cart" multiple times, the same item appears twice despite duplicate detection logic.

4. **Discounts not applied** - Items with active 20% off promotions still show full price in the cart instead of the discounted price.

5. **Remove gives no feedback** - After removing an item, the frontend receives null instead of the updated cart, causing UI sync issues.

6. **Cart totals wrong after update** - Changing item quantity from 2 to 5 updates the item subtotal but the cart's total pricing (subtotal and totalItems) stays the same.

The service is used by 50K+ daily active users.

## Solution Summary

All 6 bugs were fixed in `repository_after/cartService.js`:

| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| Mixed merchant items | No validation before adding | Added merchant ID check before item addition |
| Invalid quantities | Missing validation | Added `Number.isInteger(quantity) && quantity > 0` check |
| Duplicate items | Race condition with find-then-insert | Used atomic `findOneAndUpdate` with `$push` |
| Discounts not applied | Inverted date range logic | Fixed condition: apply when `isWithinDateRange` is true |
| Remove gives no feedback | `return null` hardcoded | Changed to `return cart` |
| Cart totals wrong | No recalculation after update | Added pricing recalculation after all modifications |

## Requirements

1. Throw error when adding item from different merchant than existing cart items
2. Validate quantity is a positive integer greater than zero
3. Use atomic operation to prevent duplicate items on concurrent requests
4. Apply discounted price when discount is active and within valid date range
5. Return updated cart from removeFromCart instead of null
6. Return updated cart from clearCart instead of null
7. Recalculate cart pricing.subtotal after any item modification
8. Recalculate cart pricing.totalItems after any item modification
9. Initialize pricing object when creating new cart
10. Ensure all Decimal128 price values are converted correctly

## Tech Stack

- **Language:** JavaScript (Node.js)
- **Database:** MongoDB with Mongoose ODM
- **Testing:** Jest + mongodb-memory-server
- **Container:** Docker with multi-stage builds

## Commands

```bash
# Run tests against buggy implementation (repository_before)
docker compose run --rm before
# Expected: 8/17 tests pass, 9 fail

# Run tests against fixed implementation (repository_after)
docker compose run --rm after
# Expected: 17/17 tests pass

# Run full evaluation with JSON report
docker compose run --rm evaluation
# Generates report at evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

## Test Results

| Implementation | Tests Passed | Tests Failed | Total |
|----------------|--------------|--------------|-------|
| Before (buggy) | 8 | 9 | 17 |
| After (fixed)  | 17 | 0 | 17 |

## Project Structure

```
8d4f2c-Cart_Service_Bug_Fix/
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Three services: before, after, evaluation
├── README.md                  # This file
├── repository_before/         # Original buggy implementation
│   └── cartService.js
├── repository_after/          # Fixed implementation
│   └── cartService.js
├── tests/
│   └── cartService.test.js    # 17 comprehensive tests
├── evaluation/
│   ├── evaluation.js          # Evaluation runner
│   └── reports/               # Generated JSON reports
├── patches/
│   └── diff.patch             # Git diff between before/after
└── trajectory/
    └── trajectory.md          # Development trajectory
```

## Category

Bug Fix

