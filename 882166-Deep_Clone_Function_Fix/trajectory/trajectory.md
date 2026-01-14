# DeepClone Trajectory: Full JavaScript Object Cloning

## Overview

This document outlines the systematic thought process to implement a robust `deepClone` function. The goal is to clone any JavaScript value correctly, preserving type, structure, and independence of objects, while preventing crashes from circular references. The solution must strictly follow the given task requirements.

---

## Phase 1: Understanding the Context

### Step 1.1: Read the Problem Statement

**Action:** Carefully read the task requirements and understand what types must be supported.

**Key Questions to Ask:**

* Which types must be cloned? (**Primitives, Date, RegExp, Map, Set, Arrays, Objects**)
* Are there any constraints on function signature? (**Must remain `deepClone(obj)**`)
* How should circular references be handled? (**No crash, preserve reference structure**)
* What tests will determine success? (**The provided 8 test cases**)

**Expected Understanding:**

* Cloning must produce **independent objects** (no shared references).
* Types must be **preserved** (e.g., Date stays Date).
* Circular references must **not crash**.
* Function must be **deterministic and reproducible**.

### Step 1.2: Analyze the Test Suite

**Action:** Examine all test files to understand success criteria.

**Files to review:**
`tests/index.js` — Main deepClone test suite

**Key Insights from Tests:**

* ✅ Primitives returned as-is
* ✅ Objects cloned with new reference
* ✅ Arrays cloned recursively
* ✅ Date objects cloned preserving timestamp
* ✅ RegExp cloned with pattern & flags
* ✅ Map and Set cloned recursively
* ✅ Circular references handled correctly
* ✅ Modifying clone does not affect original

> **Critical Realization:** Tests enforce both **correctness** and **type integrity**.

---

## Phase 2: Code Analysis

### Step 2.1: Review Original Implementation

**Action:** Read `repository_before/deepClone.js`

**Original Code:**

```javascript
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  const clone = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) clone[key] = deepClone(obj[key]);
  }
  return clone;
}

```

**Observations:**

* Handles **primitives** correctly ✅
* Handles **arrays** recursively, but not circular references ❌
* Handles **plain objects** recursively, but:
* Fails for **Date, RegExp, Map, Set** ❌
* Fails on **circular references** ❌


* Uses `hasOwnProperty` (good) ✅
* No mechanism for **visited object tracking** ❌

### Step 2.2: Identify Missing Handling

**Action:** Map each requirement to missing handling.

| Requirement | Status in "before" code | Notes |
| --- | --- | --- |
| **Primitives** | ✅ | Already returns as-is |
| **Date** | ❌ | Would become `{}` |
| **RegExp** | ❌ | Would become `{}` |
| **Map** | ❌ | Lost entirely |
| **Set** | ❌ | Lost entirely |
| **Arrays** | Partially ✅ | No circular support |
| **Circular refs** | ❌ | Infinite recursion possible |
| **Objects** | Partially ✅ | Fails if cyclic |

---

## Phase 3: Refactoring Strategy

### Step 3.1: Introduce Circular Reference Tracking

**Action:** Use a `WeakMap` to track already cloned objects.

**Implementation:**

```javascript
function deepClone(obj, visited = new WeakMap()) {
  if (visited.has(obj)) return visited.get(obj);
}

```

**Rationale:**

* Prevent infinite recursion.
* Maintain reference structure for cyclic graphs.
* `WeakMap` avoids memory leaks.

### Step 3.2: Type-Specific Handling

**Action:** Add explicit checks for all required types in order.

**Date:**

```javascript
if (obj instanceof Date) return new Date(obj.getTime());

```

* Preserves timestamp.
* Creates new reference.

**RegExp:**

```javascript
if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);

```

* Preserves pattern and flags.
* Creates new reference.

**Map:**

```javascript
if (obj instanceof Map) {
  const clone = new Map();
  visited.set(obj, clone);
  for (const [key, value] of obj) clone.set(deepClone(key, visited), deepClone(value, visited));
  return clone;
}

```

* Clones keys and values recursively.
* Circular-safe.

**Set:**

```javascript
if (obj instanceof Set) {
  const clone = new Set();
  visited.set(obj, clone);
  for (const value of obj) clone.add(deepClone(value, visited));
  return clone;
}

```

* Clones values recursively.
* Circular-safe.

**Arrays:**

```javascript
if (Array.isArray(obj)) {
  const clone = [];
  visited.set(obj, clone);
  for (let i = 0; i < obj.length; i++) clone[i] = deepClone(obj[i], visited);
  return clone;
}

```

* Preserves order.
* Circular-safe.

**Plain Objects:**

```javascript
const clone = {};
visited.set(obj, clone);
for (const key in obj) if (obj.hasOwnProperty(key)) clone[key] = deepClone(obj[key], visited);
return clone;

```

* Deep clone all own properties.
* Circular-safe.

---

## Phase 4: Implementation

### Step 4.1: Function Signature

**Action:** Keep function signature unchanged.

```javascript
function deepClone(obj, visited = new WeakMap()) { ... }

```

### Step 4.2: Export

**Action:** Keep `index.js` loader unchanged.

```javascript
// repository_after/index.js
module.exports = require('./deepClone');

```

### Step 4.3: Maintain Determinism

* No random values introduced.
* No global state dependence.
* Traversal order deterministic.

---

## Phase 5: Validation

### Step 5.1: Run Provided Tests

All 8 tests pass:

* Primitives, objects, arrays, Date, RegExp, Map, Set, circular references.
* Deep modifications do not affect original.

### Step 5.2: Manual Verification

* Modify clone values → originals unaffected.
* Circular references → cloned graph preserves structure.
* Types verified via `instanceof` checks.

### Step 5.3: Edge Cases Considered

| Input | Expected Behavior |
| --- | --- |
| `{a: {b: 1}}` | Nested object cloned independently |
| `new Date()` | Date instance cloned |
| `/regex/gi` | Regex instance cloned with flags |
| `new Map([['key', {x:1}]])` | Map keys and values cloned |
| `new Set([1,2,3])` | Set values cloned |
| `obj.self = obj` | Circular reference preserved |

---

## Phase 6: Lessons Learned

* **Order of type checks matters:** Specific types before generic objects; Arrays before objects.
* **Circular reference tracking is essential:** Must register clone before recursive calls.
* **Maintain immutability for primitives:** Always return primitives as-is.
* **Do not over-engineer:** Only handle types required by task. Extra handling (functions, Errors, Symbols) unnecessary.
* **Test-driven reasoning:** Let acceptance criteria guide implementation.

---

## Phase 7: Decision Tree for Deep Cloning

1. **Is the input primitive?**
* ├─ **YES** → return as-is
* └─ **NO** → continue


2. **Is object already visited?**
* ├─ **YES** → return visited clone
* └─ **NO** → continue


3. **Type-specific checks:**
* ├─ **Date** → clone with timestamp
* ├─ **RegExp** → clone with pattern & flags
* ├─ **Map** → clone keys and values recursively
* ├─ **Set** → clone values recursively
* ├─ **Array** → clone elements recursively
* └─ **Object** → clone own properties recursively


4. **Return clone**

---

## Summary Checklist

**Before Changes:**

* [x] Primitives: ✅
* [ ] Arrays: partial ✅ (no circular protection)
* [ ] Objects: partial ✅ (no circular protection)
* [ ] Date: ❌
* [ ] RegExp: ❌
* [ ] Map/Set: ❌
* [ ] Circular refs: ❌

**After Changes:**

* [x] All primitives handled correctly
* [x] Arrays cloned recursively, circular-safe
* [x] Objects cloned recursively, circular-safe
* [x] Date cloned
* [x] RegExp cloned
* [x] Map/Set cloned recursively
* [x] Circular references handled
* [x] Modifying clone does not affect original
* [x] Function signature unchanged
* [x] Deterministic, reproducible
