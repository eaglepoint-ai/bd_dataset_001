# Transaction Range Counter - Performance Optimization

Performance optimization task for online marketplace analytics dashboard. Refactor O(n³) algorithm to O(n log n) for transaction analysis at scale.

## Problem Statement

Store owners need to analyze daily transaction sequences to understand cash flow patterns. The current implementation times out (3+ minutes) when processing 100,000 transactions, preventing access to critical business insights during peak hours.

**Task:** Refactor `count_transaction_ranges` method to achieve O(n log n) time complexity and process 100,000 transactions in under 2 seconds.

## Prompt

### Context

You're a Senior Backend Engineer on the analytics team. The reporting dashboard is timing out during peak hours because the transaction analysis query takes 3+ minutes on large datasets. Store owners are complaining they can't access their daily cash flow reports.

The existing count_transaction_ranges method in the TransactionAnalytics class uses a brute-force O(n³) approach that becomes unusable with real-world transaction volumes. You must refactor this specific method to handle 100,000+ daily transactions within a 2-second SLA.

### Objective

Count how many consecutive transaction sequences have a net total within `[lower_bound, upper_bound]`.

**Example:**

```python
transactions = [-2, 5, -1]
lower_bound = -2, upper_bound = 2

# Valid sequences: [-2], [-1], [-2,5,-1]
# Result: 3
```

### Hard Constraints

- **Time Complexity:** O(n log n) maximum
- **Space Complexity:** O(n) maximum
- **Environment:** Python 3.11 standard library ONLY (no numpy/pandas)
- **Scope:** Refactor `count_transaction_ranges` ONLY
- **Compatibility:** Works with `Transaction` objects (`.amount` attribute)
- **Performance SLA:** <2 seconds for 100,000 transactions

### Test Requirements

- ✅ Single transaction edge case
- ✅ All positive/negative/mixed transactions
- ✅ Exact match queries (lower_bound == upper_bound)
- ✅ Large transaction amounts (integer overflow handling)
- ✅ Maximum scale (100,000 transactions in <2 seconds)

## Requirements

### Functional

- Count all consecutive transaction sequences with sums in `[lower_bound, upper_bound]`
- Handle `Transaction` objects with `.amount` attribute
- Maintain exact function signature and behavior
- Return accurate integer count for all scenarios

### Non-Functional

- **Performance:** O(n log n) time complexity
- **Memory:** O(n) space complexity
- **Scalability:** 100,000 transactions in <2 seconds
- **Reliability:** Deterministic results across executions
- **Code Quality:** Semantic names, helper functions, algorithmic comments

### Constraints

- **Language:** Python 3.11
- **Libraries:** Standard library ONLY
- **Input Size:** 1 to 100,000 transactions
- **Transaction Values:** -2,147,483,648 to 2,147,483,647
- **Bounds:** -100,000 to 100,000

## Tech Stack

### Core

- **Runtime:** Python 3.11
- **Standard Library:**
  - `typing` - Type hints
  - `dataclasses` - Transaction structure
  - `bisect` - Binary search (hint for O(n log n))
  - `collections` - Efficient data structures

## Docker Commands

```bash
# Run tests against repository_before (O(n³) implementation)
docker compose run --rm test-before

# Run tests against repository_after (O(n log n) implementation)
docker compose run --rm test-after

# Run evaluation and generate reports
docker compose run --rm evaluate
```
