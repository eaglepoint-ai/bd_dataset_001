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

## Prompt

Fix the bugs in the `CartService` class for a food delivery application.

**Tech Stack:**
- Language: JavaScript (Node.js)
- Database: MongoDB with Mongoose ODM
- The service uses Mongoose models: Cart, MenuItem, Merchant

**Code to Fix:**
The `CartService` class contains methods for cart operations: `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, and `deleteCart`.

**Issues Reported in Production:**

1. **Mixed merchant items** - Customers can add items from Pizza Palace to a cart that already contains items from Burger Barn, causing checkout to fail with "Cannot order from multiple merchants" error after items were already added.

2. **Invalid quantities accepted** - The API accepts quantity values of 0 or -5, resulting in corrupted cart totals showing negative prices.

3. **Duplicate items on rapid clicks** - When users quickly tap "Add to Cart" multiple times, the same item appears twice despite duplicate detection logic.

4. **Discounts not applied** - Items with active 20% off promotions still show full price in the cart instead of the discounted price.

5. **Remove gives no feedback** - After removing an item, the frontend receives null instead of the updated cart, causing UI sync issues.

6. **Cart totals wrong after update** - Changing item quantity from 2 to 5 updates the item subtotal but the cart's total pricing (subtotal and totalItems) stays the same.

Fix all bugs without changing method signatures. The service is used by 50K+ daily active users.

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

## Category

Bug Fix

## Commands

```bash
# Build Docker image
docker compose build

# Run tests on repository_before (expected: some tests fail)
docker compose run --rm test_before

# Run tests on repository_after (expected: all tests pass)
docker compose run --rm test_after

# Run evaluation (compares both implementations)
docker compose run --rm evaluation
```

## Run Locally

```bash
# Install dependencies
npm install

# Run tests on repository_before
npm run test:before

# Run tests on repository_after
npm run test:after

# Run evaluation
npm run evaluate
```

## Folder Structure

- `repository_before/` — Original buggy implementation
- `repository_after/` — Fixed implementation with bug fixes
- `tests/` — Jest test suite for all 9 requirements
- `evaluation/` — Evaluation script and reports
- `patches/` — Diff between before and after implementations


