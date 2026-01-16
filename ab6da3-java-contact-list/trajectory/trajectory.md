# Trajectory (Thinking Process for Correctness + Deterministic Evaluation)

## 1. Audit the Original Code (Identify Failure Modes)
I audited `repository_before/Contacts.java` to identify hard failures and correctness violations:
- **Guaranteed runtime crash**: trie `root` is initialized as `null`, and each node’s `children` map is also `null`, so any access like `current.getChildren().get(...)` throws.
- **Incorrect insert semantics**: newly created nodes are never linked into the trie (`put` is missing), so the structure can’t be traversed.
- **Incorrect prefix counts**: the per-node counter is never incremented; counts are not propagated along the path during `add`.
- **Input parsing bugs**: mixes `nextInt()` with `nextLine()`, reads two lines per command, and loops `<= n` (off-by-one).
- **String comparison bug**: uses `==` for `"add"` which is not a content comparison in Java.

These are not “edge cases”; they are structural correctness failures.

## 2. Define a Correctness Contract (Before Coding)
I defined the behavioral contract that must remain unchanged:
- **I/O contract**: read `n`, then process exactly `n` commands, printing one integer per `find`.
- **Operations**:
  - `add <word>` inserts a contact name.
  - `find <prefix>` returns how many inserted contacts start with `<prefix>`.
- **Data structure constraints**:
  - Use `HashMap<Character, TrieNode>` for children.
  - Maintain efficient prefix counting with a per-node counter.
- **Non-negotiables**:
  - Deterministic execution.
  - No runtime exceptions for valid inputs.
  - Time complexity \(O(L)\) per operation where \(L\) is word length.

## 3. Design a Trie That Enforces Initialization and Count Propagation
I designed the trie around two invariants:
- **Initialization invariant**: every `TrieNode` must allocate its `HashMap` on construction (never `null`).
- **Counting invariant**: on each `add`, increment a `prefixCount` on every node along the path (so `find(prefix)` is a single traversal + constant-time return).

This prevents both NullPointerExceptions and “partial prefix count” bugs.

## 4. Fix Input Parsing and Command Comparisons Without Changing External Behavior
To preserve external behavior while eliminating parsing defects:
- Use token-based parsing (`Scanner.nextInt()`, then `Scanner.next()` for `op` and `contact`) so input can be space- or newline-separated.
- Use `"add".equals(op)` / `"find".equals(op)` for deterministic string comparison.
- Loop `for (int i = 0; i < n; i++)` to process exactly `n` commands.

## 5. Implement the Correctness Fixes (Minimal, Targeted Changes)
In `repository_after/Contacts.java`:
- Root node is always constructed (`new TrieNode()`).
- Each node contains `final HashMap<Character, TrieNode> children = new HashMap<>()`.
- `addWord` creates missing nodes, links them with `put`, and increments `prefixCount` along the traversal.
- `findWord` returns `0` on missing paths and returns the terminal node’s `prefixCount` otherwise.

## 6. Verification & Enforcement (Not Just “It Runs”)
I enforced correctness with deterministic functional tests that compile and execute the Java program:
- Tests run against either repo selected by `TEST_REPO_PATH`.
- They assert:
  - canonical sample behavior (`hack` / `hackerrank`)
  - repeated inserts affect counts deterministically
  - tokenized input works (space-separated input)

## 7. Deterministic Docker Evaluation (Before/After + Report)
To match the dataset’s expected “before/after/evaluation” workflow:
- `docker-compose.yml` exposes:
  - `test-before` (expected fail)
  - `test-after` (expected pass)
  - `evaluation` (runs both, writes a report)
- `evaluation/evaluation.py`:
  - runs pytest twice (before/after),
  - writes `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`,
  - writes `evaluation/reports/latest.json`,
  - exits 0 only if **before fails and after passes** (gate).

This ensures the improvement is mechanically verifiable and reproducible.

---

## Trajectory Transferability Notes
The structure is reusable across task types because the nodes remain stable:
**Audit → Contract → Design → Execute → Verify → Report**.

### Correctness Fixes → Performance Optimization
- Audit becomes profiling/hot path identification
- Contract becomes latency/SLO constraints
- Design includes caching/indexing/algorithmic changes
- Verification uses benchmarks and regression thresholds

### Correctness Fixes → Testing
- Audit becomes coverage + risk analysis
- Contract becomes test strategy/invariants
- Design produces fixtures and deterministic harnesses
- Verification emphasizes determinism and edge cases

### Correctness Fixes → Code Generation
- Audit becomes requirements parsing + I/O constraints
- Contract becomes generation constraints + invariants
- Design defines minimal interfaces + deterministic outputs
- Verification checks style + correctness + reproducibility

## Core Principle (Applies to All)
- Keep the **structure** the same.
- Change only the **focus and artifacts**.
- Always end with enforceable verification and reproducible reporting.
