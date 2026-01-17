# Python Input Validation & Error Handling Library

A production-ready, modular library designed to standardize error handling and input validation in Python applications. Features structured error categories, centralized handling, safety decorators, and automated retries.

---

## 🐳 Quick Start (Docker)

If you prefer to run commands manually, use the following steps:

### 1. Build and Run

```bash
# Start the container (optional, for persistent background use)
docker compose up -d

# Or run specific tasks directly (container creates and destroys automatically with --rm)
```

# run tests (quick validation)

```bash
docker compose run --rm input-validation python -m pytest tests/
```

# Run evaluation script

```bash
docker compose run --rm input-validation python evaluation/evaluation.py
```

## 🚀 Automation Scripts

To simplify your workflow, three bash scripts are provided to handle everything from installation to demo execution:

- **`./build.sh`** Automatically builds the Docker image.
- **`./runner.sh`** Runs the full lifecycle: Starts the container, executes **30 unit tests**, runs the **evaluation script**, and saves a timestamped `report.json`.
- **`./run_main.sh`** A quick-start script to see the library in action. It runs the demo script showcasing validation, error handling, and retries.

---

# Run the main demo (example)

### We use the -m flag to ensuring correct path resolution

## Standard Demo Output:

### Demo

```bash
docker compose run --rm input-validation python repository_after/main.py
```

# Test Suite Overview

## The 30 failing/passing tests validate the following key areas:

```bash
Test Group,Count,Key Validations
Enums,2,"ErrorCategory and ErrorSeverity integrity."
Error Models,5,"CategorizedError serialization and default attributes."
Validators,12,"Email regex, range checks, length constraints, and type enforcement."
Handlers,5,"Log filtering, stats tracking, history buffer, and graceful shutdown."
Decorators,5,"Safe execution logic, retry backoff, and category filtering."
Integration,1,"End-to-end flow from validation failure to handler logging."
```

# folder structure

```
.
├── repository_after/
│   ├── error_handling_lib/    # Core Library
│   │   ├── enums/             # Error types & severity
│   │   ├── errors/            # Categorized exception classes
│   │   ├── validators/        # Input validation logic
│   │   ├── handlers/          # Central error processing
│   │   └── decorators/        # @safe_execute & @retry_on_error
│   └── main.py                # Demo script
├── tests/                     # Pytest suite
├── evaluation/
│   └── evaluation.py          # Safety evaluation script
├── Dockerfile
├── runner.sh
├── build.sh
├── run_main.sh
├── requirements.txt
└── README.md
```
