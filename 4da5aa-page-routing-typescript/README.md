# Mechanical Refactor: Page Routing System

This dataset task contains a production-style TypeScript function with intentional quirks.
The objective is **pure structural de-duplication** while preserving **bit-for-bit** runtime behavior.

## Folder layout

- `repository_before/` original implementation (empty/failing state)
- `repository_after/` mechanically refactored implementation (working solution)
- `tests/` equivalence + invariants tests
- `patches/` diff between before/after

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected some failures)
```bash
# We point ts-node to the before configuration
docker compose run --rm -e TS_NODE_PROJECT=tsconfig.before.json app npm test
```

**Expected behavior:**
- Functional tests: ❌ FAIL (expected - no implementation)

### Run tests (after – expected all pass)
```bash
# Default configuration points to repository_after
docker compose run --rm app npm test
```

**Expected behavior:**
- Functional tests: ✅ PASS (implementation complete)

## Run locally

### Install dependencies
```bash
npm install
```

### Run all tests
```bash
# Run against repository_after (default)
npm test

# Run against repository_before
# On Windows/Bash:
cross-env TS_NODE_PROJECT=tsconfig.before.json npm test
# Or if you don't have cross-env installed globally, just set the env var:
# Windows PowerShell:
# $env:TS_NODE_PROJECT="tsconfig.before.json"; npm test
# Bash:
# TS_NODE_PROJECT=tsconfig.before.json npm test
```
