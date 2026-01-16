# Java Trie-Based Contacts Manager (Prefix Counting)

## Problem Statement
The baseline Java trie contacts manager:
- Crashes at runtime due to uninitialized trie root and uninitialized `HashMap` child nodes.
- Returns incorrect prefix counts because it does not propagate counts along the trie on insert.
- Has incorrect input parsing and uses incorrect string comparison for commands.

The fixed implementation must:
- Use a `HashMap<Character, TrieNode>` for children.
- Maintain an efficient per-node prefix counter.
- Preserve external behavior (stdin commands, stdout answers).
- Be deterministic and exception-free.

## Repository Layout
- `repository_before/`: baseline (expected to fail tests)
- `repository_after/`: fixed implementation (expected to pass tests)
- `tests/`: pytest-based functional tests that compile + run `Contacts.java`
- `evaluation/`: evaluation script that runs before/after and writes JSON report

## Commands (Docker)
Run tests against baseline (expected to fail):

```bash
docker-compose run --rm test-before
```

Run tests against fixed implementation (expected to pass):

```bash
docker-compose run --rm test-after
```

Run evaluation (runs both, generates report under `evaluation/reports/...`):

```bash
docker-compose run --rm evaluation
```

## Commands (Local, no Docker)
You need:
- Python 3.11+
- Java (JDK 17+) to compile/run `Contacts.java`

Run tests against baseline:

```bash
TEST_REPO_PATH=repository_before pytest -q tests
```

Run tests against fixed implementation:

```bash
TEST_REPO_PATH=repository_after pytest -q tests
```

Run evaluation:

```bash
python evaluation/evaluation.py
```
