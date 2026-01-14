# Redux TypeScript Refactoring Task

This task involves refactoring a JavaScript Redux codebase into production-grade TypeScript, ensuring compliance with 13 critical TypeScript and Redux requirements.

## Structure

- `repository_before/`: Original JavaScript Redux code (baseline)
- `repository_after/`: Refactored TypeScript Redux code (optimized)
- `tests/`: Test suite
  - `test_simple.js`: Smoke tests (validate basic functionality)
  - `test_compliance.js`: Compliance tests (enforce 13 requirements)
  - `test_redux_behavior.js`: Runtime behavior tests
- `evaluation/`: Evaluation scripts
  - `evaluation.py`: Standard evaluation script (generates reports)
  - `reports/`: Generated evaluation reports
- `instances/`: Sample/problem instances (JSON)
- `patches/`: Patches for diffing
- `trajectory/`: Notes and write-up (Markdown)

## Requirements

The refactored code must meet all 13 critical requirements:

1. Explicitly type all functions, parameters, and return values
2. No implicit any
3. Create interfaces/types for objects, state, and API responses
4. Use optional chaining for potentially undefined properties
5. Use Record for dictionary/map-like objects
6. Use index signatures for dynamic keys
7. Use `as const` for action type constants
8. Define discriminated union types for actions
9. Type reducer's state, action, and return type
10. Type thunk actions with proper Dispatch
11. Use `unknown` instead of `any` for truly unknown values
12. Maintain original functionality
13. Ensure imports continue to work correctly

## Automated Evaluation Pipeline

The repository is configured for automated evaluation with the following pipeline:

### Evaluation Commands

The evaluation platform runs these commands from `repository_after/`:

1. **Before tests command:**
   ```bash
   npm install && npm run build
   ```

2. **After before command:**
   ```bash
   npm run lint && npm run type-check
   ```

3. **Main evaluation command:**
   ```bash
   npm run test
   ```

### Scripts in package.json

The `repository_after/package.json` includes:
- `build`: Builds the TypeScript React application
- `lint`: Validates code quality (TypeScript strict mode enforced)
- `type-check`: Runs TypeScript compiler type checking
- `test`: Runs the evaluation script (`evaluation/evaluation.py`)

## Running Tests

### Local Testing

```bash
# Run smoke tests
TARGET=before node tests/test_simple.js
TARGET=after node tests/test_simple.js

# Run compliance tests
TARGET=before node tests/test_compliance.js
TARGET=after node tests/test_compliance.js

# Run evaluation
python3 evaluation/evaluation.py
```

### Docker Testing

```bash
# Build Docker image
docker build -f Dockerfile.test -t redux-typescript .

# Run tests in Docker
docker run --rm -e TARGET=before redux-typescript node tests/test_compliance.js
docker run --rm -e TARGET=after redux-typescript node tests/test_compliance.js

# Run evaluation in Docker
docker run --rm redux-typescript python3 evaluation/evaluation.py
```

### Docker Compose

```bash
# Build test image
docker-compose -f docker-compose.test.yml build

# Run compliance tests
docker-compose -f docker-compose.test.yml run --rm test_compliance_before
docker-compose -f docker-compose.test.yml run --rm test_compliance_after

# Run full evaluation
docker-compose -f docker-compose.test.yml run --rm test_evaluation
```

## Expected Results

### Before (JavaScript, non-compliant)
- Compliance tests: **FAIL** (1-2 passed, 11-12 failed)
- Smoke tests: **PASS** (code is runnable)
- Overall: **Non-compliant**

### After (TypeScript, compliant)
- Compliance tests: **PASS** (13/13 passed)
- Smoke tests: **PASS** (code is runnable)
- Overall: **Compliant**

## Evaluation Report

The evaluation script generates standardized reports in the following structure:
```
evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

All report files are gitignored (not tracked in the repository). The reports folder structure is preserved via `.gitkeep`.

```json
{
  "run_id": "...",
  "started_at": "...",
  "finished_at": "...",
  "duration_seconds": 0.0,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {
      "passed": false,
      "return_code": 1,
      "output": "..."
    },
    "metrics": {}
  },
  "after": {
    "tests": {
      "passed": true,
      "return_code": 0,
      "output": "..."
    },
    "metrics": {}
  },
  "comparison": {
    "passed_gate": true,
    "improvement_summary": "..."
  },
  "success": true,
  "error": null
}
```

## Dependencies

- **Node.js**: >= 20.0.0
- **Python**: >= 3.11 (for evaluation script)
- **Docker**: >= 20.10 (optional)
