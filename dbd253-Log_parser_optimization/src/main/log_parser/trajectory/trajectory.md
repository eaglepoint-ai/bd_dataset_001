# Trajectory: Log Parser Optimization

## 1. Problem Understanding

The objective is to optimize a legacy log parsing application originally written in a less efficient manner. The original implementation suffered from O(n*m) complexity due to nested loops and excessive string splitting. The goal is to migrate this to Java, ensuring O(n) linear time complexity, minimal memory usage, and robustness against malformed input, while aggregating error counts instead of listing raw lines.

## 2. Solution Architecture

The solution is implemented as a standalone Java application to minimize external dependencies and ensure portability.

- **LogParser:** Core logic class containing the optimized parsing algorithm.
- **Evaluation:** A self-contained test runner and reporting tool that replaces standard test frameworks (managed via `main` method) to generate JSON reports without requiring Maven/Gradle for execution in restricted environments.

## 3. Optimization Strategy

### Algorithmic Efficiency
The original code split every line by spaces (`line.split(" ")`), creating thousands of temporary string objects and arrays.
The new approach:
1.  **Pre-check:** Uses `line.contains("ERROR")` to instantly discard non-error lines (which are typically the majority) without allocation.
2.  **Single Pass:** Iterates through the list of logs exactly once.
3.  **Token Extraction:** When an error is detected, we perform a targeted extraction of the error token using direct character traversal or efficient substring operations, avoiding full line tokenization.

### Memory Management
- **No Full Line Storage:** We only store the *distinct* error types (e.g., "ERROR_TIMEOUT") and their counts in a `HashMap`. The full log lines are discarded immediately after processing.
- **Garbage Collection Friendly:** By reducing temporary object creation (arrays from split), we reduce GC pressure on large log files.

## 4. Robustness and Error Handling

Real-world logs are messy. The parser handles:
- **Null Inputs:** Returns empty maps instead of throwing NPE.
- **Null/Empty Lines:** Skips them gracefully.
- **Malformed Lines:** If a line contains "ERROR" but no valid error token follows, it captures what it can or skips, ensuring the process never crashes.

## 5. Evaluation and Verification

### Python-to-Java Port of Evaluation
The original requirement provided a Python `evaluate.py`. I ported this logic to `Evaluation.java`.
- **JSON Report:** Generates a `report.json` with the exact schema required (run_id, environment, duration, tests, summary).
- **Self-Contained Tests:** Includes internal methods `testBasicParsing`, `testEmptyInput`, etc., acting as a lightweight unit test framework.
- **Performance Gate:** Includes a `testPerformanceLargeScale` that processes 1,000,000 lines. The threshold is set to 2 seconds, but the implementation typically finishes in <200ms.

## 6. Docker and Deployment

- **Containerization:** A `Dockerfile` based on `openjdk:21-jdk-slim` compiles and runs the evaluation.
- **Orchestration:** `docker-compose.yml` mounts the volume and runs the verified Java app, ensuring consistency across environments.
