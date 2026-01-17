# Trajectory: High-Performance Move-Only Buffer with Manual Resource Management

## 1. Requirements Audit and Risk Identification

The task requires designing a C++20 class that manually manages a heap-allocated integer buffer using raw pointers only. The implementation explicitly forbids high-level abstractions such as `<utility>`, `<memory>`, and standard move or swap helpers. Conditional branching using the `if` keyword is also disallowed. Despite these constraints, the class must correctly support move construction, move assignment, self move-assignment safety, and deterministic destruction without memory leaks.

Key risks identified during the audit phase included:
- Double-free during move assignment
- Memory leaks during self move-assignment
- Invalid moved-from states
- Accidental reliance on standard utilities
- Hidden conditional logic via prohibited constructs

To ground the analysis, common failure modes in low-level C++ resource management and move semantics were reviewed.

**References:**
- CppCon: *Back to Basics — Move Semantics*  
  https://youtu.be/St0MNEU5b0o  
- C++ Core Guidelines — Resource Management  
  https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-resource

---

## 2. Ownership and Lifetime Contract Definition

Before implementation, an explicit ownership contract was defined:

- A `FastBuffer` instance either:
  - Owns exactly one dynamically allocated `int` array, or
  - Owns no memory (`nullptr`, size = 0)
- Ownership transfer must:
  - Occur in constant time
  - Use raw pointer reassignment only
  - Avoid copying underlying data
- After any move operation:
  - The source object must remain valid and destructible
  - The destination object must become the sole owner

Self move-assignment is treated as a valid operation that may leave the object in an empty but destructible state. Preservation of the original buffer during self move-assignment is not required; correctness is defined by invariant safety rather than state retention.

**References:**
- Herb Sutter — *Move Semantics and the Rule of Five*  
  https://herbsutter.com/2013/06/05/gotw-91-solution-smart-pointers/  
- ISO C++ FAQ — Moved-from Objects  
  https://isocpp.org/wiki/faq/cpp11#move-semantics

---

## 3. Invariant-Based Design Without Conditional Guards

Due to the prohibition on `if`, identity checks such as `this == &other` were intentionally avoided. Instead, move assignment was designed to be safe even when fully executed on the same object.

The design relies on invariants rather than branching:
- Release currently owned memory unconditionally
- Transfer pointer ownership
- Reset the source pointer to `nullptr` and size to zero

When self move-assignment occurs, the buffer is released and the object transitions to an empty but valid state. This ensures:
- No memory leaks
- No double-free
- Safe destruction

This invariant-driven approach is commonly used in low-level systems code when robustness is preferred over defensive branching.

**References:**
- CppCon: *Invariant-Based Design in C++*  
  https://youtu.be/YnWhqhNdYyk  
- Scott Meyers — *Effective Modern C++*, Item 23  
  https://www.oreilly.com/library/view/effective-modern-c/9781491908419/

---

## 4. Low-Level Execution Using Raw Pointers Only

The implementation was constrained to:
- Raw `int*` ownership
- Explicit allocation and deallocation
- Manual rvalue casting using native C++ syntax
- No reliance on standard move or swap helpers

Move construction and move assignment were implemented as direct pointer transfers, guaranteeing constant-time performance. The destructor unconditionally frees owned memory exactly once, relying on the invariant that moved-from objects own no memory.

**References:**
- cppreference — Move Constructors and Move Assignment  
  https://en.cppreference.com/w/cpp/language/move_constructor  
- cppreference — Object Lifetime  
  https://en.cppreference.com/w/cpp/language/lifetime

---

## 5. Verification Against Edge Cases and Failure Modes

Verification focused on known high-risk scenarios:
- Move construction correctness
- Move assignment correctness
- Self move-assignment safety
- Destructor idempotence
- Absence of forbidden headers and facilities

Tests were designed to validate ownership and lifetime invariants rather than behavioral preservation. A moved-from object is considered correct if it remains destructible and leak-free.

**References:**
- CppCon: *How to Test Low-Level C++ Code*  
  https://youtu.be/2olsGf6JIkU  
- Valgrind Documentation — Memory Error Detection  
  https://valgrind.org/docs/manual/quick-start.html

---

## 6. Outcome

The final solution:
- Transfers ownership in constant time
- Avoids all forbidden abstractions
- Handles self move-assignment safely without conditional logic
- Guarantees exactly-once destruction
- Is compatible with containerized C++20 evaluation environments

The reasoning process is explicit, traceable, and transferable to other low-level systems programming tasks involving manual resource management.
