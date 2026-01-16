# Trajectory: Refactoring DFS from Recursive to Iterative Approach

## 1. Audit the Original DFS Code
- Reviewed the recursive DFS implementation.
- Observed scaling issues:
  - Deep recursion could cause **stack overflow** for large graphs.
  - Recursion depth was tracked but could be inefficient for very large graphs.
  - Memory usage was implicit in the call stack, making **space complexity unclear**.
  - Edge classification, discovery/finish timestamps, and callbacks were tightly coupled with recursion, limiting flexibility.

## 2. Define Performance and Correctness Goals
- **Performance Goals**:
  - Avoid recursion and use an explicit **stack** to prevent stack overflow.
  - Ensure **space usage scales linearly with number of nodes** (`O(V)`).
  - Preserve DFS traversal order and maintain stable processing for pre-order and post-order phases.
- **Correctness Goals**:
  - Keep **edge classification** accurate (`tree`, `back`, `forward`, `cross`, `parent`).
  - Maintain **discovery and finish timestamps**.
  - Keep **callback functionality** intact for each DFS phase.
  - Preserve **parent tracking** for path reconstruction.

## 3. Design the Iterative Approach
- Introduce an explicit **stack** to replace recursion.
- Stack entries should store:
  - Current node
  - Parent node
  - Recursion depth (for callbacks)
  - DFS phase (`discovery` or `completion`)
  - Neighbor index (for exploration tracking)
- The main DFS loop will:
  1. Pop the stack.
  2. Check the phase (`discovery` or `completion`).
  3. Process the node:
     - For discovery phase:
       - Record timestamp and mark node as visited.
       - Trigger pre-order callback.
       - Push completion phase onto stack.
       - Push neighbors in reverse order for correct DFS traversal.
     - For completion phase:
       - Record finish timestamp.
       - Trigger post-order callback.

## 4. Handle Edge Classification
- While iterating over neighbors:
  - **Tree edge**: if neighbor is unvisited.
  - **Back edge**: if neighbor is visited and not parent, and discovery timestamp indicates a cycle.
  - **Parent edge**: if neighbor is the parent node.
- Preserve the **order of callbacks** for tree and back edges, mimicking the original recursive DFS behavior.

## 5. Preserve Discovery and Finish Timestamps
- Use a monotonic counter to simulate timestamps.
- Record **discovery time** when a node is first processed in the discovery phase.
- Record **finish time** when a node is processed in the completion phase.

## 6. Maintain Callback Functionality
- Ensure the iterative DFS triggers callbacks exactly as in recursive DFS:
  - Pre-order callback during discovery.
  - In-order or exploration callback for tree edges.
  - Cycle detection callback for back edges.
  - Post-order callback during completion.
- Context dictionary should include:
  - Phase
  - Depth
  - Discovery time
  - Finish time
  - Neighbor index
  - Total neighbors
  - Cycle info (if applicable)

## 7. Validate Correctness
- Run unit tests comparing:
  - Node visitation order.
  - Discovery and finish timestamps.
  - Edge classifications.
  - Callback invocations.
- Use linear and cyclic graphs to verify edge cases (cycles, disconnected graphs, linear chains).

## 8. Measure Performance and Space
- Track peak memory usage:
  - Ensure it scales **linearly with number of nodes** (`O(V)`).
  - Explicit stack replaces implicit call stack to prevent stack overflow.
- Track execution time:
  - Ensure **time complexity remains O(V + E)** as in recursive DFS.

## 9. Document and Transferable Lessons
- Refactoring from recursive to iterative DFS follows a clear **thinking trajectory**:
  1. Audit the code and identify scaling problems.
  2. Define performance and correctness constraints.
  3. Redesign the traversal using an explicit stack.
  4. Preserve all DFS metadata and callback functionality.
  5. Validate with comprehensive tests.
  6. Measure performance improvements (time and space).
- This trajectory can be reused for other recursive-to-iterative refactors or stack-based algorithm optimizations.
- Key transferable skills:
  - Breaking recursion into explicit stack logic.
  - Preserving algorithmic behavior while improving scalability.
  - Maintaining modularity and metadata propagation in iterative implementations.

## Resources
- [Recursive vs Iterative DFS in Python](https://medium.com/@gautamkrishna.mooppil.dev/graph-series-depth-first-search-dfs-recursive-vs-iterative-approach-in-python-simple-6437e74d9ae3)
- [Iterative Depth-First Traversal](https://www.geeksforgeeks.org/dsa/iterative-depth-first-traversal/)
