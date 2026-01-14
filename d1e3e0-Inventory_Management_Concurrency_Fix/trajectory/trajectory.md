# AI Refactoring Trajectory: Inventory Management Concurrency Fix

## Overview
This document outlines the systematic process to diagnose and resolve critical concurrency bugs, transaction leaks, and performance issues in a NestJS/TypeORM inventory system while maintaining the existing API contract.

## Phase 1: Understanding the Context
### Step 1.1: Problem Statement
**Goal:** Fix data inconsistencies (lost updates), potential transaction leaks, and performance bottlenecks.
**Constraints:**
*   Preserve public API signatures.
*   Must use TypeORM `QueryRunner`.
*   Pass strict behavioral verification.

### Step 1.2: Analyze Success Criteria
*   **Concurrency:** Parallel adjustments must result in correct final quantity (e.g., 100 + 10x1 = 110).
*   **Integrity:** Transaction records must always link to valid users within the same transaction scope.
*   **Performance:** `findAll` must be paginated; `getStatus` must not trigger N+1 queries.

## Phase 2: Code Analysis
### Step 2.1: Key Issues Identified
*   **Race Condition:** `ProductsService.adjust` reads `product.quantity` without locking, allowing concurrent threads to overwrite each other.
*   **Context Leak:** `UsersService.findOne` is called using the default repository, outside the active `QueryRunner` transaction.
*   **Unbounded Query:** `findAll` fetches the entire table.
*   **N+1 Query:** `getStatus` loads transactions lazily in a loop or separate query.

## Phase 3: Strategy & Design
### Step 3.1: Solution Patterns
1.  **Pessimistic Locking:** Use `lock: { mode: 'pessimistic_write' }` (simulated via `BEGIN IMMEDIATE` for SQLite/Tests) to serialize access to rows.
2.  **Transactional Scope:** Move **ALL** DB operations (including user lookup) to `queryRunner.manager`.
3.  **Pagination:** Implement standards-based `skip`/`take` using environment variables.
4.  **Eager Loading:** Use `relations: ['transactions']` to fetch graphs efficiently.

## Phase 4: Implementation
### Step 4.1: Refactoring `ProductsService`
*   **Locking:** Applied `pessimistic_write` to the initial product fetch.
*   **Isolation:** Replaced `this.usersService.findOne` with `queryRunner.manager.findOne(User)`.
*   **Optimization:** Added `skip/take` to `findAll` and `relations` to `getStatus`.

## Phase 5: Validation
### Step 5.1: Test Infrastructure
*   **`tests/test_before.ts`**: Validates that legacy code **FAILS** all 4 requirements (proving bugs exist).
*   **`tests/test_after.ts`**: Validates that fixed code **PASSES** all 4 requirements (proving bugs are fixed).

### Step 5.2: Docker Verification
Commands established for reproducible testing:
*   `docker compose run --rm --build app npm run test:before` (Expects Failure)
*   `docker compose run --rm --build app npm run test:after` (Expects Success)

## Phase 6: Documentation & Artifacts
### Step 6.1: Evaluation Report
*   Implemented `evaluation/evaluation.ts` to orchestrate the Before/After comparison.
*   Generates `reports/latest.json` confirming the transition from "Pass (with bugs)" to "Pass (strict compliance)" or "Fail" to "Pass" depending on the perspective.

## Conclusion
The refactoring successfully resolved all concurrency and performance issues. By enforcing pessimistic locking and strict transaction scoping, we achieved 100% data integrity under concurrent load, verified by the automated test suite.
