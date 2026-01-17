# FastBuffer — High-Performance Move-Only Buffer

A C++20 class that manages a heap-allocated integer buffer with maximum performance and minimal abstraction overhead. The implementation relies exclusively on raw pointers and manual resource management while supporting safe, constant-time move semantics.

---

## Problem Statement

A low-level utility component is required for performance-critical systems where standard library abstractions introduce unacceptable overhead. The component must manage dynamic memory explicitly, support efficient ownership transfer, and remain safe under move operations — including self move-assignment — without relying on modern helper utilities.

The challenge is to implement this correctly under strict constraints that prohibit conditional branching, standard ownership helpers, and high-level abstractions.

---

## Prompt

**Role:** Senior C++ Systems Engineer

**Context:**  
You are tasked with designing a minimal-overhead buffer type for use in performance-sensitive, containerized environments. The buffer must manage heap memory explicitly, transfer ownership efficiently via move semantics, and guarantee correct destruction under all valid usage scenarios.

**Scale Assumptions:**

- Used in low-latency or systems-level code
- Ownership transfers occur frequently
- Copying underlying buffers is unacceptable
- Code is evaluated in automated, containerized pipelines

---

## Core Requirements (Must Fix)

### 1. Ownership Model
- `FastBuffer` owns **exactly one** dynamically allocated `int` array at any time, or owns no memory at all.

### 2. Move Semantics
- Ownership transfer must occur via move construction and move assignment.
- The underlying buffer must **not** be copied.

### 3. Constant-Time Moves
- Move construction and move assignment must complete in constant time.
- Only raw pointer manipulation is permitted.

### 4. Moved-From Object Validity
- After any move operation, the source object must remain valid and safely destructible.

### 5. Memory Safety
- No memory leaks during:
  - Construction
  - Move construction
  - Move assignment
  - Destruction

### 6. Self Move-Assignment Safety
- Self move-assignment must not corrupt the object or leak memory.
- Preservation of contents is not required; validity and safety are.

### 7. Forbidden Dependencies
- The implementation must not depend on:
  - `<utility>`
  - `<memory>`
  - `<algorithm>`

### 8. No Standard Move or Swap Utilities
- No use of `std::move`, `std::swap`, or related helpers.

### 9. Raw Pointer Ownership Only
- Ownership transfer must be achieved exclusively through raw pointer reassignment.

### 10. No Conditional Branching
- The implementation must contain **no use of the `if` keyword**.

### 11. Manual Rvalue Casting
- Rvalue casting must be performed using native C++ syntax, not standard helpers.

### 12. Deterministic Destruction
- The destructor must free owned heap memory **exactly once**.

### 13. Single, Self-Contained Implementation
- The complete solution must be provided as a single header/implementation unit.

---

## Constraints

- C++20 standard
- Raw pointers only
- No conditional `if` statements
- No standard ownership or move utilities
- No external libraries
- Designed to run inside Docker-based evaluation environments

---

## Acceptance Criteria

1. Moving a `FastBuffer` transfers ownership without copying memory.
2. Move operations complete in constant time.
3. Moved-from objects are safely destructible.
4. Self move-assignment does not leak memory or double-free.
5. The destructor frees memory exactly once.
6. The implementation compiles cleanly with `-Wall -Wextra -Wpedantic`.
7. All automated tests pass in a containerized environment.

---

## Requirements Summary

1. **Ownership** — Single raw pointer or no ownership
2. **Moves** — Pointer transfer only, no copies
3. **Performance** — Constant-time operations
4. **Safety** — Leak-free, double-free-free
5. **Restrictions** — No `if`, no `<utility>`, no helpers
6. **Structure** — Single header-only implementation

---

## Public API

```cpp
class FastBuffer;


## Commands

### Run the build image
```bash
docker compose build
```

### Run repository_after
```bash
docker compose run --rm -e REPO_PATH=repository_after app make -C tests run
```

### Run evaluation
```bash
docker compose run --rm app sh -c "mkdir -p temp && g++ -std=c++20 -o temp/eval evaluation/evaluation.cpp && ./temp/eval"
```

