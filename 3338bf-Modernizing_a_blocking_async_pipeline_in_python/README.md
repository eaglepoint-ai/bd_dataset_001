# Async Processing Pipeline

This repository demonstrates modernizing a blocking async pipeline in Python. The `repository_before` directory represents the initial state with blocking code, while `repository_after` will contain the optimized, non-blocking implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

```bash
docker compose run --rm tests python repository_before/async_processing_pipeline.py
```

### 2. Run Tests for `repository_after`

```bash
# No command specified
```

### 3. Run Evaluations

```bash
# No command specified
```

## Projects

| Directory            | Description              |
| -------------------- | ------------------------ |
| `repository_before/` | Initial state            |
| `repository_after/`  | Completed implementation |
| `tests/`             | Test suite               |
| `evaluation/`        | Evaluation scripts       |
