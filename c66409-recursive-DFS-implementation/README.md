Iterative DFS Refactor — Enterprise Graph Traversal

This dataset task involves refactoring a recursive DFS implementation into an explicit stack-based iterative version while preserving 100% behavioral equivalence for compliance-critical graph traversal in a financial services system.

Folder Layout

- repository_before/ - Original implementation containing dfs_recursive
- repository_after/ - Refactored implementation containing dfs_iterative
- tests/ - Behavioral verification tests (callbacks, timestamps, ordering)
- patches/ - Diff between recursive and iterative implementations
- evaluation/ - Evaluation runner

Problem Statement

You are a Staff Software Engineer on the Graph Analytics team at a financial services company. Your system processes real-time fraud detection across payment networks with 10M+ nodes and 50M+ edges. The legacy recursive DFS implementation is causing production incidents:

Stack overflow crashes occur 15–20 times daily during deep chain analysis (money laundering detection paths often exceed 25,000 hops)

Memory pressure alerts trigger when analyzing densely connected subgraphs

Inconsistent traversal state causes false negatives in fraud pattern detection

Critical Business Context

Each crash costs approximately $50,000 in missed fraud detection

Compliance requires deterministic, auditable traversal with full callback traceability

This refactor will be deployed to 200+ production servers processing $2B+ daily transaction volume

Technical Debt Background

The implementation evolved from a simple prototype

Over 3 years, engineers added callbacks, cycle detection, path reconstruction, and timestamping without refactoring the recursive core

There are now 47 dependent services, so behavior must remain 100% backward compatible

The goal is to refactor the project to:

Eliminate recursion

Create dfs_iterative with the identical signature

Use an explicit stack

No recursion (direct or indirect)

Preserve exact behavioral equivalence

Same traversal order

Same callback execution order

Same metadata

Same timestamps

Same edge classifications

Maintain compliance-grade determinism

Same input must always produce identical output

No nondeterministic behavior

Requirements
Functional Requirements

Method signature must be identical:

def dfs_iterative(
    self,
    node: str,
    visited: Optional[Set[str]] = None,
    parent: Optional[str] = None,
    callback: Optional[Callable[[str, str, Optional[str], Dict[str, Any]], None]] = None,
    recursion_depth: int = 0
) -> Set[str]


Callback execution protocol must match exactly:

Pre-order (discovery)

In-order (exploration)

Cycle (cycle_detection)

Post-order (completion)

Callbacks must receive correct metadata:

phase

depth

neighbor_index

total_neighbors

visited_count

discovery_time

finish_time

discovery_time_diff

processing_duration

Timestamp Consistency

Must use self._get_timestamp()

discovery_time[node] assigned when first discovered

finish_time[node] assigned when fully processed

Must be monotonic and match recursive ordering

Edge Classification

Tree edge: neighbor not visited

Back edge: neighbor visited and
discovery_time[neighbor] < discovery_time[node]

Parent edge: neighbor equals parent

Must populate self.edge_classification identically.

Visited Order Preservation

self.visited_order must match recursive version exactly

Order is used for compliance reports and audit trails

Algorithmic Constraints

No recursion

Explicit stack required

Time complexity: O(V + E)

Space complexity: O(V)

Deterministic execution

Python standard library only

Prohibited Approaches

sys.setrecursionlimit

Hidden recursion

Threading or multiprocessing

Modifying Graph.__init__

Skipping callbacks

Approximating timestamps

External libraries

Environment Constraints

Python: 3.9–3.11

Memory: Must handle 100k nodes within 512MB

Execution: Single-threaded only

Dependencies: Standard library only

Tech Stack

Language: Python 3.9–3.11

Libraries:

typing

collections

datetime

time

Techniques:

Iterative graph traversal

Explicit stack simulation

Deterministic state machines

Callback-driven architecture

Domain Context:

Graph analytics
Fraud detection systems
High-compliance financial infrastructure