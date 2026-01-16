# Data Structure Optimization - Geometric Algorithm

## Problem Statement

The given code is fundamentally flawed in its execution speed and security risks. The algorithm finds a horizontal line that splits the total area of overlapping squares in half, but uses an inefficient O(N² log N) approach with binary search (100 iterations) that only provides approximate results.

## Prompt Used

```
Optimize the following code to achieve O(n log n) time complexity and return exact mathematical answers instead of approximations.
```

## Requirements Specified

1. Process all geometric events once in sorted order
2. No iterative or convergence-based methods
3. Return exact mathematical answer, not an approximation
4. Handle overlapping x-ranges efficiently with O(log n) updates and queries
5. Use O(unique coordinates) space, no O(n²) structures
6. Compute total area and splitting line in a single pass
7. Achieve O(n log n) worst-case time complexity

## Commands

### Test repository_before (baseline with performance issues)
```bash
docker-compose run --rm run_before
```

### Test repository_after (optimized implementation)
```bash
docker-compose run --rm run_after
```

### Generate evaluation report
```bash
docker-compose run --rm evaluation
```

Reports are generated in `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`
