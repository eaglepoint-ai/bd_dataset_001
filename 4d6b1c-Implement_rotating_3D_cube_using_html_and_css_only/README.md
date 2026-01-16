# Implement rotating 3D cube using html and css only

This repository demonstrates a 3D rotating cube implementation using HTML and CSS. The `repository_before` directory represents the initial state, while `repository_after` contains the completed implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

There are no tests for the initial state.

```bash
# No tests to run
```

### 2. Run Tests for `repository_after`

```bash
docker compose run --rm tests pnpm test
```

### 3. Run Evaluations

```bash
docker compose run --rm tests python3 ../evaluation/evaluation.py
```

## Projects

| Directory            | Description                                    |
| -------------------- | ---------------------------------------------- |
| `repository_before/` | Initial state (empty)                          |
| `repository_after/`  | Completed implementation of the 3D cube        |
| `tests/`             | Playwright tests for the 3D cube               |
| `evaluation/`        | Evaluation script to verify the implementation |
