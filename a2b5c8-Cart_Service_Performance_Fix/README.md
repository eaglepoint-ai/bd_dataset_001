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

## Requirements

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

## Commands

```bash
# Build and run
docker-compose run --rm run_before
```

