# Nested Transaction-Safe In-Memory Key-Value Cache

## Problem Statement

Implement an in-memory key–value cache that supports arbitrarily nested transactions with precise commit and rollback semantics. The system must ensure correct visibility rules ("most recent write wins"), properly handle deletions via shadowing, and preserve strict isolation between transaction scopes and the base store. The design must be efficient, avoid full-state copies, respect negative constraints, and maintain clean invariants so that only committed data reaches the base store.

---

## Prompt

**Role:** Senior Software Engineer

**Context:** You need to implement a transaction-safe key-value cache that supports nested transactions similar to database transaction systems. The cache must handle arbitrary nesting depth, maintain strict isolation between transaction layers, and efficiently manage commits and rollbacks without copying entire state.

**Scale Assumptions:**

- Used in high-throughput systems requiring transaction safety
- Transactions can be nested to arbitrary depth (100+ levels)
- Cache may contain thousands of key-value pairs
- Operations must be efficient for production use

---

## Core Requirements (Must Implement)

### 1. Support Commands
- **BEGIN** - Start a new transaction (nested transactions allowed)
- **SET** - Set a key-value pair in the current transaction scope
- **GET** - Retrieve a value following "most recent write wins" visibility rules
- **DELETE** - Delete a key (shadows parent values, doesn't remove from base store)
- **COMMIT** - Merge current transaction into parent (or base store if outermost)
- **ROLLBACK** - Discard current transaction scope

### 2. Arbitrarily Nested Transactions
- Support unlimited nesting depth
- Each transaction maintains its own isolated scope
- Child transactions cannot mutate parent scopes

### 3. Visibility Rules ("Most Recent Write Wins")
- GET must reflect the most recent visible write or delete
- Read from top-most transaction scope first, then parent scopes, then base store
- Deletions in child transactions shadow values in parent scopes

### 4. Deletion Shadowing
- Deletions are represented as shadowing within transactions
- Deletions do NOT become values in the base store
- A deleted key in a transaction hides the same key in parent scopes
- Rolling back a transaction restores visibility of parent values

### 5. Commit Semantics
- On COMMIT, merge only the current transaction into its immediate parent
- If no parent exists, merge into base store
- Do NOT flatten the entire transaction stack
- Only one layer is merged per commit operation

### 6. Rollback Semantics
- On ROLLBACK, discard only the current transaction scope
- Parent scopes remain unchanged
- Base store remains unchanged

### 7. Isolation Guarantees
- Prevent any mutation of parent scopes during child transactions
- All SET and DELETE operations affect only the current (top-most) transaction
- Parent transaction data is never directly modified

### 8. Efficiency Requirements
- Avoid copying the full store on BEGIN
- Use delta-based approach (only store changes in each transaction)
- O(1) average time for mutations (SET, DELETE)
- Reads may depend on transaction depth (acceptable)

### 9. No Global State or External Libraries
- Use no global state
- Use no external libraries
- Only use built-in Python types and constructs

### 10. Clean Invariants
- The base store contains only committed, final values
- No deletion markers or temporary values in base store
- Base store is only modified during commit of outermost transaction

---

## Constraints

- Do NOT use external libraries
- Do NOT copy the entire store state on BEGIN
- Must handle arbitrary nesting depth (100+ levels) without stack overflow
- Must maintain strict isolation between transaction scopes
- Base store must only contain committed, final values
- Deletions must be represented as shadowing, not as values in base store

---

## Acceptance Criteria

1. `BEGIN` creates a new isolated transaction scope
2. `SET` in a transaction only affects the current scope
3. `GET` returns the most recent visible value (transaction → parent → base store)
4. `DELETE` in a transaction shadows parent values without removing them
5. `COMMIT` merges only the current transaction into its immediate parent
6. `ROLLBACK` discards only the current transaction scope
7. Nested transactions maintain strict isolation
8. Modifying a clone doesn't affect the original (isolation)
9. Rolling back restores parent scope visibility
10. Base store only contains committed values

---

## Requirements Summary

1. **Commands** - BEGIN, SET, GET, DELETE, COMMIT, ROLLBACK
2. **Nested Transactions** - Support arbitrary nesting depth
3. **Visibility** - "Most recent write wins" semantics
4. **Deletions** - Shadow parent values, don't store in base
5. **Commit** - Merge only current transaction into immediate parent
6. **Rollback** - Discard only current transaction scope
7. **Isolation** - No mutation of parent scopes during child transactions
8. **Efficiency** - No full-state copies, O(1) mutations
9. **No Dependencies** - No global state, no external libraries
10. **Invariants** - Base store contains only committed, final values

---

## Public API (Must Maintain)

```python
class TxCache:
    def __init__(self)
    def begin(self) -> None
    def set(self, k, v) -> None
    def get(self, k) -> Any
    def delete(self, k) -> None
    def commit(self) -> bool
    def rollback(self) -> bool
```

---

## Commands

### Run the build image
```bash
docker compose build
```

### Run tests (after – expected all pass)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -q
```

### Run evaluation (compares both implementations)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app python evaluation/evaluation.py
```

This will:
- Run tests for the after implementation
- Generate a report at `evaluation/report/YYYY-MM-DD/HH-MM-SS/report.json`
