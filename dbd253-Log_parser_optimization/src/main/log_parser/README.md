# Java Log Parser Optimization

A production-ready, optimized Java library designed to parse application logs efficiently (O(n)) and robustly. Features error type aggregation, constant memory usage, and zero external dependencies.

---

## 🐳 Quick Start (Docker)

If you prefer to run commands manually, use the following steps:

### 1. Build and Run

```bash
# Start the container (optional, for persistent background use)
docker compose up -d

# Or run specific tasks directly (container creates and destroys automatically with --rm)
```

# run evaluation

```bash
docker compose run --rm app java -cp bin com.logparser.Evaluation
```


# run tests

```bash
docker compose run --rm app java -cp bin com.logparser.ComprehensiveTests
```

## 🚀 Automation Scripts

To simplify your workflow, three bash scripts are provided to handle everything from installation to demo execution:

- **`./build.sh`** Automatically builds the Docker image.
- **`./runner.sh`** Runs the full lifecycle: Starts the container, executes **unit tests**, runs the **performance evaluation**, and saves a timestamped `report.json`.
- **`./run_main.sh`** A quick-start script to see the library in action. It runs the evaluation confirming the optimization results.

---

# Run the main demo (example)

### We use the cp bin to ensure correct classpath resolution

## Standard Demo Output:

### Demo

```bash
docker compose run --rm app java -cp bin com.logparser.Evaluation
```

# Test Suite Overview

## The tests validate the following key areas:

```bash
Test Group,Count,Key Validations
Basic Parsing,1,"Correct extraction of aggregated error counts."
Edge Cases,2,"Handling of empty lists, nulls, and null/empty strings."
Robustness,1,"Graceful handling of malformed log lines."
Performance,1,"Verifies O(n) processing of 1,000,000 log lines in < 2s."
```

# folder structure

```
.
├── repository_after/
│   └── src/
│       └── main/java/com/logparser/
│           ├── LogParser.java     # Core Optimized Parser
│           └── Evaluation.java    # Evaluation & Test Runner
├── evaluation/
│   └── reports/               # Generated JSON reports
├── instances/                 # Sample data
├── Dockerfile
├── docker-compose.yml
├── runner.sh
├── build.sh
├── run_main.sh
└── README.md
```
