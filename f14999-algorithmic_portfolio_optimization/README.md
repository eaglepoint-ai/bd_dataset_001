# Algorithmic Portfolio Optimization – DP Refactor

## Prompt
You are a Principal Engineer at a high-frequency trading (HFT) firm responsible for a mission-critical portfolio rebalancing system. The system must evaluate complex regulatory constraints while identifying optimal asset subsets under extreme performance and correctness requirements. Your task is to redesign a core algorithm to meet new scalability and compliance demands without changing observable behavior.

## Problem Statement
The current portfolio subset selection algorithm uses brute-force recursion with exponential time complexity.
Performance degrades catastrophically when portfolio size exceeds 20 assets, causing production timeouts.
New regulatory requirements mandate real-time evaluation for portfolios of up to 30 assets.
The algorithm must be refactored to scale efficiently while preserving exact correctness and auditability.

## Requirements

### Functional Requirements
- Refactor the subset selection logic from brute-force recursion to a memoized dynamic programming approach
- Maintain exact behavioral equivalence with the existing implementation
- Find all valid asset subsets that satisfy all constraints
- Preserve result ranking, validation logic, logging, and statistics tracking

### Algorithmic Constraints
- Target time complexity: O(n × S × C)
- Mandatory memoization with well-defined DP state representation
- No exponential 2^n enumeration
- Deterministic execution with identical outputs for identical inputs
- Correct handling of all 7 constraint types (EXACT, MIN, MAX, RANGE)

### Correctness & Compliance
- No false positives or false negatives
- Must call existing validation, pruning, scoring, and logging methods
- Logging output must remain semantically equivalent for audit purposes
- Global statistics must be updated accurately

### Performance Requirements
- n=12 assets: <50ms
- n=18 assets: <200ms
- n=25 assets: <1s
- Must handle 10,000+ optimization requests per day
- Zero-downtime migration requirement

### Prohibited Approaches
- Wrapping the existing recursion with naive caching
- External DP or optimization libraries
- Approximation or heuristic-based solutions
- Modifying existing helper or validation methods
- Bitmask-based 2^n enumeration

## Tech Stack
- Language: Python 3.9–3.11
- Libraries: Standard library only
- Precision: Decimal (no floating-point approximation)
- Execution Model: Single-threaded
- Domain: High-frequency trading / regulatory-compliant systems
