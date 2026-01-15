# Trajectory Template

## Trajectory (Thinking Process for Refactoring)

### 1. Audit the Original Code (Identify Scaling Problems)
I audited the original `repository_before/cartService.js` and identified compounding performance anti-patterns that become catastrophic under concurrency:

- `getCart` used `populate()` across nested references, producing **N+1** behavior and over-allocation.
- Multiple methods fetched the same cart **repeatedly per request**, multiplying DB round-trips.
- Read-only queries did not use `lean()`, allocating full Mongoose documents unnecessarily.
- Independent reads (cart + menuItem) were performed **sequentially**.
- Over-fetching: full documents were loaded even when only a few fields were needed.
- Write paths performed **multiple `save()` calls** per request, increasing lock contention and pool pressure.
- Repeated Decimal128 conversions (`toString()` → `parseFloat`) inside loops.
- Multiple array passes over cart data for subtotal/totalItems.
- ID comparisons used `toString()` rather than `ObjectId.equals()`.
- Discount logic created **multiple `new Date()` instances** per request, adding noise and non-deterministic time edges.

Learn about the N+1 query problem and why it’s bad:
`https://youtu.be/lptxhwzJK1g`

Practical article explaining N+1 and how to fix it: “Optimizing Database Queries: Avoiding the N+1 Query Problem”
Link:
`https://michaelkasingye.medium.com/optimizing-database-queries-avoiding-the-n1-query-problem-438476198983`

### 2. Define a Performance Contract First
Before refactoring, I defined an explicit performance contract for CartService operations:

- **Forbid N+1** patterns (no `populate()`-driven fanout for cart items).
- **Fetch the cart at most once per operation** and reuse the instance.
- **Use `lean()` for read-only queries** (cart reads and bulk lookups) to control memory.
- **Parallelize independent reads** with `Promise.all` (menu item + cart fetch).
- **Select only required fields** for menu items and merchants.
- **Exactly one persistence operation per request** (`save()` once).
- **Stable numeric handling**: convert Decimal128 once and reuse, no repeated conversions in loops.
- **Minimize iteration**: compute subtotal + totalItems in a single pass.
- **Correct identifier semantics**: use `ObjectId.equals()`.
- **Single time reference** per operation for discount validation.

Background on “performance contracts” / defining constraints before refactoring:
`https://youtu.be/o25GCdzw8hs`

### 3. Rework the Data Access Pattern for Efficiency (Bulk over fanout)
I replaced the nested `populate()` cart enrichment with an explicit **bulk-fetch** approach:

- Collect all `menuItemId`s from cart items.
- Fetch menu items in one query using `$in`.
- Collect all `merchantId`s from those menu items.
- Fetch merchants in one query using `$in`.
- Join the results in-memory via maps keyed by id.

This eliminates the populate fanout and makes the query shape deterministic and bounded.

### 4. Rebuild the Read Path as a Projection-First Pipeline
In `getCart`, I made the read path projection-first:

- `Cart.findOne(...).select("items pricing").lean()`
- `MenuItem.find(...).select("_id merchantId images").lean()`
- `Merchant.find(...).select("businessName businessType isOpen rating _id").lean()`

This prevents expensive document materialization and avoids over-fetching.

### 5. Move Independent I/O to Parallel Execution
In `addToCart`, I parallelized independent reads:

- Fetch `menuItem` (read-only) and `cart` (read/write) via `Promise.all`.

This reduces end-to-end latency on the critical path under load.

### 6. Guarantee a Single Persistence Operation (Per Request)
I consolidated write logic so each operation performs **one `save()`**:

- `addToCart`: mutate cart, recompute pricing once, `save()` once.
- `updateCartItem`: mutate cart item, recompute pricing once, `save()` once.
- `removeFromCart` / `clearCart`: mutate cart, recompute pricing, `save()` once.

Even the `updateCartItem` “menu item missing” branch is handled with a single cart mutation + save, then throws.

### 7. Eliminate Repeated Conversions and Extra Passes
I introduced deterministic helpers:

- `decimalToNumber()` to convert Decimal128 exactly once per accessed value.
- `recalculatePricing(cart)` to compute subtotal and totalItems in **one pass**.

This reduces CPU churn and memory pressure in high-traffic loops.

### 8. Correct Semantics for IDs (No Stringification)
I replaced all `toString()`-based id comparisons with `ObjectId.equals()`:

- Merchant mismatch checks
- Item matching / item lookup by `_id`

This is both more correct and avoids repeated string conversions.

### 9. Single Time Reference for Discount Validation
Discount validation now uses a single captured time reference:

- `const now = new Date();`
- The validity checks compare against `now` rather than repeatedly constructing `new Date()`.

### 10. Result: Predictable Performance Characteristics + Deterministic Verification
The refactor yields deterministic and scalable behavior:

- Bounded number of queries for `getCart` (bulk fetch + maps), no N+1.
- One cart fetch per operation; one save per operation.
- Lower memory due to `lean()` on reads and strict `select()`.
- Less CPU overhead from single-pass aggregation and stable conversions.

Verification is enforced by a deterministic test harness:

- `tests/cartService.test.js` rejects naive implementations (populate usage, sequential fetch, repeated cart reads/saves, repeated `Date()`).
- `tests/test_all.js` runs the suite against `repository_before` and `repository_after`.
- `evaluation/evaluation.js` produces a reproducible JSON report in `evaluation/reports/`.

Learn why fanout / OFFSET-style patterns hurt performance and why better query shapes matter:
`https://youtu.be/rhOVF82KY7E`

More strategies for N+1 detection and batching:
`https://www.pingcap.com/article/how-to-efficiently-solve-the-n1-query-problem/`

---

## Trajectory Transferability Notes
The above trajectory is designed for refactoring. The steps represent reusable thinking nodes (audit, contract definition, structural changes, execution, and verification).

The same nodes can be reused to transfer this trajectory to other categories (such as full-stack development, performance optimization, testing, and code generation) by changing the focus of each node, not the structure.

Below are the nodes extracted from this trajectory. These nodes act as a template that can be mapped to other categories by adapting the inputs, constraints, and validation signals specific to each task type.

### 🔹 Refactoring → Full-Stack Development
- Replace code audit with system & product flow audit
- Performance contract becomes API, UX, and data contracts
- Data access refactor extends to DTOs and frontend state shape
- Query optimization maps to API payload shaping
- Pagination/efficiency applies to backend + UI (cursor / infinite scroll)
- Add API schemas, frontend data flow, and latency budgets

### 🔹 Refactoring → Performance Optimization
- Code audit becomes runtime profiling & bottleneck detection
- Performance contract expands to SLOs, SLAs, latency budgets
- Data model changes include indexes, caches, async paths
- Query refactors focus on hot paths
- Verification uses metrics, benchmarks, and load tests
- Add observability and before/after measurement

### 🔹 Refactoring → Testing
- Code audit becomes test coverage & risk audit
- Performance contract becomes test strategy & guarantees
- Data assumptions convert to fixtures and factories
- Stable ordering maps to deterministic tests
- Final verification becomes assertions & invariants
- Add adversarial coverage and bypass detection

### 🔹 Refactoring → Code Generation
- Code audit becomes requirements & input analysis
- Performance contract becomes generation constraints
- Data access strategy becomes domain model scaffolding
- Projection-first thinking becomes minimal, composable output
- Verification enforces style, correctness, and maintainability
- Add input/output specs and post-generation validation

### Core Principle (Applies to All)
- The trajectory structure stays the same
- Only the focus and artifacts change
- Audit → Contract → Design → Execute → Verify remains constant
