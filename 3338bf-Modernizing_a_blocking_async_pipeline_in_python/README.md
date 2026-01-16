# Async Processing Pipeline - Modernization Project

This repository demonstrates the complete refactoring of a legacy async pipeline into a modern Python 3.12+ solution. The project validates compliance with 12 strict requirements including non-blocking concurrency, type safety, memory management, and functional programming patterns.

## Project Overview

- **repository_before/**: Legacy implementation with blocking operations, global state, and no type safety (FAILS 11/12 requirements)
- **repository_after/**: Modern refactored implementation meeting all requirements (PASSES 12/12 requirements)
- **evaluation/**: Automated validation and performance testing harness
- **tests/**: Unit test suite for the refactored implementation

## Requirements Validation

The evaluation script validates all 12 technical requirements:

### Requirements Checklist

| # | Requirement | Before | After |
|---|-------------|--------|-------|
| 1-5 | Non-blocking Concurrency (asyncio.sleep) | ❌ | ✅ |
| 6-7 | Queue-based Data Management (asyncio.Queue) | ❌ | ✅ |
| 8 | Strict Type Hinting with Protocol | ❌ | ✅ |
| 9 | Circular Buffer Pattern (deque with maxlen) | ❌ | ✅ |
| 10-11 | No Global State | ❌ | ✅ |
| 12 | No for/while Loops (Use Comprehensions) | ✅ | ✅ |

**Result:**
- **Before Implementation**: 1/12 requirements passed ❌
- **After Implementation**: 12/12 requirements passed ✅

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- Python 3.11+ (for local runs)

## Docker Execution Instructions

### Using Docker Compose (Recommended)

Docker Compose provides convenient service names for each command:

```bash
# Run the legacy "before" implementation
docker-compose up before

# Run the refactored "after" implementation
docker-compose up after

# Run full validation (before + after + performance)
docker-compose up validate

# Run validation for before only (should FAIL)
docker-compose up validate-before

# Run validation for after only (should PASS)
docker-compose up validate-after

# Run performance tests only
docker-compose up performance

# Run unit tests
docker-compose up tests

# Run comparison script
docker-compose up compare
```

### Using Docker Run (Alternative)

You can also use `docker run` commands directly:

### Quick Start - Full Validation

Run the complete evaluation with requirement validation for both implementations:

```bash
docker build -t async-pipeline .
docker run --rm async-pipeline python evaluation/evaluation.py --validate-before --validate-after --trials 3 --items 5 --buffer 3
```

**Expected Output:**
- Before: ❌ FAILS 11/12 requirements
- After: ✅ PASSES 12/12 requirements
- Performance comparison showing concurrent execution

### Running the Evaluation (Comparison of Before and After)

Build the Docker image and run the evaluation harness with requirement validation (report will be inside the container in `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`):

```bash
docker build -t async-pipeline .

# Validate BEFORE implementation (should FAIL requirements)
docker run --rm async-pipeline python evaluation/evaluation.py --validate-before --trials 3 --items 5 --buffer 3

# Validate AFTER implementation (should PASS all requirements)
docker run --rm async-pipeline python evaluation/evaluation.py --validate-after --trials 3 --items 5 --buffer 3

# Validate BOTH implementations
docker run --rm async-pipeline python evaluation/evaluation.py --validate-before --validate-after --trials 3 --items 5 --buffer 3
```

### Running Repository Before (Legacy) in Docker

```bash
docker run --rm async-pipeline python repository_before/async_processing_pipeline.py
```

**Expected Output:**
```
Processing 0...
Processing 1...
Processing 2...
Processing 3...
Processing 4...
['Finished 0', 'Finished 1', 'Finished 2', 'Finished 3', 'Finished 4']

Total time taken: 2.03 seconds
```

> **Note:** The before (legacy) implementation uses `asyncio.to_thread()` which achieves concurrency through threads, but it violates modern async best practices. It uses global state (`DATA_STORE`), has no type hints, no circular buffer, and is not truly async. Only the refactored version meets all 12 requirements.
> 
> **❓ Why do both outputs look the same?** See [WHY_OUTPUTS_LOOK_SAME.md](WHY_OUTPUTS_LOOK_SAME.md) for a detailed explanation of the hidden differences.

### Running Repository After (Refactored) in Docker

```bash
docker run --rm async-pipeline python repository_after/refactored.py
```

**Expected Output:**
```
Processing 0...
Processing 1...
Processing 2...
Processing 3...
Processing 4...
['Finished 0', 'Finished 1', 'Finished 2', 'Finished 3', 'Finished 4']
```

> **Note:** The refactored implementation uses pure async/await with `asyncio.sleep()`, proper type hints, `asyncio.Queue`, circular buffer with `deque(maxlen=...)`, and no global state. It passes all 12 requirements.

> **Tip:** To save evaluation reports to your host machine, add a volume mount for the `reports` folder:
> - On Windows (CMD or PowerShell):
>   ```bash
>   docker run --rm -v "C:/absolute/path/to/evaluation/reports:/app/evaluation/reports" async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
>   ```
> - On Linux/macOS:
>   ```bash
>   docker run --rm -v $(pwd)/evaluation/reports:/app/evaluation/reports async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
>   ```
> Replace the path with your actual project directory if needed.

### Running Individual Stages

#### Full Evaluation with Validation

Run the complete evaluation with requirement validation:

```bash
py evaluation/evaluation.py --validate-before --validate-after --trials 3 --items 5 --buffer 3
```

#### Validation Only (No Performance Tests)

Validate the before implementation:
```bash
py evaluation/evaluation.py --validate-before --trials 1 --items 1 --buffer 1
```

Validate the after implementation:
```bash
py evaluation/evaluation.py --validate-after --trials 1 --items 1 --buffer 1
```

#### Performance Only (No Validation)

Run performance tests without requirement validation:

```bash
py evaluation/evaluation.py --trials 3 --items 5 --buffer 3
```

#### Tests Only (After Implementation)

Run the unit test suite for the refactored implementation:

```bash
py -m tests.test_refactored
```

#### Repository Before Analysis

Run the legacy pipeline for baseline behavior:

```bash
python repository_before/async_processing_pipeline.py
```

#### Repository After Analysis

Run the refactored pipeline directly:

```bash
python repository_after/refactored.py
```

### Viewing Results

- **Evaluation reports** are saved in `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json` with nested date/time organization
- **Validation results** show which requirements passed/failed for each implementation
- **Performance metrics** include mean, min, max elapsed times and buffer storage counts
- **Test results** are printed to the console

#### Sample Report Structure

```json
{
  "before_validation": {
    "total_requirements": 12,
    "passed": 1,
    "failed": 11,
    "requirements": { ... }
  },
  "after_validation": {
    "total_requirements": 12,
    "passed": 12,
    "failed": 0,
    "requirements": { ... }
  },
  "summary": {
    "trials": 3,
    "mean_elapsed": 2.005,
    "stored_counts": [3, 3, 3]
  }
}
```

## Key Improvements in Refactored Version

### 1. Non-blocking Concurrency
- **Before:** `time.sleep(2)` wrapped in `asyncio.to_thread()` (uses OS threads)
- **After:** `await asyncio.sleep(2)` (pure async, no thread overhead)

### 2. Type Safety
- **Before:** No type hints
- **After:** Full type hints with `typing.Protocol` for interface contracts

### 3. Memory Management
- **Before:** Unbounded `DATA_STORE = []` list (memory leak risk)
- **After:** `deque(maxlen=buffer_size)` circular buffer (fixed memory)

### 4. State Management
- **Before:** Global mutable state (`DATA_STORE`)
- **After:** Encapsulated in `DataManager` class

### 5. Data Flow
- **Before:** Direct list comprehension with gather
- **After:** Producer/consumer pattern with `asyncio.Queue`

### 6. Code Quality
- **Before:** No clear separation of concerns
- **After:** Clean architecture with Protocol, DataManager, and AsyncDataProcessor classes

## Technologies Used

- Python 3.11+
- Docker
- asyncio, collections, typing (Python stdlib)
- pytest (for testing)

## Conclusion

This project demonstrates the transformation of a blocking, stateful async pipeline into a modern, type-safe, non-blocking, and memory-efficient solution using Python 3.12+ features. The evaluation harness validates all 12 requirements and ensures correctness and performance improvements are measurable and reproducible.

**Validation Results:**
- ❌ Before: 1/12 requirements passed (FAILS)
- ✅ After: 12/12 requirements passed (PASSES)

## Projects

| Directory            | Description              |
| -------------------- | ------------------------ |
| `repository_before/` | Initial state            |
| `repository_after/`  | Completed implementation |
| `tests/`             | Test suite               |
| `evaluation/`        | Evaluation scripts       |

## Docker Commands Summary

### 1. Before Test Command (Legacy - FAILS Requirements)
```bash
docker run --rm async-pipeline python repository_before/async_processing_pipeline.py
```
**Expected:** Runs but violates 11/12 requirements (global state, no type hints, no circular buffer, etc.)

### 2. After Test Command (Refactored - PASSES Requirements)
```bash
docker run --rm async-pipeline python repository_after/refactored.py
```
**Expected:** Runs and meets all 12/12 requirements

### 3. Validation Commands

**Validate Before (should FAIL):**
```bash
docker run --rm async-pipeline python evaluation/evaluation.py --validate-before --trials 3 --items 5 --buffer 3
```
**Expected Output:** ❌ Requirements Passed: 1/12

**Validate After (should PASS):**
```bash
docker run --rm async-pipeline python evaluation/evaluation.py --validate-after --trials 3 --items 5 --buffer 3
```
**Expected Output:** ✅ Requirements Passed: 12/12

**Full Comparison (validates both):**
```bash
docker run --rm async-pipeline python evaluation/evaluation.py --validate-before --validate-after --trials 3 --items 5 --buffer 3
```
**Expected Output:** 
- Before: ❌ 1/12 passed
- After: ✅ 12/12 passed
- Performance metrics for both

### 4. Save Reports to Host Machine

To persist evaluation reports on your local machine:

**Windows (CMD or PowerShell):**
```bash
docker run --rm -v "%cd%\evaluation\reports:/app/evaluation/reports" async-pipeline python evaluation/evaluation.py --validate-before --validate-after --trials 3 --items 5 --buffer 3
```

**Linux/macOS:**
```bash
docker run --rm -v $(pwd)/evaluation/reports:/app/evaluation/reports async-pipeline python evaluation/evaluation.py --validate-before --validate-after --trials 3 --items 5 --buffer 3
```
