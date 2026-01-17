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
docker compose run --rm app-before npm test
```

**Expected behavior:**
- Functional tests: ❌ FAIL (expected - no implementation)

### Run tests (after – expected all pass)
```bash
# We point ts-node to the after configuration
docker compose run --rm app-after npm test
```

**Expected behavior:**
- Functional tests: ✅ PASS (implementation complete)

