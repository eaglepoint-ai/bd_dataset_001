# Trajectory

# BST Refactoring Engineering Trajectory

## Analysis

The original codebase featured an over-engineered Binary Search Tree (BST) with:

* Duplicate insertion traps
* Self-adjusting AVL rotations
* Subtree statistics (size, depth, min/max)
* Snapshots and rollback
* Concurrency locks

The requirements clarified that we needed:

* Standard BST behavior (insert, search, inorder traversal)
* Duplicate counting
* Snapshots with rollback
* Deterministic behavior
* Efficient performance (O(log n) for insert/search, fast snapshot/rollback)

Deconstruction revealed:

1. Rotations were overused and sometimes broken.
2. Duplicate logic incorrectly conflated `>` and `==` cases.
3. Concurrency locks were unnecessary.
4. Snapshot system could be simplified using deep clones.

## Strategy

* Use AVL self-balancing to guarantee logarithmic height and avoid worst-case linear degeneration.
* Keep a `duplicate_count` in node metadata to handle repeated keys cleanly.
* Implement snapshots via deep cloning the root node, storing both tree structure and size.
* Remove unnecessary locks and subtree statistics to simplify code.
* Ensure deterministic behavior by avoiding randomization and maintaining consistent traversal order.

## Execution

1. **Node Design**: Streamlined `BSTNode` class with `key`, `value`, `left`, `right`, `height`, and `metadata` (`duplicate_count`).
2. **Insertion**:

   * First check for duplicates; increment `duplicate_count` if key exists.
   * Otherwise, recursively insert and update heights.
   * Apply AVL rotations (left, right, left-right, right-left) as needed.
3. **Traversal**: Inorder traversal yields each key `duplicate_count` times.
4. **Snapshots**: `create_snapshot` clones the root and stores `_size` in a versioned dictionary.
5. **Rollback**: `rollback(version)` replaces root with cloned snapshot and restores size.
6. **Testing**: Comprehensive `unittest` suite verifying:

   * BST operations, duplicates, snapshots, determinism, height/log guarantees, and memory correctness.
7. **Evaluation Runner**: Script in `evaluation/` folder that:

   * Runs all tests
   * Prints detailed summary
   * Generates `evaluation_report.txt`

## Resources

* [Python `unittest` documentation](https://docs.python.org/3/library/unittest.html)
* [AVL Trees and rotations](https://en.wikipedia.org/wiki/AVL_tree)
* [Python `dataclasses`](https://docs.python.org/3/library/dataclasses.html)
* [Python `TypeVar` and generics](https://docs.python.org/3/library/typing.html)
* Python `deep copy` concepts for snapshot implementation
