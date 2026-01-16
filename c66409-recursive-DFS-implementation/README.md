# Iterative DFS Refactor — Enterprise Graph Traversal

A refactor task to replace a recursive DFS with an explicit stack–based iterative implementation while preserving 100% behavioral equivalence for a compliance‑critical graph traversal used in financial systems.

## Table of contents

- Summary
- Folder layout
- Problem context
- Refactor goals
- Functional requirements
- Algorithmic constraints
- Environment
- Tech stack
- Run with Docker
- Expected behavior

## Summary

Replace `dfs_recursive` with `dfs_iterative` (explicit stack) ensuring deterministic, auditable traversal with identical traversal order, callback behavior, timestamps and edge classification.

## Folder layout

- `repository_before/` — original recursive DFS implementation  
- `repository_after/` — refactored iterative DFS implementation  
- `tests/` — behavioral verification tests (callbacks, timestamps, ordering)  
- `patches/` — diffs between recursive and iterative implementations  
- `evaluation/` — evaluation runner comparing before and after

## Problem context

The Graph Analytics system performs real‑time fraud detection across payment networks (10M+ nodes, 50M+ edges). The legacy recursive DFS causes production incidents:

- Stack overflows on deep chains (25,000+ hops)  
- Memory pressure on dense subgraphs  
- Inconsistent traversal state causing false negatives

Each incident has business impact (~$50k per missed detection). Compliance requires deterministic, auditable traversal with full callback traceability.

## Refactor goals

- Eliminate recursion: implement `dfs_iterative` using an explicit stack.  
- Preserve exact behavioral equivalence:
    - Traversal order and visited order
    - Callback execution order (pre, in/explore, cycle, post)
    - Discovery and finish timestamps (monotonic and consistent)
    - Edge classification (tree, back, parent)
- Maintain deterministic execution for compliance

## Functional requirements

- Signature identical to original `dfs_recursive`.  
- Callback execution protocol preserved:
    - Pre‑order (discovery)
    - In‑order (exploration)
    - Cycle detection callback
    - Post‑order (completion)
- Callback metadata must match original:
    - phase, depth, neighbor index, total neighbors, visited count
    - discovery / finish times, processing duration, discovery time diff
- Edge classification rules:
    - Tree edge — neighbor unvisited
    - Back edge — neighbor visited with discovery_time < current node
    - Parent edge — neighbor equals parent
- Visited order and timing must match recursive implementation exactly

## Algorithmic constraints

- No recursion (direct or hidden).  
- Use an explicit stack to simulate call frames.  
- Time complexity: O(V + E).  
- Space complexity: O(V).  
- Deterministic execution (single-threaded).  
- Use only Python standard library.

## Environment

- Python 3.9–3.11  
- Memory: handle 100k nodes within 512 MB  
- Execution: single-threaded only  
- Allowed libraries: typing, collections, datetime, time

## Tech stack & techniques

- Iterative graph traversal using explicit stack simulation  
- Deterministic state machines  
- Callback-driven architecture  
- Domain: graph analytics for fraud detection in financial systems

## Run with Docker

### Run tests (before — recursive implementation)
```bash
docker compose run test_before
```

### Run tests (after — iterative implementation)
```bash
docker compose run test_after
```

### Run evaluation (compare before and after)
```bash
docker compose run evaluation
```

## Expected behavior

- `test_before.py`: verifies recursive DFS  
- `test_after.py`: verifies iterative DFS  
- `evaluation` compares both implementations and ensures:
    - Functional equivalence ✅
    - Performance improvements ✅
    - Compliance‑grade determinism ✅