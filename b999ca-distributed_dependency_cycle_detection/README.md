# Multi-Component Dependency Cycle Detection 

## Prompt

You are a Senior Site Reliability Engineer (SRE) at a global cloud infrastructure company managing a distributed microservices platform with over 500 services deployed across 12 data centers.  
You own a critical system health monitoring tool responsible for detecting circular dependencies, cascading failure risks, and topology vulnerabilities in service dependency graphs.

The platform has evolved into a multi-region, fault-isolated architecture, and the monitoring system must now operate correctly on large, disconnected, and heterogeneous graphs without downtime or regression.

---

## Problem Statement

The current cycle detection algorithm assumes a fully connected graph and silently fails on disconnected components.  
As the system scaled globally, this flaw caused circular dependencies in isolated regions to go undetected.  
These missed cycles led to cascading failures, SLA violations, and compliance risks.  
The cycle detection logic must be refactored to correctly analyze **all graph components** while preserving backward compatibility.

---

## Requirements

### Functional Requirements
- Detect **all dependency cycles** in directed graphs
- Support:
  - Disconnected components
  - Weakly connected subgraphs
  - Self-loops
  - Parallel edges
- Attribute each detected cycle to its **component ID**
- Maintain **exact behavioral equivalence** for connected graphs
- Preserve all existing:
  - Validation
  - Logging
  - Diagnostics
  - Statistics tracking
- Deterministic output ordering across runs

### Algorithmic Constraints
- Time Complexity: **O(V + E)**
- Space Complexity: **O(V + E)**
- Must visit every node and edge exactly once
- Must restart DFS for each unvisited component
- Maintain global visited state with per-component recursion stacks
- No approximations or probabilistic behavior

### Compatibility Requirements (Critical)
- Connected graphs must produce **identical results** to the existing implementation
- Cycle sets must match exactly (order-independent comparison)
- No changes to helper methods or method signatures
- Backward compatibility is mandatory

### Validation & Diagnostics
- Must call `_validate_graph_structure()` before traversal
- Must call `_check_graph_integrity()` before traversal
- Must log:
  - Node visitation
  - Edge traversal
  - Component discovery
  - DFS state transitions
- Must update all analysis statistics accurately

### Prohibited Approaches
- Tarjan’s or Kosaraju’s SCC algorithms
- BFS-based cycle detection
- Union-Find
- External graph libraries
- Graph mutation during analysis
- Ignoring edge direction
- O(V²) or worse solutions

---

## Tech Stack

- **Language:** Python 3.10 – 3.11
- **Libraries:** Python Standard Library only
  - typing
  - dataclasses
  - enum
  - collections
  - time
- **Graph Model:** Directed adjacency list
- **Execution Context:** Production cloud environment
- **Design Focus:** Deterministic DFS, component isolation, auditability

---

## Success Criteria

- Zero false negatives across disconnected graphs
- Exact match with original results for connected graphs
- Linear performance regardless of graph topology
- Accurate component discovery and labeling
- Production-safe logging and diagnostics
