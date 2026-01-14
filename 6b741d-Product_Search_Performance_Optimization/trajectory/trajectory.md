# Trajectory

## Trajectory Log: ProductSearch Optimization

### Edge Case: ID Lookup Equivalence (Rule 1.1)

**Problem:**
- In the original (before) implementation, `getProductById(id)` returns the first product with the given ID (using `Array.find`).
- In the optimized (after) implementation, using a `Map` for `idMap` would overwrite previous products with the same ID, returning the last occurrence instead.

**Why this matters:**
- For strict bit-for-bit equivalence, the optimized code must match the before code's behavior, even for duplicate IDs (even if IDs are expected to be unique in practice).

**Fix:**
- Updated `addProduct` in `repository_after/productSearch.js` to only set `idMap` if the ID is not already present. This ensures `getProductById` always returns the first occurrence, matching the before code.

**Code snippet:**
```js
// Only set idMap if this is the first occurrence of the ID (strict equivalence)
if (!this.idMap.has(product.id)) {
    this.idMap.set(product.id, product);
}
```

**Result:**
- Now, both before and after implementations return the same result for duplicate IDs, passing strict equivalence tests.

**Lesson:**
- Even small data structure changes can introduce subtle behavioral differences. Always check for these when optimizing for LLM training or evaluation tasks.


