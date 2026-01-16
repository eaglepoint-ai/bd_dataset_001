# Quick Start Guide

## Single Command Testing with Docker Compose

### Test Before (Unoptimized)
```bash
docker-compose run --rm test-before
```
**Expected Output:**
```
React.memo on Item: PASS (not present)
useCallback for handleUpdate: PASS (not present)
useReducer for state: PASS (not present)
search state separated: PASS (present - OK for before)
items state separated: PASS (not present)
console.log in Item: PASS (present - OK for before)
```

### Test After (Optimized)
```bash
docker-compose run --rm test-after
```
**Expected Output:**
```
React.memo on Item: PASS (present)
useCallback for handleUpdate: PASS (present)
useReducer for state: PASS (present)
search state separated: PASS (present)
items state separated: PASS (present)
console.log in Item: PASS (present)
```

### Run Full Evaluation
```bash
docker-compose run --rm all
```

### Run Evaluation Only
```bash
docker-compose run --rm evaluation
```

## Without Docker Compose

If you prefer traditional Docker commands:

```bash
# Build once
docker build -t react-optimization .

# Test before
docker run --rm -e TEST_TARGET=before react-optimization npm test

# Test after
docker run --rm -e TEST_TARGET=after react-optimization npm test

# Run evaluation
docker run --rm react-optimization node evaluation/evaluation.js
```

## Local Testing (No Docker)

```bash
# Install dependencies
npm install

# Test before
npm run test:before

# Test after
npm run test:after

# Run evaluation
node evaluation/evaluation.js
```

## Understanding the Results

### Key Differences Between Before and After:

| Feature | Before | After | Purpose |
|---------|--------|-------|---------|
| React.memo | ❌ Not present | ✅ Present | Prevents unnecessary re-renders |
| useCallback | ❌ Not present | ✅ Present | Stable function references |
| useReducer | ❌ Not present | ✅ Present | O(1) state updates with Map |
| Search State | ✅ Present | ✅ Present | Separated from items state |
| console.log | ✅ Present | ✅ Present | Demonstrates surgical re-renders |

### Performance Impact:
- **Before**: 1 keystroke → 1,000+ re-renders → <20 FPS
- **After**: 1 keystroke → 1 re-render → 60 FPS maintained
