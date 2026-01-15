# Service Dependency Topology Analyzer

## Overview

Production-critical system for analyzing service dependency graphs in a global cloud infrastructure platform managing 500+ microservices across 12 data centers.

---

## Problem Statement

The current topology analyzer only examines services reachable from a single starting point, causing it to miss 40% of the production infrastructure distributed across isolated regional clusters. Implement `detect_dependency_cycles_v2()` that achieves 100% topology coverage by analyzing all services regardless of connectivity patterns, while maintaining exact behavioral equivalence with the current implementation for fully connected topologies and preserving all existing validation, logging, and diagnostic functionality.

---

## Business Impact

### Current Production Issues
- **$1.2M** in lost revenue from undetected circular dependency failures (Q4 2025)
- **7 SLA violations** (target: 99.95% uptime)
- **SOC2 compliance failures** requiring comprehensive topology analysis
- **40% increase** in incident response time due to incomplete reports

### System Failures
- **60% topology coverage** - misses disconnected regional clusters
- **35% false negative rate** on production snapshots
- **3 major incidents** in Q4 2025 from undetected cycles
- Silent failures on multi-region architectures

---

## Requirements

### Functional Requirements

#### Complete Topology Coverage
- Analyze **100% of services** regardless of connectivity
- Detect **all circular dependency patterns** (zero false negatives)
- Identify and label **all topology partitions**
- Handle **arbitrary graph structures**:
  - Multiple isolated service clusters
  - One-way dependencies between groups
  - Self-referential services
  - Redundant connection paths
  - Isolated services with no connections

#### Detection Capabilities
Must identify all instances of:
- Circular dependency chains of any length
- Self-referential dependencies
- Nested circular patterns within clusters
- Multiple dependency paths forming loops

#### Reporting Requirements
Each detected issue must include:
- Service dependency path
- Chain length
- Cluster identifier
- Aggregate criticality score
- Maximum latency
- Critical service involvement flag
- Detection timestamp

Overall results must include:
- All detected issues
- Total count
- Clusters analyzed
- Services examined
- Connections traversed
- Analysis duration
- Critical issue flag
- Cluster membership sets

### Performance Requirements

| Topology Size | Nodes | Edges | Clusters | Max Time |
|--------------|-------|-------|----------|----------|
| Small | 50 | 120 | 1-3 | <10ms |
| Medium | 500 | 1,500 | 5 | <100ms |
| Large | 5,000 | 15,000 | 20 | <800ms |

- **Computational Complexity:** O(V + E) - linear with graph size
- **Memory Usage:** O(V + E) - linear with graph size
- **Scaling:** Performance must degrade linearly, not quadratically

### State Management Requirements

Must maintain three types of tracking:

1. **Global Tracking:** Information persisting across entire analysis
2. **Local Tracking:** Information specific to individual exploration paths
3. **Cluster Tracking:** Information identifying topology partitions

**Critical:** These mechanisms must not interfere with each other. Exploration of one partition must not corrupt analysis of another.

### Edge Case Coverage

Must correctly handle:
- Topologies with 1 to N isolated partitions
- Services with no connections (partition size = 1)
- Partitions containing only self-referential dependencies
- Partitions with no circular patterns
- Mixed topologies (some partitions with issues, some without)
- Varying partition sizes (1 to 1000+ services)
- Empty graphs
- Single-node graphs


## Tech Stack

### Core Technologies
- **Language:** Python 3.10 - 3.11
- **Type System:** Full type annotations with `typing` module
- **Data Structures:** `dataclasses`, `enum`, `collections`

### Standard Library Only
```python
from typing import List, Set, Tuple, Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import time
```

### Constraints
- No external graph libraries
- No NumPy, NetworkX, or similar dependencies
- Standard library only
- Must be self-contained and production-ready

---

## Prohibited Approaches

The following are explicitly forbidden:

### Algorithm Restrictions
- Strongly connected component algorithms (Tarjan's, Kosaraju's)
- Union-Find without proper cycle detection
- Breadth-first search approaches
- Minimum spanning tree algorithms
- Connectivity-only algorithms

### Implementation Restrictions
- Modifying input topology during analysis
- Approximate or sampling-based analysis
- External graph processing libraries
- Changing helper method implementations
- Ignoring edge directionality
- O(V²) or worse computational complexity

---

## Environment Constraints

- **Thread Safety:** Must support concurrent topology analysis
- **Determinism:** Same input must always produce same output order
- **Memory Safety:** No memory leaks, proper cleanup
- **Error Handling:** Maintains existing validation and error reporting




