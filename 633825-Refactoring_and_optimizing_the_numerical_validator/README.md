# Refactoring and Optimizing the Numerical Validator

A C++ refactoring project demonstrating the transformation of an over-engineered "Numerical Integrity Engine" into a clean, optimized implementation. The system validates if a number is a power of two, showcasing the impact of code simplification on maintainability and performance.

---

## 🐳 Quick Start (Docker)

### Run Tests

```bash
# Test original implementation (expects structural failures)
docker compose run --rm test_original

# Test optimized implementation (expects all tests to pass)
docker compose run --rm test_optimized

# Run full evaluation and generate report
docker compose run --rm evaluation
```

---

## 🚀 Local Development

If you prefer to run without Docker:

```bash
# Compile tests
g++ -std=c++17 -o test.exe ./tests/main.cpp

# Run original tests
./test.exe test_original

# Run optimized tests
./test.exe test_optimized

# Run evaluation
g++ -std=c++17 -o evaluation.exe ./evaluation/evaluation.cpp
./evaluation.exe
```

---

## 📊 Test Suite Overview

The test suite validates both implementations across:

| Test Category | Count | Key Validations |
|--------------|-------|----------------|
| Structural | 1-3 | No deque, no interfaces, max 1 class/struct |
| Functional | 12 | Edge cases (0, negatives, INT64_MIN), powers of 2, non-powers |
| Compile-time | 1 | constexpr validation (optimized only) |

### Expected Results:

- **Original**: 3 structural failures (uses deque, interfaces, multiple classes)
- **Optimized**: All tests pass (clean structure, correct functionality)

---

## 📁 Folder Structure

```
.
├── repository_before/
│   └── main.cpp              # Over-engineered implementation
├── repository_after/
│   ├── main.cpp              # Clean main program
│   └── ScalarIntegrityService.hpp  # Optimized validator
├── tests/
│   └── main.cpp              # Test suite with structural checks
├── evaluation/
│   ├── evaluation.cpp        # Automated evaluation runner
│   └── YYYY-MM-DD/          # Timestamped reports
│       └── HH-MM-SS/
│           └── report.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🎯 Key Features

### Test Modes

- **test_original**: Validates the bloated implementation
- **test_optimized**: Validates the refactored implementation
- **--interactive**: Manual testing mode (input numbers, get True/False)

### Structural Validation

The test suite enforces clean code principles:
- ❌ No `std::deque` usage
- ❌ No interface classes (classes starting with `I`)
- ❌ Maximum 1 class or struct per file

### Evaluation Report

Generated JSON report includes:
- Run ID and timestamps
- Test results for both implementations
- Pass/fail counts
- Duration metrics

---

## 📝 Example Output

### Original Implementation
```
=== ScalarIntegrityService ORIGINAL ===
[FAIL] Structural check: ./repository_before/main.cpp (no deque)
[FAIL] Structural check: ./repository_before/main.cpp (no interface)
[FAIL] Structural check: ./repository_before/main.cpp (max 1 class/struct)
[PASS] 0 is invalid
...
3 FAILED, 12 PASSED (15 tests)
```

### Optimized Implementation
```
=== ScalarIntegrityService OPTIMIZED ===
[PASS] Structural check: ./repository_after/ScalarIntegrityService.hpp (clean)
[PASS] 0 is invalid
...
ALL TESTS PASSED (14 tests)
```

---

## 🔧 Requirements

- C++17 compiler (g++ recommended)
- Docker & Docker Compose (for containerized execution)
- Standard C++ libraries only
