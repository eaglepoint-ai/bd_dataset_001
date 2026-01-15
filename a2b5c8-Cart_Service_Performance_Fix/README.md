# Cart Service Performance Fix

## Problem Statement

The CartService handles shopping cart operations for a food delivery app with 50K+ daily active users. After a recent deployment, performance monitoring shows severe degradation: P99 latency spiked from 80ms to 4500ms, memory usage doubled under load, and database connection pool is exhausting during peak hours. Profiling reveals multiple performance anti-patterns in the service code that compound under high traffic.

## Prompt

Fix the performance issues in cartService.js for a food delivery application. The service handles shopping cart operations using Node.js/Express with MongoDB/Mongoose.

Performance monitoring shows severe degradation after recent changes:
- P99 latency: 80ms → 4500ms
- Memory usage: doubled under load
- DB connections: pool exhaustion during peak

Profiling identified these anti-patterns:

1. N+1 queries in getCart - populate() triggers separate query per item instead of bulk fetch
2. Redundant database fetches - same cart fetched multiple times within single operation
3. No lean() on read-only queries - full Mongoose documents allocated unnecessarily
4. Sequential independent calls - menuItem and cart fetched one after another instead of parallel
5. Over-fetching fields - entire documents loaded when only few fields needed
6. Multiple saves per operation - updateCartItem does 5 separate save() calls
7. Repeated Decimal128 toString() - same value converted multiple times in loops
8. Multiple array passes - separate loops for subtotal and totalItems calculations
9. ObjectId string comparison - using toString() instead of native equals()
10. Date object spam - new Date() called multiple times in discount validation

Fix all performance issues without changing business logic or method signatures. The service handles 50K+ DAU.

## What was implemented (solution)

The optimized implementation lives in `repository_after/cartService.js`. It is a refactor only (no new features), focused on removing the compounded performance anti-patterns under concurrency.

- **N+1 elimination in `getCart`**: removed `populate()`; replaced with bulk `$in` queries for `MenuItem` and `Merchant`.
- **Single cart fetch per operation**: each request path reads the cart once and reuses the same instance.
- **Read-only query optimization**: added `lean()` to read-only queries to avoid allocating full Mongoose documents.
- **Parallel independent work**: `addToCart` fetches `menuItem` and `cart` via `Promise.all`.
- **Strict field selection**: uses `select()` to fetch only required fields from `MenuItem` and `Merchant`.
- **Single persistence operation per request**: consolidated multiple `save()` calls into exactly one `save()` per operation (including the `updateCartItem` menu-item-missing path).
- **Stable numeric conversion**: `Decimal128` values are converted once per accessed value via `decimalToNumber()` and reused.
- **Single-pass pricing recompute**: subtotal and totalItems are computed in one pass via `recalculatePricing(cart)`.
- **Correct identifier semantics**: replaces `toString()` comparison with `ObjectId.equals()`.
- **Single time reference**: discount validation uses a single `now = new Date()` per operation.

## Requirements (enforced)

1. Replace N+1 populate() with bulk $in queries for menu items and merchants
2. Fetch cart once per operation and reuse the instance
3. Add lean() to all read-only database queries
4. Use Promise.all for parallel fetching of independent data (menuItem + cart)
5. Use select() to fetch only required fields from MenuItem and Merchant
6. Consolidate multiple saves into single save per operation
7. Convert Decimal128 values to numbers once and reuse
8. Combine subtotal and totalItems calculation into single array pass
9. Use ObjectId.equals() instead of toString() for ID comparisons
10. Create single Date instance for discount validation

## Verification (reject naive, accept correct)

This task ships a deterministic test harness that:

- **Fails on `repository_before`** for the specific performance anti-patterns (e.g., `populate`, sequential fetch, repeated cart reads/saves, repeated `Date()` construction).
- **Passes on `repository_after`**.

Entry points:

- `tests/test_all.js` runs the suite against `repository_before` or `repository_after`.
- `evaluation/evaluation.js` runs both and writes a JSON report.

## Files

- **Before (slow)**: `repository_before/cartService.js`
- **After (fixed)**: `repository_after/cartService.js`
- **Tests**: `tests/cartService.test.js`, `tests/test_all.js`
- **Evaluation**: `evaluation/evaluation.js` (writes to `evaluation/reports/`)
- **Scripts**: `setup.sh`, `run_before.sh`, `run_after.sh`, `run_evaluation.sh`

## Setup & Run (local)

From `bd_dataset_001/a2b5c8-Cart_Service_Performance_Fix/`:

```bash
npm install

# Run tests against the slow version (expected: FAIL)
node tests/test_all.js before

# Run tests against the fixed version (expected: PASS)
node tests/test_all.js after

# Run evaluation (runs both) and generates a report JSON
node evaluation/evaluation.js
```

Reports are written to:

- `evaluation/reports/<timestamp>.json`
- `evaluation/reports/latest.json`

## Setup & Run (Docker)

This repo uses `docker-compose` (Compose v1) in this environment.

From `bd_dataset_001/a2b5c8-Cart_Service_Performance_Fix/`:

```bash
# Build container
docker-compose build

# Run "before" tests inside container (expected: FAIL)
docker-compose run --rm cart-service-task /bin/sh -lc "sh ./setup.sh && sh ./run_before.sh"

# Run "after" tests inside container (expected: PASS)
docker-compose run --rm cart-service-task /bin/sh -lc "sh ./setup.sh && sh ./run_after.sh"

# Run evaluation inside container (generates report + latest.json)
docker-compose run --rm cart-service-task /bin/sh -lc "sh ./setup.sh && sh ./run_evaluation.sh"
```

## Notes

- The test suite is intentionally **DB-independent**: it stubs Mongoose model methods to make verification reproducible and to enforce the performance constraints structurally.

