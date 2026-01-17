# Deep Clone Function Fix

## Problem Statement

A utility library's deep clone function is failing in production. Users report that cloned objects share references with originals, Date objects become strings, Map/Set objects are lost, and the function crashes on objects with circular references. The deepClone function needs to be fixed to handle all JavaScript data types correctly while maintaining the same function signature.

---

## Prompt

**Role:** Senior JavaScript Engineer

**Context:** Your company's utility library has a deepClone function that's causing bugs across multiple projects. Cloned objects are mutating originals, Date objects lose their type, and the function crashes on circular references. Fix all issues while preserving the function signature.

**Scale Assumptions:**

- Used in 50+ microservices
- Objects can be deeply nested (100+ levels)
- Objects may contain 10,000+ properties

---

## Core Requirements (Must Fix)

### 1. Primitive Types
- String, Number, Boolean, null, undefined → return as-is

### 2. Date Objects
- `new Date()` must clone to a new Date with same time
- NOT become a string via JSON.stringify

### 3. RegExp Objects
- Must preserve pattern AND flags (g, i, m, etc.)

### 4. Map and Set
- Must create new Map/Set with cloned contents
- NOT become empty objects {}

### 5. Arrays
- Must create new array with cloned elements
- Sparse arrays must preserve holes

### 6. Circular References
- Must detect and handle without infinite loop
- Circular refs in clone should point to cloned objects

### 7. Plain Objects
- Must create new object with cloned properties
- Must handle nested objects recursively

---

## Bonus (Nice to have)

- Symbol properties
- Non-enumerable properties
- Prototype chain preservation
- TypedArrays (Uint8Array, etc.)
- ArrayBuffer

---

## Constraints

- Do NOT use external libraries (lodash, rfdc, etc.)
- Do NOT use JSON.parse(JSON.stringify()) for the solution
- Must handle objects with 100+ nesting levels (no stack overflow)
- Same function signature: `deepClone(obj) → clonedObj`

---

## Acceptance Criteria

1. `deepClone({a: 1})` returns new object, not same reference
2. `deepClone(new Date())` returns Date object, not string
3. `deepClone(/test/gi)` returns RegExp with same pattern and flags
4. `deepClone(new Map([['a', 1]]))` returns Map with entry
5. `deepClone(new Set([1, 2, 3]))` returns Set with values
6. Circular reference doesn't crash, returns valid clone
7. Modifying clone doesn't affect original

---

## Requirements Summary

1. **Primitives** - Return as-is (string, number, boolean, null, undefined)
2. **Date** - Clone to new Date with same timestamp
3. **RegExp** - Clone with pattern and flags preserved
4. **Map/Set** - Clone with contents recursively cloned
5. **Arrays** - Clone with elements recursively cloned
6. **Circular refs** - Detect and handle without crash
7. **Objects** - Clone recursively, new reference

---

## Public API (Must Maintain)

```javascript
function deepClone(obj) → clonedObj
```

---

## Commands

### Run repository_before
```bash
docker-compose run --rm app node -e "const {deepClone} = require('./repository_before'); console.log('OK')"
```

### Run tests
```bash
docker-compose run --rm app npm test
```

### Run evaluation
```bash
docker-compose run --rm app node evaluation/evaluation.js
```

