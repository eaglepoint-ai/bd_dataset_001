# Command Comparison: Before vs After

## ❌ Old Way (Multiple Commands)

### Test Before Implementation:
```bash
docker build -t react-optimization .
docker run --rm -e TEST_TARGET=before react-optimization npm test
```

### Test After Implementation:
```bash
docker build -t react-optimization .
docker run --rm -e TEST_TARGET=after react-optimization npm test
```

**Problems:**
- 2 commands required
- Must remember environment variable syntax
- Must remember image name
- Repetitive and error-prone

---

## ✅ New Way (Single Command with Docker Compose)

### Test Before Implementation:
```bash
docker-compose run --rm test-before
```

### Test After Implementation:
```bash
docker-compose run --rm test-after
```

### Run Evaluation:
```bash
docker-compose run --rm evaluation
```

### Run Full Test Suite:
```bash
docker-compose run --rm all
```

**Benefits:**
- ✅ Single command
- ✅ No environment variables to remember
- ✅ Self-documenting service names
- ✅ Automatic build if needed
- ✅ Clean and simple

---

## Side-by-Side Comparison

| Task | Old Way | New Way |
|------|---------|---------|
| **Test Before** | `docker build -t react-optimization .`<br>`docker run --rm -e TEST_TARGET=before react-optimization npm test` | `docker-compose run --rm test-before` |
| **Test After** | `docker build -t react-optimization .`<br>`docker run --rm -e TEST_TARGET=after react-optimization npm test` | `docker-compose run --rm test-after` |
| **Evaluation** | `docker build -t react-optimization .`<br>`docker run --rm react-optimization node evaluation/evaluation.js` | `docker-compose run --rm evaluation` |
| **Full Suite** | Multiple commands | `docker-compose run --rm all` |

---

## Available Services

The `docker-compose.yml` defines 4 services:

1. **test-before** - Tests unoptimized implementation
   - Sets `TEST_TARGET=before`
   - Runs `npm test`

2. **test-after** - Tests optimized implementation
   - Sets `TEST_TARGET=after`
   - Runs `npm test`

3. **evaluation** - Generates comparison report
   - Runs `node evaluation/evaluation.js`

4. **all** - Runs full test suite
   - Runs `npm test` (defaults to after)
   - Then runs evaluation

---

## Quick Reference

```bash
# Test unoptimized version
docker-compose run --rm test-before

# Test optimized version
docker-compose run --rm test-after

# Generate evaluation report
docker-compose run --rm evaluation

# Run everything
docker-compose run --rm all

# Clean up
docker-compose down --rmi all
```

---

## Expected Outputs

### test-before:
```
Running tests against BEFORE (unoptimized) implementation.
React.memo on Item: PASS (not present)
useCallback for handleUpdate: PASS (not present)
useReducer for state: PASS (not present)
search state separated: PASS (present - OK for before)
items state separated: PASS (not present)
console.log in Item: PASS (present - OK for before)
```

### test-after:
```
Running tests against AFTER (optimized) implementation.
React.memo on Item: PASS (present)
useCallback for handleUpdate: PASS (present)
useReducer for state: PASS (present)
search state separated: PASS (present)
items state separated: PASS (present)
console.log in Item: PASS (present)
```

### evaluation:
```
Report written to /app/evaluation/reports/latest.json
```

### all:
```
Running tests against AFTER (optimized) implementation.
[All tests pass...]
Report written to /app/evaluation/reports/latest.json
```
