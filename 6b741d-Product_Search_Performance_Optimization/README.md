# Product Search Performance Optimization

## Problem Statement

A product search feature for an e-commerce site is experiencing severe performance degradation. The code works correctly but becomes extremely slow when the product catalog grows beyond 10,000 items. Users report 2-3 second delays when typing in the search box. The ProductSearch class needs to be optimized to handle 100,000+ products with sub-100ms response times while maintaining the exact same public API.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** Your company's e-commerce platform has a product search feature that works correctly for small catalogs but performance degrades badly at scale. Users are complaining about lag when searching. You need to optimize the code while keeping the same public API (search, searchByCategory, getTopRated).

**Scale Assumptions:**

- Product catalog: 100,000+ items
- Search queries: 1,000/second
- Results needed: Top 20 matches

---

## Core Requirements (Must Fix)

### 1. Eliminate Redundant String Operations
- `toLowerCase()` called on every item for every search
- Pre-compute or cache lowercase values

### 2. Single Pass Filtering
- Multiple `.filter()` calls create multiple array passes
- Combine into single loop

### 3. Efficient Top-N Selection
- Full sort then slice is O(n log n)
- Use min-heap for O(n log k) where k=20

### 4. Indexed Lookups
- Category filtering is O(n) linear scan
- Use Map for O(1) lookup by category

---

## Constraints

- Do NOT change public API signatures
- Do NOT use external search libraries
- Must work with plain JavaScript arrays

---

## Acceptance Criteria

1. Search 100,000 products in under 100ms
2. Same results as original implementation
3. Memory usage does not grow unbounded
4. All public methods work correctly

---

## Requirements Summary

1. **Pre-compute lowercase** - Cache on add, not on search
2. **Single filter pass** - Combine all filters in one loop
3. **Heap select for top-N** - O(n log k) instead of O(n log n)
4. **Index by category** - Map for O(1) category lookup
5. **Same public API** - search(), searchByCategory(), getTopRated(), getProductById(), getCategories(), getProductCount(), clear()

---

## Public API (Must Maintain)

```javascript
class ProductSearch {
  addProduct(product)           // Add single product
  addProducts(products)         // Add multiple products
  search(query, options)        // Search with filters
  searchByCategory(category, limit)  // Filter by category
  getTopRated(limit)            // Get highest rated
  getProductById(id)            // Find by ID
  getCategories()               // List all categories
  getProductCount()             // Total count
  clear()                       // Reset
}
```

---

## Commands

### Run repository_before
```bash
docker-compose run --rm app node -e "const PS = require('./repository_before'); console.log('OK')"
```

### Run tests
```bash
docker-compose run --rm app npm test
```

### Run evaluation
```bash
docker-compose run --rm app node evaluation/evaluation.js
```

